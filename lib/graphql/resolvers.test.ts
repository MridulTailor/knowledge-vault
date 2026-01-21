import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolvers } from './resolvers'
import { GraphQLError } from 'graphql'

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            collection: {
                findMany: vi.fn(),
                findFirst: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
            },
            user: {
                findUnique: vi.fn(),
            },
            collectionEntry: {
                deleteMany: vi.fn(),
                delete: vi.fn(),
                create: vi.fn(),
            },
            entry: {
                findFirst: vi.fn(),
            }
        }
    }
})

vi.mock('../prisma', () => ({
    prisma: mockPrisma
}))

// Mock Date to ensure consistent serialization
const mockDate = new Date('2024-01-01T00:00:00.000Z')

describe('Collection Resolvers', () => {
    const context = {
        user: {
            userId: 'user-1',
            email: 'test@example.com'
        }
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Query.collections', () => {
        it('fetches user collections', async () => {
            const mockCollections = [
                {
                    id: 'col-1',
                    name: 'Test Collection',
                    userId: 'user-1',
                    createdAt: mockDate,
                    updatedAt: mockDate,
                    entries: []
                }
            ]

            mockPrisma.collection.findMany.mockResolvedValue(mockCollections)

            const result = await resolvers.Query.collections(null, {}, context)

            expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                orderBy: { updatedAt: 'desc' },
                include: {
                    entries: {
                        include: { entry: true },
                    },
                },
            })

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('col-1')
        })
    })

    describe('Mutation.createCollection', () => {
        it('creates a new collection', async () => {
            const input = {
                name: 'New Collection',
                description: 'Desc'
            }

            const mockCreated = {
                id: 'col-new',
                ...input,
                userId: 'user-1',
                createdAt: mockDate,
                updatedAt: mockDate,
                entries: []
            }

            mockPrisma.collection.create.mockResolvedValue(mockCreated)

            const result = await resolvers.Mutation.createCollection(null, { input }, context)

            expect(mockPrisma.collection.create).toHaveBeenCalledWith({
                data: {
                    ...input,
                    userId: 'user-1',
                    entries: undefined
                },
                include: {
                    entries: { include: { entry: true } },
                },
            })

            expect(result.id).toBe('col-new')
        })

        it('throws error when user is not authenticated', async () => {
            const input = { name: 'Test', description: 'Desc' }
            
            await expect(
                resolvers.Mutation.createCollection(null, { input }, {})
            ).rejects.toThrow(GraphQLError)
        })
    })

    describe('Mutation.deleteCollection', () => {
        it('deletes a collection', async () => {
            const collectionId = 'col-1'
            
            mockPrisma.collection.findFirst.mockResolvedValue({
                id: collectionId,
                userId: 'user-1',
                name: 'Test',
                createdAt: mockDate,
                updatedAt: mockDate,
            })
            mockPrisma.collection.delete.mockResolvedValue({})

            const result = await resolvers.Mutation.deleteCollection(null, { id: collectionId }, context)

            expect(mockPrisma.collection.findFirst).toHaveBeenCalledWith({
                where: { id: collectionId, userId: 'user-1' }
            })
            expect(mockPrisma.collection.delete).toHaveBeenCalledWith({
                where: { id: collectionId }
            })
            expect(result).toBe(true)
        })

        it('returns false if collection not found', async () => {
            mockPrisma.collection.findFirst.mockResolvedValue(null)

            const result = await resolvers.Mutation.deleteCollection(null, { id: 'non-existent' }, context)

            expect(result).toBe(false)
        })
    })

    describe('Mutation.addEntryToCollection', () => {
        it('adds an entry to a collection', async () => {
            const collectionId = 'col-1'
            const entryId = 'entry-1'

            const mockCollection = {
                id: collectionId,
                userId: 'user-1',
                name: 'Test',
                createdAt: mockDate,
                updatedAt: mockDate,
                entries: []
            }

            mockPrisma.collection.findFirst.mockResolvedValue(mockCollection)
            mockPrisma.entry.findFirst.mockResolvedValue({ id: entryId, userId: 'user-1' })
            mockPrisma.collectionEntry.create.mockResolvedValue({})
            mockPrisma.collection.update.mockResolvedValue({
                ...mockCollection,
                entries: [{ entry: { id: entryId } }]
            })

            const result = await resolvers.Mutation.addEntryToCollection(
                null, 
                { collectionId, entryId }, 
                context
            )

            expect(result.id).toBe(collectionId)
        })
    })

    describe('Mutation.removeEntryFromCollection', () => {
        it('removes an entry from a collection', async () => {
            const collectionId = 'col-1'
            const entryId = 'entry-1'

            const mockCollection = {
                id: collectionId,
                userId: 'user-1',
                name: 'Test',
                createdAt: mockDate,
                updatedAt: mockDate,
                entries: []
            }

            mockPrisma.collection.findFirst.mockResolvedValue(mockCollection)
            mockPrisma.collectionEntry.delete.mockResolvedValue({})
            mockPrisma.collection.update.mockResolvedValue(mockCollection)

            const result = await resolvers.Mutation.removeEntryFromCollection(
                null,
                { collectionId, entryId },
                context
            )

            expect(result.id).toBe(collectionId)
        })
    })
})
