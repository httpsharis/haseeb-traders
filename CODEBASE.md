# Haseeb Traders - Codebase Documentation

> **A modern billing and invoicing system built with Next.js 16, TypeScript, MongoDB, and NextAuth.js**

Last Updated: March 21, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [Getting Started](#getting-started)
5. [Configuring External Components](#configuring-external-components)
6. [Database Schema](#database-schema)
7. [API Routes](#api-routes)
8. [Key Features](#key-features)
9. [Development Workflow](#development-workflow)
10. [Component Library](#component-library)

---

## Project Overview

Haseeb Traders is a comprehensive billing and invoicing application designed to manage:
- Client information
- Invoice summaries (master records)
- Individual bills (line items)
- Tax calculation with multiple tax types
- Category-based product organization
- PDF generation for invoices

### Business Logic Flow

```
Client → Summary (Invoice Master) → Bills (Line Items) → Tax Calculations
```

---

## Technology Stack

### Core Framework
- **Next.js 16.1.6** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** (Radix Nova) - Accessible component library
- **Lucide React** - Icon library

### Backend & Database
- **MongoDB** - NoSQL database (local instance)
- **Mongoose 9.3.0** - MongoDB ODM
- **NextAuth.js v4.24.13** - Authentication solution

### Additional Libraries
- **@react-pdf/renderer** - PDF generation
- **bcryptjs** - Password hashing
- **iron-session** - Session management
- **decimal.js** - Precise decimal calculations
- **class-variance-authority** - Component variants

---

## Project Architecture

### Folder Structure

```
haseeb-traders/
├── app/                          # Next.js 13+ App Router
│   ├── api/                      # API route handlers
│   │   ├── auth/[...nextauth]/   # NextAuth configuration
│   │   ├── dashboard/stats/      # Dashboard statistics
│   │   ├── summaries/            # Summary CRUD
│   │   ├── bills/                # Bill CRUD
│   │   ├── clients/              # Client management
│   │   ├── categories/           # Category management
│   │   └── tax-types/            # Tax configuration
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── layout.tsx            # Protected layout
│   │   └── page.tsx              # Main dashboard
│   ├── login/                    # Authentication pages
│   │   └── page.tsx              # Login with Google OAuth
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (redirects to dashboard)
│   ├── providers.tsx             # Client-side providers
│   └── globals.css               # Global styles
│
├── components/
│   ├── dashboard/                # Dashboard components
│   │   ├── app-sidebar.tsx       # Navigation sidebar
│   │   ├── navbar.tsx            # Top navigation bar
│   │   └── dashboard-content.tsx # Main dashboard content
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── sidebar.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── [more components]
│
├── config/
│   ├── db.ts                     # MongoDB connection
│   └── nav.ts                    # Navigation configuration
│
├── hooks/
│   └── use-mobile.ts             # Responsive design hook
│
├── lib/
│   └── utils.ts                  # Utility functions (cn, etc.)
│
├── models/                       # Mongoose schemas
│   ├── billModel.ts              # Bill model
│   ├── SummaryModel.ts           # Summary model
│   ├── clientModel.ts            # Client model
│   ├── CategoryModel.ts          # Category model
│   └── TaxTypeModel.ts           # Tax type model
│
├── services/                     # Business logic layer
│   ├── BillService.ts            # Bill operations
│   ├── SummaryService.ts         # Summary operations
│   ├── clientService.ts          # Client operations
│   ├── CategoryService.ts        # Category operations
│   └── TaxTypeService.ts         # Tax type operations
│
├── types/
│   └── index.ts                  # TypeScript type definitions
│
├── utils/
│   └── [utility functions]
│
├── .env.local                    # Environment variables (not in repo)
├── components.json               # shadcn/ui configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

### Architecture Patterns

1. **Service Layer Pattern** - Business logic separated from API routes
2. **Type Safety** - Comprehensive TypeScript interfaces
3. **Component Composition** - Reusable UI primitives
4. **Server Components** - RSC for layouts and pages
5. **Protected Routes** - Server-side session validation

### Data Flow

```
┌─────────────┐
│   Client    │
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   API Route     │
│   Handler       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   connectDB()   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Service Layer   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Mongoose Model  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│    MongoDB      │
└─────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (preferably 20+)
- **pnpm** (package manager)
- **MongoDB** installed locally
- **Google OAuth credentials** (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   cd h:/CodeVerse/Projects/NextJs
   git clone <repository-url> haseeb-traders
   cd haseeb-traders
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI="mongodb://localhost:27017/haseeb-traders"
   SESSION_SECRET="your-session-secret-here"
   GOOGLE_ID="your-google-oauth-client-id"
   GOOGLE_SECRET="your-google-oauth-client-secret"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # On Windows
   net start MongoDB

   # Or using MongoDB Compass
   # Connect to: mongodb://localhost:27017
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## Configuring External Components

This section teaches you how to set up and configure all external dependencies and integrations.

### 1. Google OAuth Configuration

#### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - Application name: "Haseeb Traders"
   - Authorized domains: `localhost` (for development)
   - Scopes: `email`, `profile`

6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "Haseeb Traders Web Client"
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```

7. Copy the **Client ID** and **Client Secret**

#### Step 2: Configure Environment Variables

Update `.env.local`:
```env
GOOGLE_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_SECRET="GOCSPX-abcdefghijklmnop"
```

#### Step 3: NextAuth Configuration

The NextAuth configuration is already set up in:
```typescript
// app/api/auth/[...nextauth]/route.ts
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  // ... other options
};
```

#### Step 4: Generate NextAuth Secret

```bash
# Generate a random secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `.env.local`:
```env
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL=http://localhost:3000
```

#### Testing Google OAuth

1. Start the dev server: `pnpm dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Authenticate with your Google account
5. You should be redirected to the dashboard

---

### 2. MongoDB Configuration

#### Step 1: Install MongoDB

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer (choose "Complete" installation)
3. Install MongoDB as a Windows Service
4. Default port: `27017`

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Step 2: Verify MongoDB is Running

```bash
# Check MongoDB status
mongosh --eval "db.version()"

# Expected output: MongoDB version number
```

#### Step 3: Configure Database Connection

The connection is configured in `config/db.ts`:

```typescript
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

// Cache connection to prevent hot-reload connection issues
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
```

#### Step 4: Database Configuration Options

Update `.env.local` for advanced configuration:

```env
# Local MongoDB (Default)
MONGODB_URI="mongodb://localhost:27017/haseeb-traders"

# MongoDB with authentication
MONGODB_URI="mongodb://username:password@localhost:27017/haseeb-traders?authSource=admin"

# MongoDB Atlas (Cloud)
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/haseeb-traders?retryWrites=true&w=majority"
```

#### Step 5: MongoDB Compass (GUI Tool)

1. Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Connect using: `mongodb://localhost:27017`
3. You'll see the `haseeb-traders` database after first use
4. Explore collections: `clients`, `summaries`, `bills`, `categories`, `taxtypes`

---

### 3. shadcn/ui Configuration

#### Understanding shadcn/ui

shadcn/ui is NOT an npm package - it's a component system where you copy components directly into your project.

#### Step 1: Initial Setup (Already Done)

The project is already configured with `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

#### Step 2: Adding New Components

To add a new shadcn/ui component:

```bash
# Example: Add a dialog component
npx shadcn@latest add dialog

# Add multiple components
npx shadcn@latest add dropdown-menu alert toast

# View available components
npx shadcn@latest add
```

This will:
1. Download the component code
2. Place it in `components/ui/`
3. Install required dependencies
4. Configure TypeScript paths

#### Step 3: Customizing Components

Components are in your codebase, so you can modify them directly:

```typescript
// components/ui/button.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input hover:bg-accent",
        // Add your custom variant
        custom: "bg-blue-500 text-white hover:bg-blue-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export { Button, buttonVariants };
```

#### Step 4: Theme Configuration

Customize colors in `app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    /* Add custom colors */
    --custom-color: 210 40% 50%;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
  }
}
```

---

### 4. Tailwind CSS v4 Configuration

#### Configuration File

Located at `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color extensions
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          // ... more shades
        },
      },
      animation: {
        // Custom animations
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [
    require("tw-animate-css"),
  ],
};

export default config;
```

#### Adding Custom Utilities

```css
/* app/globals.css */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

---

### 5. TypeScript Configuration

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Adding Custom Type Definitions

Create `types/index.ts`:

```typescript
// Existing types in your project
export interface Client {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxCharge {
  taxType: string;
  percentage: number;
  amount: number;
}

export interface Bill {
  _id: string;
  summary: string;
  billNumber: string;
  date: Date;
  description: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  taxes: TaxCharge[];
}

// Add your custom types here
```

---

### 6. Environment Variables Reference

Complete `.env.local` template:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
MONGODB_URI="mongodb://localhost:27017/haseeb-traders"

# ============================================
# AUTHENTICATION - NextAuth.js
# ============================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# ============================================
# GOOGLE OAUTH
# ============================================
GOOGLE_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_SECRET="your-client-secret"

# ============================================
# SESSION MANAGEMENT
# ============================================
SESSION_SECRET="your-session-secret"

# ============================================
# OPTIONAL: PRODUCTION SETTINGS
# ============================================
# NODE_ENV=production
# NEXTAUTH_URL=https://yourdomain.com

# ============================================
# OPTIONAL: MONGODB ATLAS (Cloud Database)
# ============================================
# MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/haseeb-traders"

# ============================================
# OPTIONAL: EMAIL SERVICE (Future Integration)
# ============================================
# EMAIL_SERVER_HOST=smtp.gmail.com
# EMAIL_SERVER_PORT=587
# EMAIL_SERVER_USER=your-email@gmail.com
# EMAIL_SERVER_PASSWORD=your-app-password
# EMAIL_FROM=noreply@haseebtraders.com
```

#### Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use strong secrets** - Minimum 32 characters
3. **Rotate secrets regularly** - Especially in production
4. **Use environment-specific files**:
   - `.env.local` - Local development (gitignored)
   - `.env.development` - Development defaults (can commit)
   - `.env.production` - Production values (never commit)

---

### 7. PDF Generation Configuration (Future Implementation)

The project includes `@react-pdf/renderer` for invoice PDFs.

#### Basic Setup Example

```typescript
// lib/pdf-generator.ts
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
});

export const InvoicePDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Invoice #{data.invoiceNumber}</Text>
        <Text>Client: {data.clientName}</Text>
        {/* Add more content */}
      </View>
    </Page>
  </Document>
);

