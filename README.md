# 🏋️ GymSystem

A modern full-stack gym management platform built with Next.js, TypeScript and PostgreSQL.

---

## 🧠 Overview

GymSystem is a scalable web application that allows gym staff to manage members, memberships, payments and more — all from a single, intuitive dashboard.

Staff can:

- Register and manage gym members
- Create and assign membership plans
- Track active, expiring and expired memberships
- Record and review payments by method and period
- Renew memberships while respecting remaining days
- Monitor key metrics from a real-time dashboard with period filters
- Manage staff accounts with role-based access control

This project demonstrates professional full-stack architecture, secure authentication with JWT, relational database design, role-based authorization, and clean code practices.

---

## 🛠 Tech Stack

### Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS

### Backend

- Next.js API Routes
- JWT Authentication (jose)
- Drizzle ORM

### Database

- PostgreSQL

### Other Tools

- bcryptjs
- Zod (schema validation)
- Git
- ESLint

---

## 🗄 Database Architecture

Relational data model with full referential integrity:

- **usuarios** — staff accounts with roles (admin, recepcionista)
- **miembros** — gym members with personal info
- **planes** — membership plans with duration and pricing
- **inscripciones** — memberships linking members to plans
- **pagos** — payment records linked to inscriptions

Key design decisions:

- Memberships are never modified — each renewal creates a new record, preserving full history
- Membership status is calculated dynamically from `fecha_vencimiento` vs `CURRENT_DATE`
- Soft delete for members (activo flag) preserves historical data integrity

---

## 🔐 Authentication & Authorization

- Secure password hashing using bcryptjs
- JWT-based authentication using jose (Edge Runtime compatible)
- HttpOnly cookie storage for tokens (8h session)
- Protected routes using Next.js proxy middleware
- Role-based access control — admin and recepcionista roles
- Admin-only routes: planes, usuarios
- API-level role verification on sensitive endpoints

---

## 📦 Features

### Authentication

- [x] Staff login
- [x] JWT generation and verification
- [x] HttpOnly cookie session
- [x] Protected routes via middleware
- [x] Auto-redirect on expired session

### Members

- [x] Register new members
- [x] Edit member profile
- [x] Search and filter members
- [x] Activate / deactivate members
- [x] View membership history per member
- [x] Pagination

### Plans

- [x] Create membership plans
- [x] Edit plans (name, price, duration)
- [x] Activate / deactivate plans

### Memberships (Inscripciones)

- [x] Register new membership with payment
- [x] Renew membership (respects remaining days)
- [x] Filter by status (active, expiring, expired)
- [x] Search by member or plan
- [x] Filter by period (month / year)
- [x] Pagination

### Payments

- [x] Auto-record payment on inscription
- [x] Filter by payment method
- [x] Search by member or plan
- [x] Filter by period (month / year)
- [x] Total summary by method
- [x] Pagination

### Dashboard

- [x] Active members count
- [x] New inscriptions this period
- [x] Expiring memberships (next 7 days)
- [x] Expired memberships
- [x] Revenue breakdown by payment method
- [x] Daily income chart
- [x] Daily inscription chart
- [x] Period filter (month / year)
- [x] Month-over-month comparison

### Users (Admin only)

- [x] Create staff accounts
- [x] Edit user name and role
- [x] Activate / deactivate users
- [x] Reset user password

---

## 🚀 Getting Started

Install dependencies:

```bash
npm install
```

Set up the database:

```bash
# Create the database in PostgreSQL
createdb gimnasio

# Run the schema script
psql -U postgres -d gimnasio -f gym_database.sql
```

Seed the admin user:

```bash
npm run seed
```

Run the development server:

```bash
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/gimnasio
JWT_SECRET=your_super_secret_key_minimum_32_characters
JWT_EXPIRES_IN=8h
```

⚠️ Never commit your `.env.local` file.

---

## 📁 Project Structure

```
managementgym/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard pages
│   │   ├── page.tsx           # Dashboard with stats
│   │   ├── miembros/          # Members module
│   │   ├── inscripciones/     # Memberships module
│   │   ├── planes/            # Plans module
│   │   ├── pagos/             # Payments module
│   │   └── usuarios/          # Users module (admin only)
│   └── api/                   # API routes
│       ├── auth/              # Login, logout, me
│       ├── miembros/          # Members CRUD
│       ├── inscripciones/     # Memberships + renewal
│       ├── planes/            # Plans CRUD
│       ├── pagos/             # Payments
│       ├── usuarios/          # Staff management
│       └── dashboard/stats/   # Dashboard metrics
├── components/
│   ├── layout/                # Sidebar, Header
│   └── ui/                    # Reusable components
├── lib/
│   ├── db/                    # Drizzle connection and schema
│   ├── auth/                  # JWT, session utilities
│   └── validations/           # Zod schemas
├── proxy.ts                   # Route protection middleware
└── drizzle.config.ts
```

---

## 🎯 Purpose of This Project

This project was built to demonstrate professional full-stack development skills, including:

- Modern React and Next.js architecture (App Router)
- Backend API design with proper validation
- Relational database modeling and Drizzle ORM
- JWT authentication with Edge Runtime compatibility
- Role-based access control at route and API level
- Reusable component architecture
- Clean project structure and scalable patterns

---

## 📌 Author

Amadeo Siles
Full Stack Developer
