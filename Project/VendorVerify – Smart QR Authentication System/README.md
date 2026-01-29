# VendorVerify – Smart QR Authentication System

A full-stack secure QR authentication platform for verifying vendor identity and product authenticity using cryptographically secure QR codes, real-time verification, and immutable audit logs.

## 🚀 Key Features
- **Secure QR Generation**: Vendors can generate unique, cryptographically secure QR tokens for their products.
- **Real-Time Verification**: Verifiers can instantly scan and authenticate products using a built-in camera interface.
- **Audit Logging**: Every scan attempt is logged with metadata (IP, timestamp, result) to an immutable audit trail.
- **Role-Based Access Control (RBAC)**: Distinct dashboards for Vendors (Management), Verifiers (Scanning), and Admins (System Health & Global Audit).
- **Security Alerts**: Real-time detection of counterfeit or duplicate QR scan attempts.

## 🛠 Tech Stack
- **Frontend**: React.js, Custom CSS, Lucide Icons
- **Backend**: Node.js, Vercel Serverless Functions
- **Database/Auth**: Supabase (PostgreSQL with RLS)
- **QR Engine**: Html5-QRCode & QRCode.React

## 📁 Project Structure
- `/src`: React frontend source code.
- `/api`: Backend serverless functions (Node.js).
- `/supabase`: SQL schema and RLS policies.
- `/public`: Static assets.

## ⚙️ Setup Instructions

### 1. Database Setup
- Create a new project on [Supabase](https://supabase.com).
- Run the SQL script found in `/supabase/schema.sql` in the Supabase SQL Editor.
- Enable Email/Password Auth in the Supabase Dashboard.

### 2. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Installation
```bash
npm install
```

### 4. Running Locally
```bash
npm run dev
```

## 🔒 Security Model
- **JWT (Supabase Auth)**: All API requests and frontend routes are protected.
- **Row Level Security (RLS)**: Database-level security ensuring users can only access their authorized data.
- **Hashed Tokens**: QR tokens are hashed before storage to prevent leakage (Implemented in `/api/verify.js`).
- **Immutable Logs**: Audit logs are append-only to ensure integrity.

## 🎨 UI/UX Guidelines
- **Modern & Professional**: Clean interface with high contrast and clear status indicators.
- **Mobile First**: Optimized scanning interface for mobile devices.
- **Visual Feedback**:
  - 🟢 Green: Authentic
  - 🟡 Amber: Already Scanned / Used
  - 🔴 Red: Invalid / Counterfeit
