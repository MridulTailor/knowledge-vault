import { gql } from "graphql-tag"

export const typeDefs = gql`
  enum EntryType {
    ARTICLE
    CODE_SNIPPET  
    BOOKMARK
  }

  enum RelationshipType {
    RELATED_TO
    SOURCE_FOR
    INSPIRED_BY
    REFERENCES
    CONTRADICTS
    BUILDS_ON
  }

  type User {
    id: ID!
    email: String!
    name: String
    createdAt: String!
    entries: [Entry!]!
  }

  type Entry {
    id: ID!
    title: String!
    content: String!
    type: EntryType!
    language: String
    url: String
    metadata: String
    createdAt: String!
    updatedAt: String!
    userId: String!
    user: User!
    tags: [Tag!]!
    fromRelations: [Relationship!]!
    toRelations: [Relationship!]!
  }

  type Tag {
    id: ID!
    name: String!
    color: String
    createdAt: String!
    entries: [Entry!]!
  }

  type Relationship {
    id: ID!
    type: RelationshipType!
    description: String
    createdAt: String!
    fromEntry: Entry!
    toEntry: Entry!
    user: User!
  }

  input CreateEntryInput {
    title: String!
    content: String!
    type: EntryType!
    language: String
    url: String
    metadata: String
    tagNames: [String!]
  }

  input UpdateEntryInput {
    title: String
    content: String
    type: EntryType
    language: String
    url: String
    metadata: String
    tagNames: [String!]
  }

  input CreateRelationshipInput {
    fromEntryId: ID!
    toEntryId: ID!
    type: RelationshipType!
    description: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    entries(search: String, tagNames: [String!], type: EntryType): [Entry!]!
    entry(id: ID!): Entry
    tags: [Tag!]!
    relationships: [Relationship!]!
  }

  type Mutation {
    signup(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createEntry(input: CreateEntryInput!): Entry!
    updateEntry(id: ID!, input: UpdateEntryInput!): Entry!
    deleteEntry(id: ID!): Boolean!
    createRelationship(input: CreateRelationshipInput!): Relationship!
    deleteRelationship(id: ID!): Boolean!
    createTag(name: String!, color: String): Tag!
  }
`