// Usage in API route
import { renderToStream } from '@react-pdf/renderer';

export async function GET(request: Request) {
  const pdf = <InvoicePDF data={invoiceData} />;
  const stream = await renderToStream(pdf);

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    },
  });
}
```

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐
│   Client     │
│──────────────│
│ _id          │
│ name         │◄─────────┐
└──────────────┘          │
                          │ Reference
                          │
┌──────────────────────┐  │
│   Summary (Master)   │  │
│──────────────────────│  │
│ _id                  │  │
│ client ──────────────┘  │
│ summaryNumber        │  │
│ date                 │  │
│ taxPeriod            │  │
│ status               │  │
│ discount             │◄─┐
│ commission           │  │
└──────────────────────┘  │ Reference
                          │
┌──────────────────────┐  │
│   Bill (Line Item)   │  │
│──────────────────────│  │
│ _id                  │  │
│ summary ─────────────┘  │
│ billNumber           │  │
│ date                 │  │
│ description          │  │
│ category             │  │
│ quantity             │  │
│ unitPrice            │  │
│ taxes[]              │  │
│  ├─ taxType          │  │
│  ├─ percentage       │  │
│  └─ amount           │  │
└──────────────────────┘  │
                          │
┌──────────────┐          │
│  Category    │          │
│──────────────│          │
│ _id          │          │
│ name         │──────────┘ (Lookup)
│ isActive     │
└──────────────┘

┌──────────────┐
│  TaxType     │
│──────────────│
│ _id          │
│ name         │──────────┐ (Lookup)
│ percentage   │          │
│ isActive     │          │
└──────────────┘          │
                          │
            Used in Bill.taxes[]
```

