# Knowledge Vault 🧠

A modern personal knowledge management system with interactive graph visualization. Built with Next.js, GraphQL, and Prisma.

## ✨ Features

- **Smart Content Management**: Articles, code snippets, and bookmarks with rich editing
- **Interactive Knowledge Graph**: D3.js-powered visualization of your knowledge network
- **Advanced Search & Tagging**: Full-text search with customizable, color-coded tags
- **Semantic Relationships**: Connect entries with typed relationships (related, references, builds on, etc.)
- **Browser Extension**: Save content from any webpage with Chrome/Edge extension
- **Data Export/Import**: JSON and Markdown format support
- **Modern UI**: Responsive design with dark/light theme

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/MridulTailor/knowledge-vault.git
cd knowledge-vault
npm install
```

### Setup

1. Create `.env` file:

```env
DATABASE_URL="file:./dev.db"  # or PostgreSQL for production
JWT_SECRET="your-secure-secret-min-32-chars"
```

2. Initialize database:

```bash
npx prisma generate
npx prisma db push
```

3. Start development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## 🌐 Browser Extension

1. Navigate to `browser-extension` folder
2. Run `node build.js`
3. Load unpacked extension in Chrome/Edge from `chrome://extensions/`
4. Configure server URL in extension settings

**Shortcuts:**

- `Ctrl+Shift+S` - Save current page
- `Ctrl+Shift+N` - Quick note

## �️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: GraphQL (Apollo), Prisma ORM
- **Database**: PostgreSQL (SQLite for dev)
- **Visualization**: D3.js force-directed graphs
- **Auth**: JWT with bcrypt

## 📊 Available Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run db:push` - Update database schema
- `npm run db:studio` - Database management UI

## 🎨 Usage

1. **Create entries** - Choose from articles, code snippets, or bookmarks
2. **Add relationships** - Connect related knowledge with semantic links
3. **Explore graph** - Visualize your knowledge network interactively
4. **Search & filter** - Find content by text, tags, or type
5. **Export data** - Backup as JSON or Markdown

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push and create Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

Transform your digital knowledge into an interconnected, searchable network! 🚀

## 🏗️ Architecture & Technology Stack

### Frontend Technologies

- **Next.js 14**: React framework with App Router for full-stack development
- **TypeScript**: Type-safe development with enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: Modern, accessible React components built on Radix UI primitives
- **React Hook Form + Zod**: Type-safe form handling with validation
- **D3.js**: Powerful data visualization library for the interactive knowledge graph
- **CodeMirror**: Advanced code editor with syntax highlighting for 15+ languages
- **Lucide React**: Beautiful, consistent icon library

### Backend Architecture

- **Next.js API Routes**: Serverless API endpoints with built-in optimizations
- **Apollo GraphQL Server**: Type-safe GraphQL API with efficient data fetching
- **Prisma ORM**: Modern database toolkit with type-safe client generation
- **PostgreSQL**: Primary database for production (SQLite supported for development)
- **JWT Authentication**: Secure, stateless authentication with bcrypt password hashing

### Key Features Implementation

- **Knowledge Graph**: D3.js force-directed graph with performance optimizations for large datasets
- **Real-time Updates**: GraphQL subscriptions and optimistic UI updates
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme System**: System-aware dark/light mode with smooth transitions
- **Search Engine**: Full-text search with advanced filtering capabilities
- **Data Export**: JSON and Markdown export with complete data preservation

### Database Schema

The application uses a normalized relational database structure:

**Core Models:**

- `User`: User accounts with authentication credentials
- `Entry`: Knowledge entries supporting multiple content types
- `Tag`: Organizational tags with optional color coding
- `Relationship`: Typed connections between entries with descriptions
- `EntryTag`: Many-to-many junction table for entry-tag associations

**Relationship Types:**

- `RELATED_TO`: General topical connections
- `REFERENCES`: Citation and reference relationships
- `BUILDS_ON`: Progressive knowledge building
- `SOURCE_FOR`: Foundational knowledge relationships
- `INSPIRED_BY`: Creative inspiration links
- `CONTRADICTS`: Opposing viewpoint connections

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks
- `npm run db:push` - Push Prisma schema changes to database
- `npm run db:generate` - Generate Prisma client after schema changes
- `npm run db:migrate` - Create and run database migrations
- `npm run db:deploy` - Deploy migrations to production
- `npm run db:reset` - Reset database and run all migrations
- `npm run db:studio` - Launch Prisma Studio for database management

## 📊 Knowledge Graph Deep Dive

The Knowledge Graph is the centerpiece feature that sets Knowledge Vault apart from traditional note-taking applications. It provides a visual, interactive representation of your knowledge network.

### Technical Implementation

- **D3.js Force Simulation**: Physics-based layout engine that creates natural clustering
- **Performance Optimized**: Handles large graphs (100+ nodes) with throttled rendering
- **Responsive Interactions**: Real-time highlighting and tooltip system
- **Adaptive Scaling**: Dynamic node sizing based on content length and connections

### Interactive Features

- **Visual Node Types**: Color-coded circles representing different content types
  - Blue: Articles and notes
  - Green: Code snippets
  - Orange: Bookmarks
