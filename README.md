# BridgeWell Financial Client Onboarding Portal

This is a custom-built onboarding platform for BridgeWell Financial, designed to simplify and streamline the client form intake process.

## Features

- Admin portal to create and manage onboarding forms
- Customizable questions (text, dropdown, file upload, etc.)
- Secure client access via unique login keys
- Client-side form completion experience with autosave
- File upload support with Microsoft OneDrive integration
- Admin dashboard to track form completion and review submissions

## Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, TailwindCSS
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth with login keys
- **File Storage:** Microsoft OneDrive/SharePoint
- **Deployment:** Vercel

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/bridgewell-onboard.git
cd bridgewell-onboard/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env.local` file in the frontend directory with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=your_microsoft_tenant_id
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── client/         # Client-facing pages
│   │   ├── dashboard/      # Admin dashboard
│   │   ├── login/          # Authentication pages
│   │   └── utils/          # Utility functions
│   └── components/         # Reusable UI components
├── public/                 # Static assets
└── supabase/              # Database migrations
```

## License

This project is for internal use by BridgeWell Financial.
