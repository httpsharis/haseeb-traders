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

Haseeb Traders is a comprehensive billing and invoicing solution built with Next.js 16, React 19, TypeScript, and MongoDB. It streamlines invoice management with features like client tracking, multi-line item bills, automated tax calculations, global searching, and Google OAuth authentication.

### Key Highlights

- **Secure Authentication** - Google OAuth integration via NextAuth.js
- **Dashboard Analytics** - Real-time statistics, recent activities, and quick actions
- **Invoice Management** - Master-detail invoice structure with multiple line items
- **Drafts System** - Save incomplete bills or summaries using custom React hooks
- **PDF Generation** - Dynamically create formatted invoices ready for print
- **Tax & Categories** - Configurable tax groups and product categories with automatic calculations
- **Client Tracking** - Global search across the application with pagination and filtering
- **Modern UI** - Built with shadcn/ui, Phantom UI, and Tailwind CSS v4
- **Fast & Scalable** - Service layer architecture coupled with Next.js App Router API Routes

---

## Features

### Authentication & Security
- Google OAuth 2.0 integration
- Server-side session management
- Protected dashboard routes with automatic redirects

### Invoice Management
- **Summaries** - Master invoice records linked to specific clients
- **Bills** - Highly detailed line items tied to specific summaries
- **Auto-numbering** - Automatic sequence generation for invoices and bills
- **Cascade Operations** - Deleting summaries effortlessly cleans up associated bills
- **Draft System** - Temporarily save invoices before finalizing

### Financial Tracking & Configuration
- Multiple dynamic tax types per bill calculation
- Discounts and commissions tracking
- Product categories for seamless organization
- Complete decimal precision with `decimal.js`

### Client & Application Management
- Dedicated interfaces for tracking client invoices and statistics
- Global quick search dialog functionality built-in
- Paginated data tables and real-time filtering

---

## Tech Stack

### Frontend
- **[Next.js 16.1](https://nextjs.org/)** - React framework leveraging the new App Router
- **[React 19.2](https://react.dev/)** - UI library with server components and concurrent rendering
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety and IDE autocompletion
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first styling including PostCSS configuration
- **[shadcn/ui](https://ui.shadcn.com/) / Radix UI** - Accessible UI components foundation
- **Phantom UI** - Pre-built specialized components
- **[Lucide React](https://lucide.dev/)** - Fast and sleek icon library

### Backend
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - RESTful API endpoint handlers
- **[MongoDB](https://www.mongodb.com/)** - Flexible NoSQL database
- **[Mongoose 9.3](https://mongoosejs.com/)** - Elegant MongoDB object modeling (ODM)
- **[NextAuth.js 4.24](https://next-auth.js.org/)** - Powerful authentication handling

### Additional Libraries
- **[@react-pdf/renderer](https://react-pdf.org/)** - PDF document generation
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Password hashing
- **[decimal.js](https://www.npmjs.com/package/decimal.js)** - Precise decimal mathematics

---

## Getting Started

### Prerequisites

Ensure you have the following mapped properly in your environment:

- **Node.js** 18.0 or higher
- **pnpm** package manager
- **MongoDB** Database connection string
- **Google OAuth Credentials**

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
   ```

4. **Seed Database** (Optional)
   You can populate configuration and administrative defaults:
   ```bash
   pnpm seed
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
haseeb-traders/
├── app/                          # Next.js App Router (Pages & APIs)
│   ├── api/                      # Full REST API implementation layer
│   │   ├── auth/                 # NextAuth route handling
│   │   ├── dashboard/            # Dashboard stats and recent activities
│   │   ├── search/               # Global search functionality
│   │   └── [features]/           # Resource-specific APIs (bills, clients, etc.)
│   ├── dashboard/                # Protected user interface views
│   └── login/                    # Public authentication pages
│
├── components/                   # Reusable React components
│   ├── features/                 # Modular feature-specific views (Bills, Summaries, Dashboard)
│   ├── layout/                   # Universal shell components (Nav, Sidebar, Search)
│   ├── types/                    # Component-specific types
│   └── ui/                       # Core, atomic UI elements (shadcn/ui + more)
│
├── config/                       # Application configuration
│   ├── db.ts                     # MongoDB connection singleton
│   └── nav.ts                    # Global navigation layout schema
│
├── hooks/                        # Custom React workflows
│   ├── use-mobile.ts             # Screen responsive helpers
│   ├── useBillDraft.tsx          # Bill draft preservation state
│   └── useSummaryDraft.tsx       # Summary draft preservation state
│
├── lib/                          # Non-React utility helpers
│   ├── rateLimit.ts              # API request debouncing/limiting
│   ├── summaryHelper.ts          # Central aggregation helpers
│   └── utils.ts                  # General-purpose utility functions
│
├── models/                       # Mongoose database models
│   ├── billModel.ts
│   ├── categoryModel.ts
│   ├── clientModel.ts
│   ├── summaryModel.ts
│   └── taxTypeModel.ts
│
├── scripts/                      # Standalone runner scripts
│   └── seed.ts                   # Initial data population
│
├── services/                     # Business logic access layers
│   ├── billService.ts
│   ├── categoryService.ts
│   ├── clientService.ts
│   ├── summaryService.ts
│   └── taxTypeService.ts
│
└── types/                        # Global standardized TypeScript definitions
    ├── bill.ts
    ├── category.ts
    ├── client.ts
    ├── dashboard.ts
    ├── summary.ts
    └── tax.ts
```

---

## API Reference
The application splits distinct functionalities within RESTful services hosted securely under `/api/`.

| Categorization | Endpoint | Method | Focus |
|----------------|----------|--------|-------|
| **Auth** | `/api/auth/[...nextauth]` | GET/POST | Session Lifecycle |
| **Search** | `/api/search` | GET | Global entity searching |
| **Dashboard** | `/api/dashboard/stats` | GET | Analytics extraction |
| **Dashboard** | `/api/dashboard/recent` | GET | Most recent app activity |
| **Clients** | `/api/clients` | GET/POST | Client directory management |
| **Summaries** | `/api/summaries` | GET/POST | Read/write master invoices |
| **Bills** | `/api/bills` | GET/POST | Masterline operations |
| **Metadata** | `/api/tax-types` | GET | Retrieve tax logic |

For deep queries, refer to the corresponding service logic stored in the `/services/` directory.

---

## Development

### Code Style & Architecture
This project follows strict clean-code principles:
- **TypeScript strict mode**: Ensuring maximum type inference and stability.
- **Service Layer Pattern**: Logic is decoupled from `route.ts` into reusable service functions (`services/...`).
- **Server Components Paradigm**: Employed widely; `"use client"` is utilized primarily in `components/features/` or `components/ui/`.
- **Atomic Commits**: Encouraged modular changes.

### Adding UI Components
Easily integrate new interactive components seamlessly via:
```bash
npx shadcn@latest add [component-name]
```

---
*Created and maintained by Haseeb Traders platform management.*
