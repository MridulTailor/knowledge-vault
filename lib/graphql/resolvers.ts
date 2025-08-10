import { prisma } from "../prisma"
import { hashPassword, verifyPassword, generateToken } from "../auth"
import { GraphQLError } from "graphql"
import type { Prisma } from "@prisma/client"

interface Context {
  user?: {
    userId: string
    email: string
  }
}

const requireAuth = (context: Context) => {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    })
  }
  return context.user
}

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      const user = requireAuth(context)
      return prisma.user.findUnique({
        where: { id: user.userId },
      })
    },

    entries: async (
      _: any,
      args: {
        search?: string
        tagNames?: string[]
        type?: string
      },
      context: Context,
    ) => {
      const user = requireAuth(context)

      const where: Prisma.EntryWhereInput = {
        userId: user.userId,
      }

      if (args.search) {
        where.OR = [
          { title: { contains: args.search, mode: "insensitive" } },
          { content: { contains: args.search, mode: "insensitive" } },
        ]
      }

      if (args.type) {
        where.type = args.type as any
      }

      if (args.tagNames && args.tagNames.length > 0) {
        where.tags = {
          some: {
            tag: {
              name: { in: args.tagNames },
            },
          },
        }
      }

      return prisma.entry.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          tags: {
            include: { tag: true },
          },
          fromRelations: {
            include: { toEntry: true },
          },
          toRelations: {
            include: { fromEntry: true },
          },
        },
      })
    },

    entry: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context)
      return prisma.entry.findFirst({
        where: { id: args.id, userId: user.userId },
        include: {
          tags: { include: { tag: true } },
          fromRelations: {
            include: { toEntry: true },
          },
          toRelations: {
            include: { fromEntry: true },
          },
        },
      })
    },

    tags: async (_: any, __: any, context: Context) => {
      requireAuth(context)
      return prisma.tag.findMany({
        orderBy: { name: "asc" },
      })
    },

    relationships: async (_: any, __: any, context: Context) => {
      const user = requireAuth(context)
      return prisma.relationship.findMany({
        where: { userId: user.userId },
        include: {
          fromEntry: true,
          toEntry: true,
        },
      })
    },
  },

  Mutation: {
    signup: async (_: any, args: { email: string; password: string; name?: string }) => {
      const hashedPassword = await hashPassword(args.password)

      try {
        const user = await prisma.user.create({
          data: {
            email: args.email,
            password: hashedPassword,
            name: args.name,
          },
        })

        const token = generateToken(user)
        return { token, user }
      } catch (error: any) {
        if (error.code === "P2002") {
          throw new GraphQLError("Email already exists")
        }
        throw error
      }
    },

    login: async (_: any, args: { email: string; password: string }) => {
      const user = await prisma.user.findUnique({
        where: { email: args.email },
      })

      if (!user || !(await verifyPassword(args.password, user.password))) {
        throw new GraphQLError("Invalid email or password")
      }

      const token = generateToken(user)
      return { token, user }
    },

    createEntry: async (_: any, args: { input: any }, context: Context) => {
      const user = requireAuth(context)
      const { tagNames, ...entryData } = args.input

      const entry = await prisma.entry.create({
        data: {
          ...entryData,
          userId: user.userId,
          tags: tagNames
            ? {
                create: tagNames.map((name: string) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name },
                      create: { name },
                    },
                  },
                })),
              }
            : undefined,
        },
        include: {
          tags: { include: { tag: true } },
          fromRelations: { include: { toEntry: true } },
          toRelations: { include: { fromEntry: true } },
        },
      })

      return entry
    },

    updateEntry: async (_: any, args: { id: string; input: any }, context: Context) => {
      const user = requireAuth(context)
      const { tagNames, ...updateData } = args.input

      const entry = await prisma.entry.findFirst({
        where: { id: args.id, userId: user.userId },
      })

      if (!entry) {
        throw new GraphQLError("Entry not found")
      }

      // Handle tag updates
      if (tagNames !== undefined) {
        await prisma.entryTag.deleteMany({
          where: { entryId: args.id },
        })
      }

      return prisma.entry.update({
        where: { id: args.id },
        data: {
          ...updateData,
          tags: tagNames
            ? {
                create: tagNames.map((name: string) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name },
                      create: { name },
                    },
                  },
                })),
              }
            : undefined,
        },
        include: {
          tags: { include: { tag: true } },
          fromRelations: { include: { toEntry: true } },
          toRelations: { include: { fromEntry: true } },
        },
      })
    },

    deleteEntry: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context)

      const entry = await prisma.entry.findFirst({
        where: { id: args.id, userId: user.userId },
      })

      if (!entry) {
        throw new GraphQLError("Entry not found")
      }

      await prisma.entry.delete({
        where: { id: args.id },
      })

      return true
    },

    createRelationship: async (_: any, args: { input: any }, context: Context) => {
      const user = requireAuth(context)

      return prisma.relationship.create({
        data: {
          ...args.input,
          userId: user.userId,
        },
        include: {
          fromEntry: true,
          toEntry: true,
          user: true,
        },
      })
    },

    deleteRelationship: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context)

      const relationship = await prisma.relationship.findFirst({
        where: { id: args.id, userId: user.userId },
      })

      if (!relationship) {
        throw new GraphQLError("Relationship not found")
      }

      await prisma.relationship.delete({
        where: { id: args.id },
      })

      return true
    },

    createTag: async (_: any, args: { name: string; color?: string }) => {
      return prisma.tag.create({
        data: {
          name: args.name,
          color: args.color,
        },
      })
    },
  },

  // Field resolvers
  Entry: {
    user: (parent: any) => prisma.user.findUnique({ where: { id: parent.userId } }),

    tags: (parent: any) => parent.tags?.map((et: any) => et.tag) || [],

    fromRelations: (parent: any) => parent.fromRelations || [],
    toRelations: (parent: any) => parent.toRelations || [],
  },

  Tag: {
    entries: (parent: any) =>
      prisma.entry.findMany({
        where: {
          tags: {
            some: { tagId: parent.id },
          },
        },
      }),
  },

  Relationship: {
    fromEntry: (parent: any) => prisma.entry.findUnique({ where: { id: parent.fromEntryId } }),

    toEntry: (parent: any) => prisma.entry.findUnique({ where: { id: parent.toEntryId } }),

    user: (parent: any) => prisma.user.findUnique({ where: { id: parent.userId } }),
  },
}