### Model Details

#### ClientModel
```typescript
{
  _id: ObjectId,
  name: String (unique, required),
  createdAt: Date,
  updatedAt: Date
}
```

#### SummaryModel (Invoice Master)
```typescript
{
  _id: ObjectId,
  client: ObjectId (ref: "Client"),
  summaryNumber: String (unique, auto-generated),
  date: Date (required),
  taxPeriod: String,
  status: "Draft" | "Converted",
  discount: Number (default: 0),
  commission: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

#### BillModel (Invoice Line Item)
```typescript
{
  _id: ObjectId,
  summary: ObjectId (ref: "Summary", required),
  billNumber: String (auto-generated),
  date: Date (required),
  description: String (required),
  category: String,
  quantity: Number (required),
  unitPrice: Number (required),
  taxes: [
    {
      taxType: String,
      percentage: Number,
      amount: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Business Logic Rules

1. **Cascade Delete**: When a Summary is deleted, all associated Bills are also deleted
2. **Bill Dependency**: Bills cannot exist without a parent Summary
3. **Unique Constraints**: Client names, summary numbers are unique
4. **Auto-numbering**: Summary and Bill numbers are auto-generated
5. **Tax Calculation**: Tax amounts are calculated based on `(quantity * unitPrice) * (percentage / 100)`

---

## API Routes

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js handler (signin, callback, etc.) |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics (bill count, summary count) |

### Summaries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/summaries` | List all summaries with client data |
| POST | `/api/summaries` | Create new summary with bills |
| GET | `/api/summaries/[id]` | Get single summary with bills |
| PUT | `/api/summaries/[id]` | Update summary |
| DELETE | `/api/summaries/[id]` | Delete summary and cascade delete bills |

### Bills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills?summaryId=xxx` | Get bills by summary ID |
| GET | `/api/bills/[id]` | Get single bill |
| PUT | `/api/bills/[id]` | Update bill |
| DELETE | `/api/bills/[id]` | Delete bill |

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients?search=xxx&page=1` | List clients with search and pagination |
| POST | `/api/clients` | Create new client |
| GET | `/api/clients/[id]` | Get single client |
| PUT | `/api/clients/[id]` | Update client |
| DELETE | `/api/clients/[id]` | Delete client |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category |
| GET | `/api/categories/[id]` | Get single category |
| PUT | `/api/categories/[id]` | Update category |
| DELETE | `/api/categories/[id]` | Delete category |

### Tax Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tax-types` | List all tax types |
| POST | `/api/tax-types` | Create tax type |
| GET | `/api/tax-types/[id]` | Get single tax type |
| PUT | `/api/tax-types/[id]` | Update tax type |
| DELETE | `/api/tax-types/[id]` | Delete tax type |

### API Response Format

All API routes follow this response pattern:

**Success Response:**
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Example API Usage

```typescript
// Fetch dashboard stats
const response = await fetch('/api/dashboard/stats');
const { data } = await response.json();
console.log(data); // { totalBills: 150, totalSummaries: 45 }

// Create a new client
const response = await fetch('/api/clients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New Client' }),
});
const { data } = await response.json();

// Search clients
const response = await fetch('/api/clients?search=john&page=1&limit=10');
const { data } = await response.json();
console.log(data); // { clients: [...], total: 5, page: 1, totalPages: 1 }
```

---

## Key Features

### 1. Authentication & Authorization

- **Google OAuth** integration via NextAuth.js
- Server-side session validation in protected routes
- Automatic redirect to login for unauthenticated users
- User info displayed in navbar with signout capability

**Protected Route Example:**
```typescript
// app/dashboard/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

### 2. Dashboard Overview

- Real-time statistics (Total Bills, Total Summaries)
- Quick action buttons for creating summaries
- Tabbed interface showing recent bills and summaries
- Responsive design with collapsible sidebar

### 3. Invoice Management (Summary & Bills)

- **Summary** = Master invoice record
- **Bills** = Line items within a summary
- Create summary with multiple bills in single operation
- Cascade delete: Removing summary removes all bills
- Tax calculation with multiple tax types per bill
- Category-based product organization
- Discount and commission tracking

### 4. Client Management

- Client database with search functionality
- Pagination support for large client lists
- Link clients to summaries/invoices

### 5. Configuration

- **Tax Types**: Define multiple tax types (e.g., VAT, Sales Tax)
- **Categories**: Organize products by categories
- Active/inactive status for both

### 6. Responsive Design

- Mobile-friendly sidebar (collapsible)
- Adaptive layout for tablets and phones
- Custom `use-mobile` hook for breakpoint detection

### 7. Type Safety

- Comprehensive TypeScript interfaces
- Type-safe API responses
- Mongoose schema validation

---

## Development Workflow

### Running the Development Server

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
```

### Adding a New Feature (Example: Adding a "Products" Module)

#### Step 1: Create the Model

```typescript
// models/ProductModel.ts
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
```

#### Step 2: Create the Service

```typescript
// services/ProductService.ts
import ProductModel from "@/models/ProductModel";

export class ProductService {
  static async getAllProducts() {
    return await ProductModel.find({ isActive: true });
  }

  static async createProduct(data: { name: string; price: number }) {
    return await ProductModel.create(data);
  }

  static async updateProduct(id: string, data: Partial<Product>) {
    return await ProductModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteProduct(id: string) {
    return await ProductModel.findByIdAndDelete(id);
  }
}
```

#### Step 3: Create API Routes

```typescript
// app/api/products/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { ProductService } from "@/services/ProductService";

export async function GET() {
  try {
    await connectDB();
    const products = await ProductService.getAllProducts();
    return NextResponse.json({ data: products });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const product = await ProductService.createProduct(body);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
```

#### Step 4: Create UI Components

```typescript
// app/dashboard/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product._id} className="p-4">
            <h3>{product.name}</h3>
            <p>${product.price}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### Step 5: Add Navigation

Update `config/nav.ts`:

```typescript
export const navLinks = [
  // ... existing links
  {
    title: "Products",
    url: "/dashboard/products",
    icon: Package,
  },
];
```

### Code Style Guidelines

1. **Use TypeScript** for all new files
2. **Server Components by default** - Only add `"use client"` when necessary
3. **Extract business logic** to services, not in API routes
4. **Use shadcn/ui components** for consistency
5. **Follow the service layer pattern**
6. **Use meaningful variable names**
7. **Add TypeScript interfaces** for all data structures
8. **Handle errors gracefully** with try/catch

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request to master branch
```

---

## Component Library

### Available shadcn/ui Components

Located in `components/ui/`:

- `badge.tsx` - Status badges
- `button.tsx` - Buttons with variants
- `card.tsx` - Card containers
- `input.tsx` - Form inputs
- `separator.tsx` - Dividers
- `sheet.tsx` - Slide-out panels
- `sidebar.tsx` - Navigation sidebar
- `skeleton.tsx` - Loading placeholders
- `table.tsx` - Data tables
- `tabs.tsx` - Tab navigation
- `tooltip.tsx` - Tooltips

### Custom Components

- `components/dashboard/app-sidebar.tsx` - Main navigation
- `components/dashboard/navbar.tsx` - Top bar with user info
- `components/dashboard/dashboard-content.tsx` - Dashboard widgets

### Using Components

```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Example() {
  return (
    <Card className="p-6">
      <Badge variant="default">Active</Badge>
      <h2 className="text-xl font-semibold">Title</h2>
      <Button variant="outline" size="sm">
        Click Me
      </Button>
    </Card>
  );
}
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Start MongoDB
# Windows:
net start MongoDB

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

#### 2. NextAuth Error: No Secret Provided

**Error:** `[next-auth][error][NO_SECRET]`

**Solution:** Add `NEXTAUTH_SECRET` to `.env.local`
```bash
openssl rand -base64 32
```

#### 3. Google OAuth Error: Redirect URI Mismatch

**Solution:** Ensure authorized redirect URI in Google Console matches:
```
http://localhost:3000/api/auth/callback/google
```

#### 4. Module Not Found: @/components/ui/button

**Solution:** Check `tsconfig.json` paths configuration:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 5. Tailwind Styles Not Applied

**Solution:** Restart dev server after Tailwind config changes:
```bash
# Stop server (Ctrl+C)
pnpm dev
```

---

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/haseeb-traders"
# ... other variables
```

### Deployment Checklist

- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Use MongoDB Atlas or managed database
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure OAuth redirect URIs for production
- [ ] Enable HTTPS
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy for MongoDB
- [ ] Set up CI/CD pipeline

### Recommended Platforms

- **Vercel** (Recommended for Next.js)
- **Railway** (Includes managed MongoDB)
- **AWS** (Full control)
- **DigitalOcean App Platform**

---

## Additional Resources

### Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Learning Resources

- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Tailwind CSS Tutorial](https://tailwindcss.com/docs/installation)
- [MongoDB University](https://university.mongodb.com/)

---

## Contributing

### Reporting Issues

1. Check existing issues
2. Create detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit PR with clear description

---

## License

[Your License Here]

---

## Support

For questions or support:
- Email: support@haseebtraders.com
- GitHub Issues: [Repository URL]

---

**Last Updated:** March 21, 2026
**Version:** 1.0.0
**Maintained by:** Haseeb Traders Development Team
