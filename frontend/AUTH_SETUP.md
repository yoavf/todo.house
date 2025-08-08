# Authentication Setup Guide (Auth.js + FastAPI)

## Overview

The app uses Auth.js (NextAuth v5) on the frontend and FastAPI on the backend. All client requests go through a secure Next.js API proxy that injects the `Authorization: Bearer <Auth.js JWE>` header. The FastAPI backend validates this token using `fastapi-nextauth-jwt`.

## Google OAuth (provider)

1) In the Google Cloud Console, create an OAuth 2.0 Client (Web application).
   - Set the OAuth consent screen as required.
   - Authorized JavaScript origins:
     - `http://localhost:3000` (dev)
     - `https://dev.todo.house` (prod/staging)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://dev.todo.house/api/auth/callback/google` (prod/staging)

2) Frontend `.env.local` (or Railway service variables):
```bash
AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-client-secret

# Auth.js secret (MUST MATCH backend)
# Use a strong random string (hex or base64); keep identical on both services
AUTH_SECRET=your-shared-secret

# Required for Auth.js in production
NEXTAUTH_URL=https://dev.todo.house

# Backend public base URL used by the proxy
NEXT_PUBLIC_API_URL=https://api.todo.house
```

3) Backend environment (Railway service variables):
```bash
# Must be identical to the frontend secret
AUTH_SECRET=your-shared-secret

# Optional but recommended for secure-cookie defaults in libraries
AUTH_URL=https://dev.todo.house
```

## How requests flow (proxy)

- Browser → `GET /api/proxy/tasks` (Next.js route)
- Proxy reads the httpOnly session cookie server-side and forwards to the backend as:
  - `GET https://api.todo.house/api/tasks/`
  - with header `Authorization: Bearer <Auth.js JWE>`
- FastAPI validates the token using `fastapi-nextauth-jwt` and returns data.

This design ensures the session token never reaches client JavaScript (mitigates XSS).

## Production notes

- Do not expose the session token in any client-visible API. The `/api/auth/token` endpoint is intentionally disabled.
- Trailing slashes on collection endpoints are preserved by the proxy to prevent redirect header loss.
- Secrets must match exactly across frontend and backend. A mismatch causes 401 on backend with decryption failures.

## Troubleshooting

- 401 after sign-in on requests to `/api/proxy/*`:
  - Verify `AUTH_SECRET` matches on both frontend and backend.
  - Ensure `NEXTAUTH_URL` (frontend) is set to your deployed origin (e.g., `https://dev.todo.house`).
  - Ensure `NEXT_PUBLIC_API_URL` points to the backend (e.g., `https://api.todo.house`).
  - Clear cookies for the domain and retry sign-in.

## Email authentication (disabled)

Email auth requires a database adapter and is not enabled. To enable later, add an adapter (e.g., Prisma) and provider credentials, then configure an email provider (`AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`).