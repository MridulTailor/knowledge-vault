-- Initialize the database tables
-- This will be handled by Prisma migrations, but keeping for reference

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    language TEXT,
    url TEXT,
    metadata TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Entry-Tag junction table
CREATE TABLE IF NOT EXISTS entry_tags (
    entryId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (entryId, tagId),
    FOREIGN KEY (entryId) REFERENCES entries(id) ON DELETE CASCADE,
    FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
);

-- Relationships table
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'RELATED_TO',
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    fromEntryId TEXT NOT NULL,
    toEntryId TEXT NOT NULL,
    userId TEXT NOT NULL,
    FOREIGN KEY (fromEntryId) REFERENCES entries(id) ON DELETE CASCADE,
    FOREIGN KEY (toEntryId) REFERENCES entries(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(fromEntryId, toEntryId, type)
);
