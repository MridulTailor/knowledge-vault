/**
 * GraphQL Types for Knowledge Vault
 * 
 * These types correspond to the GraphQL schema and provide type safety
 * when working with GraphQL queries and mutations.
 */

export enum EntryType {
  ARTICLE = 'ARTICLE',
  CODE_SNIPPET = 'CODE_SNIPPET',
  BOOKMARK = 'BOOKMARK',
}

export enum RelationshipType {
  RELATED_TO = 'RELATED_TO',
  SOURCE_FOR = 'SOURCE_FOR',
  INSPIRED_BY = 'INSPIRED_BY',
  REFERENCES = 'REFERENCES',
  CONTRADICTS = 'CONTRADICTS',
  BUILDS_ON = 'BUILDS_ON',
}

export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  entries: Entry[]
  collections: Collection[]
}

export interface Entry {
  id: string
  title: string
  content: string
  type: EntryType
  language?: string
  url?: string
  metadata?: string
  createdAt: string
  updatedAt: string
  userId: string
  user: User
  tags: Tag[]
  fromRelations: Relationship[]
  toRelations: Relationship[]
}

export interface Tag {
  id: string
  name: string
  color?: string
  createdAt: string
  entries: Entry[]
}

export interface Relationship {
  id: string
  type: RelationshipType
  description?: string
  createdAt: string
  fromEntry: Entry
  toEntry: Entry
  user: User
}

export interface Collection {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  entries: Entry[]
  user: User
}

export interface CreateEntryInput {
  title: string
  content: string
  type: EntryType
  language?: string
  url?: string
  metadata?: string
  tagNames?: string[]
}

export interface UpdateEntryInput {
  title?: string
  content?: string
  type?: EntryType
  language?: string
  url?: string
  metadata?: string
  tagNames?: string[]
}

export interface CreateRelationshipInput {
  fromEntryId: string
  toEntryId: string
  type: RelationshipType
  description?: string
}

export interface CreateCollectionInput {
  name: string
  description?: string
  entryIds?: string[]
}

export interface UpdateCollectionInput {
  name?: string
  description?: string
  entryIds?: string[]
}

export interface AuthPayload {
  token: string
  user: User
}

/**
 * GraphQL Query Response Types
 */
export interface EntriesQueryResponse {
  entries: Entry[]
}

export interface EntryQueryResponse {
  entry: Entry | null
}

export interface TagsQueryResponse {
  tags: Tag[]
}

export interface RelationshipsQueryResponse {
  relationships: Relationship[]
}

export interface CollectionsQueryResponse {
  collections: Collection[]
}

export interface CollectionQueryResponse {
  collection: Collection | null
}

export interface MeQueryResponse {
  me: User | null
}

/**
 * GraphQL Mutation Response Types
 */
export interface CreateEntryMutationResponse {
  createEntry: Entry
}

export interface UpdateEntryMutationResponse {
  updateEntry: Entry
}

export interface DeleteEntryMutationResponse {
  deleteEntry: boolean
}

export interface CreateRelationshipMutationResponse {
  createRelationship: Relationship
}

export interface DeleteRelationshipMutationResponse {
  deleteRelationship: boolean
}

export interface CreateTagMutationResponse {
  createTag: Tag
}

export interface CreateCollectionMutationResponse {
  createCollection: Collection
}

export interface UpdateCollectionMutationResponse {
  updateCollection: Collection
}

export interface DeleteCollectionMutationResponse {
  deleteCollection: boolean
}

export interface AddEntryToCollectionMutationResponse {
  addEntryToCollection: Collection
}

export interface RemoveEntryFromCollectionMutationResponse {
  removeEntryFromCollection: Collection
}

export interface SignupMutationResponse {
  signup: AuthPayload
}

export interface LoginMutationResponse {
  login: AuthPayload
}
