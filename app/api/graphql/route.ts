import { ApolloServer } from "@apollo/server"
import { startServerAndCreateNextHandler } from "@as-integrations/next"
import type { NextRequest } from "next/server"
import { typeDefs } from "@/lib/graphql/schema"
import { resolvers } from "@/lib/graphql/resolvers"
import { extractToken, verifyToken } from "@/lib/auth"

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    const authHeader = req.headers.get("authorization") || undefined
    const token = extractToken(authHeader)
    const user = token ? verifyToken(token) : null

    return { user }
  },
})

export { handler as GET, handler as POST }
