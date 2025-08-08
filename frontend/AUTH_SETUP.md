# Authentication Setup Guide

## Current Configuration

The app uses NextAuth for authentication with the following providers:

### Google OAuth (Currently Active)
To set up Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: TodoHouse (or your app name)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - Your production URL
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)

5. Add to `.env.local`:
```bash
AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-client-secret
```

### Email Authentication (Currently Disabled)
Email authentication with Resend is configured but disabled because it requires a database adapter.

To enable email authentication in the future:

1. Install a database adapter (e.g., Prisma):
```bash
pnpm add @prisma/client @auth/prisma-adapter prisma
```

2. Set up Prisma schema for NextAuth tables
3. Uncomment the Resend provider in `src/auth/index.ts`
4. Ensure `AUTH_RESEND_KEY` is set in `.env.local`

## Environment Variables

Required for authentication:
```bash
# NextAuth secret (auto-generated)
AUTH_SECRET="your-secret-here"

# Google OAuth (at least one provider required)
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"

# Email provider (optional, requires database adapter)
AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
AUTH_EMAIL_FROM="noreply@yourdomain.com"
```

## Troubleshooting

### "No authentication providers configured" error
- Ensure either Google OAuth credentials are set in `.env.local`
- Restart the dev server after adding environment variables

### "MissingAdapter" error
- This occurs when trying to use email authentication without a database adapter
- Either configure Google OAuth or set up a database adapter for email auth

### Google OAuth not working
- Check that redirect URIs match exactly in Google Console
- Ensure both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set
- Clear browser cookies and try again