# Knowledge Vault 🧠

A modern, full-featured personal knowledge management system built with Next.js, GraphQL, and Prisma.

## ✨ Features

### Core Functionality

- **Entry Management**: Create, read, update, and delete knowledge entries
- **Multiple Content Types**: Support for articles/notes, code snippets, and bookmarks
- **Rich Text Editing**: Markdown support for articles and syntax highlighting for code
- **Tagging System**: Organize entries with customizable tags
- **Search & Filter**: Powerful search across titles and content with type and tag filters
- **Relationships**: Create semantic connections between entries (related to, references, builds on, etc.)

### Advanced Features

- **GraphQL API**: Efficient data fetching and real-time updates
- **Authentication**: Secure user accounts with JWT tokens
- **Export/Import**: Export your data as JSON or Markdown
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Theme**: System-aware theme switching
- **Toast Notifications**: User-friendly feedback for all actions
- **Code Editor**: Integrated CodeMirror for syntax-highlighted code editing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- SQLite (included)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd knowledge-vault
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secure-jwt-secret-here"
   ```

4. **Initialize the database**

   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Creating Your First Entry

1. **Sign Up**: Create a new account or log in
2. **Dashboard**: Click "New Entry" to create your first knowledge entry
3. **Choose Type**: Select from Article, Code Snippet, or Bookmark
4. **Add Content**: Write your content using Markdown (for articles) or code (for snippets)
5. **Tag It**: Add tags to organize your knowledge
6. **Save**: Your entry is now saved and searchable

### Building Knowledge Networks

1. **View Entry**: Click on any entry to view its details
2. **Add Relationships**: Use "Add Relationship" to connect related entries
3. **Explore**: Navigate through your knowledge network using relationship links

### Managing Your Data

- **Search**: Use the search bar to find entries by title or content
- **Filter**: Filter by entry type or tags
- **Export**: Use Export/Import to backup your data as JSON or Markdown
- **Edit**: Click the edit button on any entry to modify it

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with GraphQL (Apollo Server)
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Styling**: Tailwind CSS with shadcn/ui components

### Project Structure

```
knowledge-vault/
├── app/                    # Next.js app directory
│   ├── api/graphql/       # GraphQL API endpoint
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Main application dashboard
├── components/            # React components
│   ├── auth/              # Authentication forms
│   ├── entries/           # Entry management components
│   ├── relationships/     # Relationship management
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configuration
│   ├── graphql/           # GraphQL schema and resolvers
│   └── hooks/             # Custom React hooks
├── prisma/                # Database schema and migrations
└── styles/                # Global styles
```

### Database Schema

**Core Models:**

- `User`: User accounts and authentication
- `Entry`: Knowledge entries (articles, code, bookmarks)
- `Tag`: Organizational tags
- `Relationship`: Connections between entries
- `EntryTag`: Many-to-many relationship between entries and tags

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client

## 🎨 Customization

### Adding New Entry Types

1. Update the `EntryType` enum in `prisma/schema.prisma`
2. Add the new type to `lib/graphql/schema.ts`
3. Update the entry form component to handle the new type
4. Run `npm run db:push` to update the database

### Adding New Relationship Types

1. Update the `RelationshipType` enum in the Prisma schema
2. Add the new type to the GraphQL schema
3. Update the relationship form component
4. Push database changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Node.js applications. Make sure to:

1. Set up environment variables
2. Run database migrations
3. Build the application (`npm run build`)

---

Built with ❤️ using Next.js, GraphQL, and modern web technologies.
