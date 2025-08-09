# todo.house

[![codecov](https://codecov.io/gh/yoavf/todo.house/branch/main/graph/badge.svg?token=B18G0XA8PW)](https://codecov.io/gh/yoavf/todo.house)

## Features

- **Smart Task Generation**: AI-powered task creation from photos using camera or uploaded images
- **Camera with Zoom**: Web-based camera viewfinder with pinch-to-zoom, manual controls, and keyboard shortcuts
- **Internationalization**: Support for multiple languages with RTL text direction (English, Hebrew)
- **Real-time Collaboration**: Sync tasks across devices with live updates

## Authentication Overview

- Frontend uses Auth.js (NextAuth v5) with Google OAuth.
- All API calls go through a Next.js server-side proxy at `/api/proxy/*`, which injects `Authorization: Bearer <Auth.js JWE>`.
- Backend (FastAPI) validates the token via [`fastapi-nextauth-jwt`](https://github.com/TCatshoek/fastapi-nextauth-jwt).
- The frontend and backend must share the exact same `AUTH_SECRET` (or `NEXTAUTH_SECRET`).

See `frontend/AUTH_SETUP.md` for detailed setup and `backend/README.md` for backend configuration.
