# Haseeb Traders

<div align="center">

**A modern, full-stack billing and invoicing management system**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.3-green?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Documentation](#documentation) • [API Reference](#api-reference)

</div>

---

## Overview

Haseeb Traders is a comprehensive billing and invoicing solution built with Next.js 16, TypeScript, and MongoDB. It streamlines invoice management with features like client tracking, multi-line item bills, automated tax calculations, and Google OAuth authentication.

### Key Highlights

- **🔐 Secure Authentication** - Google OAuth integration via NextAuth.js
- **📊 Dashboard Analytics** - Real-time statistics and quick actions
- **📝 Invoice Management** - Master-detail invoice structure with line items
- **💰 Tax Calculation** - Multiple tax types with automatic calculations
- **👥 Client Management** - Search, pagination, and client tracking
- **🎨 Modern UI** - Built with shadcn/ui and Tailwind CSS v4
- **📱 Responsive Design** - Mobile-first approach with collapsible navigation
- **⚡ Type-Safe** - End-to-end TypeScript implementation
- **🚀 Fast & Scalable** - Service layer architecture with MongoDB

---

## Features

### 🔑 Authentication & Security
- Google OAuth 2.0 integration
- Server-side session management
- Protected routes with automatic redirects
- Secure environment variable handling

### 📋 Invoice Management
- **Summaries** - Master invoice records with client linking
- **Bills** - Multiple line items per summary
- **Auto-numbering** - Automatic generation of invoice and bill numbers
- **Cascade Operations** - Delete summaries with all associated bills
- **Draft System** - Save invoices as drafts before finalizing

### 💵 Financial Tracking
- Multiple tax types per line item
- Automatic tax amount calculations
- Discount and commission tracking
- Category-based product organization
- Decimal precision for financial accuracy

### 👤 Client Management
- Client database with CRUD operations
- Search functionality with real-time filtering
- Pagination for large datasets
- Client-invoice relationship tracking

### ⚙️ Configuration
- Custom tax type definitions
- Product category management
- Active/inactive status toggles
- Extensible configuration system

### 📊 Dashboard
- Real-time statistics (total bills, summaries)
- Quick action buttons for common tasks
- Recent activity views with tabs
- Responsive data tables

---

## Tech Stack

### Frontend
- **[Next.js 16.1](https://nextjs.org/)** - React framework with App Router
- **[React 19.2](https://react.dev/)** - UI library with server components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible component library (Radix Nova)
- **[Lucide React](https://lucide.dev/)** - Modern icon library

### Backend
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - RESTful API endpoints
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose 9.3](https://mongoosejs.com/)** - MongoDB ODM
- **[NextAuth.js 4.24](https://next-auth.js.org/)** - Authentication solution

### Additional Libraries
- **[@react-pdf/renderer](https://react-pdf.org/)** - PDF generation
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Password hashing
- **[iron-session](https://www.npmjs.com/package/iron-session)** - Session management
- **[decimal.js](https://www.npmjs.com/package/decimal.js)** - Precise decimal math
- **[class-variance-authority](https://cva.style/docs)** - Component variants
- **[clsx](https://www.npmjs.com/package/clsx) + [tailwind-merge](https://www.npmjs.com/package/tailwind-merge)** - Conditional class names

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **pnpm** package manager ([Install](https://pnpm.io/installation))
- **MongoDB** Community Server ([Download](https://www.mongodb.com/try/download/community))
- **Google OAuth Credentials** ([Setup Guide](https://console.cloud.google.com/))

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd haseeb-traders
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Database
   MONGODB_URI="mongodb://localhost:27017/haseeb-traders"

   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

   # Google OAuth
   GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
   GOOGLE_SECRET="your-google-client-secret"

   # Session
   SESSION_SECRET="your-session-secret"
   ```

   **Generate secrets:**
   ```bash
   # NEXTAUTH_SECRET
   openssl rand -base64 32

   # SESSION_SECRET
   openssl rand -base64 32
   ```

4. **Configure Google OAuth**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Navigate to **APIs & Services** → **Credentials**
   - Create **OAuth 2.0 Client ID**
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Secret to `.env.local`

5. **Start MongoDB**

   ```bash
   # Windows
   net start MongoDB

   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

6. **Run the development server**

   ```bash
   pnpm dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
haseeb-traders/
├── app/                          # Next.js App Router
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── dashboard/            # Dashboard APIs
│   │   ├── summaries/            # Summary CRUD
│   │   ├── bills/                # Bill CRUD
│   │   ├── clients/              # Client management
│   │   ├── categories/           # Category APIs
│   │   └── tax-types/            # Tax configuration
│   ├── dashboard/                # Protected dashboard pages
│   ├── login/                    # Authentication pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── components/
│   ├── dashboard/                # Dashboard components
│   │   ├── app-sidebar.tsx       # Navigation sidebar
│   │   ├── navbar.tsx            # Top navigation
│   │   └── dashboard-content.tsx # Dashboard widgets
│   └── ui/                       # shadcn/ui components
│
├── config/
│   ├── db.ts                     # MongoDB connection
│   └── nav.ts                    # Navigation config
│
├── hooks/
│   └── use-mobile.ts             # Responsive hooks
│
├── lib/
│   └── utils.ts                  # Utility functions
│
├── models/                       # Mongoose schemas
│   ├── billModel.ts
│   ├── SummaryModel.ts
│   ├── clientModel.ts
│   ├── CategoryModel.ts
│   └── TaxTypeModel.ts
│
├── services/                     # Business logic layer
│   ├── BillService.ts
│   ├── SummaryService.ts
│   ├── clientService.ts
│   ├── CategoryService.ts
│   └── TaxTypeService.ts
│
├── types/
│   └── index.ts                  # TypeScript types
│
├── .env.local                    # Environment variables (gitignored)
├── components.json               # shadcn/ui config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## Database Schema

### Entity Relationship

```
Client (1) ──────< (N) Summary (1) ──────< (N) Bill
                                                 │
                                                 └─> TaxCharge (embedded)
```

### Models

**Client**
- Stores client information
- One-to-many relationship with Summaries

**Summary** (Invoice Master)
- Master invoice record
- Links to Client
- Contains discount and commission
- Has status: Draft or Converted

**Bill** (Line Item)
- Individual line items
- Belongs to a Summary
- Contains product details and taxes
- Multiple tax charges per bill

**TaxType**
- Configurable tax definitions
- Used in bill tax calculations

**Category**
- Product categorization
- Used for organizing bills

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js handlers |

### Dashboard

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats` | GET | Get statistics (bills count, summaries count) |

### Summaries

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/summaries` | GET | List all summaries with client data |
| `/api/summaries` | POST | Create summary with bills |
| `/api/summaries/[id]` | GET | Get single summary with bills |
| `/api/summaries/[id]` | PUT | Update summary |
| `/api/summaries/[id]` | DELETE | Delete summary (cascade bills) |

### Bills

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bills?summaryId=xxx` | GET | Get bills by summary ID |
| `/api/bills/[id]` | GET | Get single bill |
| `/api/bills/[id]` | PUT | Update bill |
| `/api/bills/[id]` | DELETE | Delete bill |

### Clients

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clients?search=&page=1` | GET | List clients with search/pagination |
| `/api/clients` | POST | Create new client |
| `/api/clients/[id]` | GET | Get single client |
| `/api/clients/[id]` | PUT | Update client |
| `/api/clients/[id]` | DELETE | Delete client |

### Example Request

```javascript
// Create a new client
const response = await fetch('/api/clients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'ABC Company' }),
});
const { data } = await response.json();

// Search clients
const response = await fetch('/api/clients?search=ABC&page=1&limit=10');
const { data } = await response.json();
// Returns: { clients: [...], total, page, totalPages }
```

---

## Development

### Available Scripts

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Add shadcn/ui component
npx shadcn@latest add [component-name]
```

### Adding a New shadcn/ui Component

```bash
# Examples
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add alert-dialog
```

### Code Style

This project follows these conventions:

- **TypeScript** for all files
- **Server Components** by default (`"use client"` only when needed)
- **Service Layer Pattern** for business logic
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **ESLint** for code quality

---

## Documentation

For detailed documentation, see:

- **[CODEBASE.md](./CODEBASE.md)** - Complete codebase explanation and external component configuration guide
- **[Next.js Documentation](https://nextjs.org/docs)** - Learn about Next.js features
- **[shadcn/ui Docs](https://ui.shadcn.com/)** - UI component documentation
- **[MongoDB Docs](https://www.mongodb.com/docs/)** - Database documentation

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/haseeb-traders` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Generate with `openssl rand -base64 32` |
| `GOOGLE_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `SESSION_SECRET` | Session encryption key | Generate with `openssl rand -base64 32` |

---

## Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import project in Vercel**
   - Go to [vercel.com](https://vercel.com/)
   - Click "Import Project"
   - Select your repository

3. **Configure environment variables**
   - Add all variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production domain
   - Update Google OAuth redirect URIs

4. **Deploy**
   - Vercel will automatically build and deploy

### MongoDB Atlas (Production Database)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in production environment variables

```env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/haseeb-traders?retryWrites=true&w=majority"
```

### Deployment Checklist

- [ ] Set up production MongoDB (MongoDB Atlas)
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Add production redirect URI to Google OAuth
- [ ] Set strong secrets for `NEXTAUTH_SECRET` and `SESSION_SECRET`
- [ ] Enable HTTPS
- [ ] Configure CORS if needed
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure database backups

---

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### NextAuth Errors

- Ensure `NEXTAUTH_SECRET` is set in `.env.local`
- Verify `NEXTAUTH_URL` matches your application URL
- Check Google OAuth redirect URIs match exactly

### Module Not Found Errors

- Verify `tsconfig.json` has correct path aliases
- Restart development server after config changes
- Clear `.next` folder: `rm -rf .next`

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write TypeScript for all new code
- Follow existing code style and patterns
- Add types for all functions and components
- Test your changes thoroughly
- Update documentation as needed

---

## Roadmap

- [ ] PDF invoice generation
- [ ] Email notifications
- [ ] Multi-currency support
- [ ] Payment tracking
- [ ] Advanced reporting and analytics
- [ ] Export to Excel/CSV
- [ ] Multi-user support with roles
- [ ] Recurring invoices
- [ ] Invoice templates
- [ ] Dark mode

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For questions, issues, or contributions:

- **GitHub Issues**: [Report a bug or request a feature](../../issues)
- **Documentation**: See [CODEBASE.md](./CODEBASE.md) for detailed guides
- **Email**: support@haseebtraders.com

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) by Vercel
- [shadcn/ui](https://ui.shadcn.com/) by shadcn
- [Tailwind CSS](https://tailwindcss.com/) by Tailwind Labs
- [MongoDB](https://www.mongodb.com/)
- [NextAuth.js](https://next-auth.js.org/)

---

<div align="center">

**Made with ❤️ for efficient billing management**

[⬆ Back to Top](#haseeb-traders)

</div>
