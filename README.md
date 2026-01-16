# EryAI Sales Dashboard

AI-driven lead management och outreach automation för EryAI's säljteam.

## 🎯 Översikt

Sales Dashboard är ett separat system från kunddashboard (dashboard.eryai.tech) och används endast av EryAI's säljteam för att:
- Hantera leads (restauranger, bilverkstäder, etc)
- Skapa och köra outreach-kampanjer
- Spåra email-interaktioner
- Automatisera lead nurturing med AI

## 🏗️ Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (samma som övriga EryAI-system)
- **Auth:** Supabase Auth
- **Email:** Resend.com (kommer)
- **Hosting:** Vercel
- **Domain:** sales.eryai.tech

## 📁 Projektstruktur

```
eryai-sales/
├── app/
│   ├── api/
│   │   └── leads/
│   │       ├── route.js           # GET/POST leads
│   │       └── [id]/
│   │           └── route.js       # GET/PATCH/DELETE lead
│   ├── leads/
│   │   ├── page.js                # Server component
│   │   └── LeadDashboardClient.js # Client component
│   ├── login/
│   │   └── page.js                # Login page
│   ├── layout.js
│   ├── globals.css
│   └── page.js                    # Redirect till /leads
├── lib/
│   ├── supabase-server.js         # Server-side client
│   └── supabase-browser.js        # Client-side client
├── middleware.js                   # Auth middleware
├── package.json
├── next.config.js
├── tailwind.config.js
└── .env.example
```

## 🚀 Installation

### 1. Klona repot (när det är på GitHub)

```bash
git clone https://github.com/[username]/eryai-sales.git
cd eryai-sales
```

### 2. Installera dependencies

```bash
npm install
```

### 3. Skapa .env.local

Kopiera `.env.example` till `.env.local` och fyll i värden:

```bash
cp .env.example .env.local
```

**Fyll i:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://tjqxseptmeypfsymrrln.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_NcC_mJyrJTFRq18--J2Djg_8lFt8VQd
SUPABASE_SERVICE_ROLE_KEY=<från Supabase>
SALES_ADMIN_EMAIL=eric@eryai.tech
```

### 4. Kör development server

```bash
npm run dev
```

Öppna [http://localhost:3001](http://localhost:3001) i din browser.

## 📊 Databas Setup

Innan du kör applikationen, kör dessa SQL-filer i Supabase SQL Editor:

1. **ai_sdr_tables.sql** - Skapar alla tabeller
2. **pipeline_stats_function.sql** - Skapar SQL-funktion

Se `INSTALLATION_GUIDE.md` för detaljer.

## 🔐 Auth & Access

- **Endast säljteam:** Sales Dashboard är inte tillgängligt för EryAI's kunder
- **Login:** Använd befintligt Supabase Auth-konto (eric@eryai.tech)
- **Säkerhet:** Middleware skyddar alla routes utom /login

## 🌐 Deployment (Vercel)

### Första gången:

1. Push till GitHub
2. Importera projekt i Vercel
3. Välj team: `team_GRUmokFVRt0HlXUFG8jeT82I`
4. Lägg till Environment Variables (från .env.example)
5. Deploy

### Kommande deploys:

```bash
git add .
git commit -m "Update"
git push origin main
```

Vercel deployar automatiskt.

### Custom Domain (sales.eryai.tech)

I Vercel Project Settings:
1. Domains → Add Domain
2. Lägg till: `sales.eryai.tech`
3. Uppdatera DNS i Spaceship:
   - Type: CNAME
   - Name: sales
   - Value: cname.vercel-dns.com

## 📝 Environment Variables (Vercel)

Lägg till dessa i Vercel Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SALES_ADMIN_EMAIL
```

## 🎨 Features

### ✅ Klart:
- Login & Auth
- Lead Dashboard
- Lista leads med filter
- Uppdatera lead status
- Pipeline stats

### 🔜 Kommer:
- Lägg till lead-formulär
- Lead detail-sida
- CSV-import
- Email kampanjer
- AI email generation
- Resend integration
- Vercel Cron Jobs

## 🧑‍💻 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📚 Related Repos

- **eryai-landing** → eryai.tech
- **ery-ai-demo-restaurang** → bella-italia.eryai.tech
- **eryai-dashboard** → dashboard.eryai.tech
- **eryai-sales** → sales.eryai.tech (detta repo)

## 🤝 Team Access

Endast EryAI säljteam har access till detta dashboard.

För frågor, kontakta: eric@eryai.tech