- **Relationship Visualization**: Different line styles and colors for relationship types
- **Search Integration**: Real-time highlighting of matching nodes
- **Zoom & Pan**: Smooth navigation with mouse or touch controls
- **Drag Interactions**: Reorganize layout by dragging individual nodes
- **Fullscreen Mode**: Immersive exploration experience
- **Hover Details**: Contextual information without navigation
- **Click Navigation**: Deep dive into specific entries

### Graph Analytics

- **Connection Insights**: Identify highly connected nodes (knowledge hubs)
- **Cluster Detection**: Visual identification of related topic groups
- **Relationship Patterns**: Understand how different types of content relate
- **Knowledge Gaps**: Spot areas with few connections for potential expansion

### Sample Data Generator

New users can load sample data to immediately experience the knowledge graph with:

- Interconnected articles on web development topics
- Code snippets with practical examples
- Bookmarks to relevant documentation
- Multiple relationship types demonstrating the system's flexibility

## 🎨 Customization & Extension

### Adding New Entry Types

1. **Update Database Schema**: Add new type to `EntryType` enum in `prisma/schema.prisma`
2. **GraphQL Schema**: Update the enum in `lib/graphql/schema.ts`
3. **Frontend Components**:
   - Add the new type to entry form components
   - Update type filters and display logic
   - Add appropriate icons and styling
4. **Apply Changes**: Run `npx prisma db push` to update the database

### Adding New Relationship Types

1. **Database Update**: Extend `RelationshipType` enum in Prisma schema
2. **GraphQL Integration**: Update schema and resolvers
3. **UI Components**:
   - Update relationship form with new type options
   - Add appropriate colors and styling to graph visualization
   - Update relationship display logic
4. **Migration**: Push database changes with `npx prisma db push`

### Theming and Styling

The application uses Tailwind CSS with a comprehensive design system:

- **Color Palette**: Customizable through CSS custom properties
- **Component Library**: Built on shadcn/ui for consistency
- **Dark/Light Modes**: Automatic system detection with manual override
- **Responsive Design**: Mobile-first approach with breakpoint-aware layouts

### API Extension

The GraphQL API is easily extensible:

1. **Add Resolvers**: Extend `lib/graphql/resolvers.ts` with new queries/mutations
2. **Update Schema**: Add new types and operations to `lib/graphql/schema.ts`
3. **Frontend Integration**: Use generated types for type-safe client integration

## 🚀 Deployment

### Production Deployment

1. **Database Setup**: Configure PostgreSQL database
2. **Environment Variables**: Set production environment variables
3. **Build Application**: Run `npm run build`
4. **Database Migration**: Run `npx prisma migrate deploy`
5. **Start Server**: Run `npm start`

### Recommended Platforms

- **Vercel**: Seamless Next.js deployment with automatic CI/CD
- **Railway**: Simple PostgreSQL hosting with automatic deployments
- **DigitalOcean**: VPS hosting for full control
- **AWS/Google Cloud**: Enterprise-scale deployment options

### Environment Variables for Production

```env
# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
JWT_SECRET="your-secure-production-secret-minimum-32-characters"

# Optional: Custom domain for browser extension
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can get involved:

### Development Setup

1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/your-username/knowledge-vault.git
   cd knowledge-vault
   ```
3. **Install Dependencies**: Run `npm install`
4. **Set Up Development Environment**: Follow the installation guide above
5. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-amazing-feature
   ```

### Contribution Guidelines

- **Code Style**: Follow the existing TypeScript and React patterns
- **Commit Messages**: Use conventional commit format (`feat:`, `fix:`, `docs:`, etc.)
- **Testing**: Ensure your changes don't break existing functionality
- **Documentation**: Update README and code comments as needed

### Areas for Contribution

- **New Features**: Additional content types, advanced search, collaboration features
- **Browser Extensions**: Firefox support, mobile browser integration
- **Integrations**: Third-party service connections (Notion, Obsidian, etc.)
- **Performance**: Database query optimization, frontend performance improvements
- **UI/UX**: Design improvements, accessibility enhancements
- **Documentation**: Tutorials, API documentation, video guides

### Submitting Changes

1. **Test Your Changes**: Ensure everything works in development
2. **Commit Your Changes**:
   ```bash
   git commit -m 'feat: add amazing new feature'
   ```
3. **Push to Your Fork**:
   ```bash
   git push origin feature/your-amazing-feature
   ```
4. **Create Pull Request**: Open a PR with a clear description of your changes

## � License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

### What this means:

- ✅ **Commercial Use**: Free to use in commercial projects
- ✅ **Modification**: Modify and adapt the code as needed
- ✅ **Distribution**: Share and distribute the software
- ✅ **Private Use**: Use privately without restrictions
- ❗ **Attribution**: Include copyright notice in distributions

## 🙏 Acknowledgments

Built with ❤️ using these incredible open-source technologies:

- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[Prisma](https://prisma.io/)** - Next-generation ORM for TypeScript
- **[Apollo GraphQL](https://apollographql.com/)** - Comprehensive GraphQL platform
- **[D3.js](https://d3js.org/)** - Data-driven document manipulation
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://radix-ui.com/)** - Low-level UI primitives
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable components built with Radix UI
