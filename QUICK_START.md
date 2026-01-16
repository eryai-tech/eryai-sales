# Quick Start - EryAI Sales Dashboard

## 🚀 Snabbstart för lokal utveckling

### 1. Förberedelser (en gång)

```bash
# Kör ai_sdr_tables.sql i Supabase SQL Editor
# Detta skapar alla tabeller för leads, campaigns, etc.
```

### 2. Installera projektet

```bash
# Ladda ner projektet från servern eller GitHub
cd /path/to/eryai-sales

# Installera dependencies
npm install

# Skapa .env.local
cp .env.example .env.local
```

### 3. Konfigurera .env.local

Redigera `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tjqxseptmeypfsymrrln.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_NcC_mJyrJTFRq18--J2Djg_8lFt8VQd
SUPABASE_SERVICE_ROLE_KEY=<hämta från Supabase Settings → API>
SALES_ADMIN_EMAIL=eric@eryai.tech
```

**Hitta Supabase keys:**
1. Gå till: https://supabase.com/dashboard/project/tjqxseptmeypfsymrrln/settings/api
2. Kopiera `anon/public` key
3. Kopiera `service_role` key (secret!)

### 4. Starta development server

```bash
npm run dev
```

### 5. Testa

Öppna: http://localhost:3001/login

**Login:**
- Email: `eric@eryai.tech`
- Password: Ditt lösenord

Du borde nu se Lead Dashboard med sample leads.

---

## 📂 Projektstruktur (förenklad)

```
eryai-sales/
├── app/
│   ├── api/leads/          # API endpoints
│   ├── leads/              # Lead dashboard UI
│   ├── login/              # Login page
│   └── layout.js           # Root layout
├── lib/
│   ├── supabase-server.js  # Server-side DB client
│   └── supabase-browser.js # Client-side DB client
└── middleware.js           # Auth protection
```

---

## 🎯 Vanliga uppgifter

### Lägga till ny feature

```bash
# Skapa ny branch
git checkout -b feature/new-feature

# Gör ändringar
# ...

# Testa lokalt
npm run dev

# Commit
git add .
git commit -m "Add new feature"

# Push
git push origin feature/new-feature
```

### Debugga API

```bash
# Testa API direkt
curl http://localhost:3001/api/leads

# Kolla server logs i terminalen där npm run dev körs
```

### Uppdatera dependencies

```bash
npm update
```

---

## 🐛 Vanliga problem

**Problem:** "Module not found"
```bash
rm -rf node_modules
npm install
```

**Problem:** "Supabase connection error"
- Kolla att .env.local är korrekt
- Verifiera keys i Supabase dashboard

**Problem:** "Port 3001 redan används"
```bash
# Ändra port i package.json
"dev": "next dev -p 3002"
```

---

## 📚 Nästa steg

1. **Läs README.md** för full översikt
2. **Läs DEPLOYMENT_GUIDE.md** för deployment
3. **Kolla ai_sdr_tables.sql** för databasstruktur
4. **Börja bygga nya features!**

---

## ✅ Checklist första gången

- [ ] Node.js installerat (v18+)
- [ ] npm installerat
- [ ] Git installerat
- [ ] Supabase keys hämtade
- [ ] .env.local konfigurerad
- [ ] npm install körts
- [ ] npm run dev fungerar
- [ ] Kan logga in på localhost:3001

---

Lycka till! 🚀
