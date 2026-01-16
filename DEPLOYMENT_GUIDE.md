# Sales Dashboard - Deployment Guide

## 📦 Steg-för-Steg Deployment

### 1️⃣ Förbered GitHub Repository

```bash
# Navigera till projektet (i din lokala maskin)
cd /path/to/eryai-sales

# Initiera git (om inte redan gjort)
git init

# Lägg till alla filer
git add .

# Första commit
git commit -m "Initial commit - EryAI Sales Dashboard"

# Skapa repo på GitHub (via GitHub.com eller CLI)
# Repository name: eryai-sales
# Private repo rekommenderas

# Lägg till remote
git remote add origin https://github.com/[username]/eryai-sales.git

# Push
git branch -M main
git push -u origin main
```

### 2️⃣ Deploy till Vercel

#### Option A: Via Vercel Dashboard

1. Gå till: https://vercel.com/new
2. Välj team: `team_GRUmokFVRt0HlXUFG8jeT82I`
3. Import Git Repository → Välj `eryai-sales`
4. Project Settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** .next
5. Environment Variables (lägg till dessa):

```
NEXT_PUBLIC_SUPABASE_URL=https://tjqxseptmeypfsymrrln.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_NcC_mJyrJTFRq18--J2Djg_8lFt8VQd
SUPABASE_SERVICE_ROLE_KEY=<HÄMTA FRÅN SUPABASE SETTINGS>
SALES_ADMIN_EMAIL=eric@eryai.tech
```

6. Klicka **Deploy**

#### Option B: Via Vercel CLI

```bash
# Installera Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3️⃣ Konfigurera Custom Domain

#### I Vercel:

1. Gå till Project Settings → Domains
2. Klicka "Add Domain"
3. Lägg till: `sales.eryai.tech`
4. Vercel ger dig DNS-instruktioner

#### I Spaceship (DNS Provider):

1. Logga in på Spaceship
2. Gå till: Domains → eryai.tech → DNS
3. Lägg till ny DNS-record:
   - **Type:** CNAME
   - **Name:** sales
   - **Value:** cname.vercel-dns.com
   - **TTL:** 3600 (eller Auto)
4. Spara

**Vänta 5-30 minuter** för DNS-propagation.

Testa med: `https://sales.eryai.tech`

### 4️⃣ Verifiera Deployment

Gå till `https://sales.eryai.tech/login` och testa:

1. **Login fungerar** - Logga in som `eric@eryai.tech`
2. **Leads laddar** - Du ser sample leads
3. **Filter fungerar** - Testa status/industry filter
4. **API fungerar** - Ändra status på ett lead

### 5️⃣ Uppdatera Environment Variables (vid behov)

Om du behöver uppdatera secrets:

1. Gå till Vercel Project → Settings → Environment Variables
2. Klicka på variabel → Edit
3. Uppdatera värde
4. Redeploy: Project → Deployments → ⋮ → Redeploy

---

## 🔒 Säkerhet

### Environment Variables

**ALDRIG commita dessa till git:**
- `SUPABASE_SERVICE_ROLE_KEY` (full databas-access)
- `RESEND_API_KEY` (när det läggs till)
- `CRON_SECRET` (när det läggs till)

**Kontrollera .gitignore:**
```
.env
.env.local
.env*.local
```

### Supabase RLS

Kontrollera att RLS-policies är aktiva:

```sql
-- Kolla RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'outreach_campaigns', 'outreach_messages', 'lead_interactions');
```

Alla ska ha `rowsecurity = true`.

---

## 🐛 Troubleshooting

### Problem: "Build failed"

**Lösning:**
```bash
# Kör lokalt först
npm run build

# Fixa alla errors som visas
# Push fix till GitHub
git add .
git commit -m "Fix build errors"
git push
```

### Problem: "Cannot connect to database"

**Lösning:**
- Kontrollera att `NEXT_PUBLIC_SUPABASE_URL` är korrekt
- Kontrollera att `SUPABASE_SERVICE_ROLE_KEY` är korrekt
- Testa lokalt med `npm run dev` först

### Problem: "Login fungerar inte"

**Lösning:**
- Kontrollera att användaren finns i Supabase Auth
- Kolla Supabase logs: Project → Logs → Auth

### Problem: "DNS pekar inte till Vercel"

**Lösning:**
```bash
# Kolla DNS propagation
nslookup sales.eryai.tech

# Vänta 30 min och försök igen
# DNS kan ta upp till 48h (men oftast 5-30 min)
```

### Problem: "Leads syns inte"

**Lösning:**
1. Kolla att tabellerna finns: `SELECT * FROM leads;` i Supabase
2. Kör `ai_sdr_tables.sql` om inte
3. Kontrollera RLS policies

---

## 📊 Monitoring

### Vercel Analytics

1. Gå till Project → Analytics
2. Se requests, errors, latency

### Supabase Logs

1. Gå till Supabase → Logs
2. Välj "API" för att se databas-queries
3. Välj "Auth" för att se login-attempts

---

## 🚀 Kommande Deploys

Efter första deployment är det enkelt:

```bash
# Gör ändringar i koden
# ...

# Commit
git add .
git commit -m "Add new feature"

# Push (Vercel deployar automatiskt)
git push origin main
```

Varje push till `main` triggar en ny deployment i Vercel.

---

## ✅ Deployment Checklist

- [ ] GitHub repo skapat
- [ ] Kod pushad till GitHub
- [ ] Vercel projekt skapat i rätt team
- [ ] Environment variables tillagda
- [ ] Första deployment lyckad
- [ ] Custom domain (sales.eryai.tech) konfigurerad
- [ ] DNS uppdaterad i Spaceship
- [ ] Kan logga in på sales.eryai.tech
- [ ] Leads laddar korrekt
- [ ] API fungerar (testa status-uppdatering)

---

## 📞 Support

Vid problem, kontakta: eric@eryai.tech
