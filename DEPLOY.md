# Deploy Preview Setup with Railway

## Quick Start

1. **Sign up at [Railway](https://railway.app)**
2. **Connect GitHub repo**
3. **Create new project** → Select "Deploy from GitHub repo"
4. **Add services**:
   - Backend: Point to `/backend` directory
   - Frontend: Point to `/frontend` directory
5. **Enable PR previews**: Settings → Environments → Enable PR deploys

## Environment Variables

Set these in Railway dashboard for each service:

### Backend Service
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-linked if you add Postgres
SUPABASE_URL=...
SUPABASE_KEY=...
GEMINI_API_KEY=...
```

### Frontend Service  
```bash
NEXT_PUBLIC_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

## Files Setup

The monorepo uses separate `nixpacks.toml` configs:
- `backend/nixpacks.toml` - Python/FastAPI config
- `frontend/nixpacks.toml` - Next.js config

Railway auto-detects these and builds each service correctly.

## Automatic Features

- ✅ PR preview environments
- ✅ PostgreSQL database per environment
- ✅ Automatic SSL certificates
- ✅ GitHub deployment status checks
- ✅ Monorepo support with service detection
