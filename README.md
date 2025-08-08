# todo.house

[![codecov](https://codecov.io/gh/yoavf/todo.house/branch/main/graph/badge.svg?token=B18G0XA8PW)](https://codecov.io/gh/yoavf/todo.house)

## Authentication Overview

- Frontend uses Auth.js (NextAuth v5) with Google OAuth.
- All API calls go through a Next.js server-side proxy at `/api/proxy/*`, which injects `Authorization: Bearer <Auth.js JWE>`.
- Backend (FastAPI) validates the token via [`fastapi-nextauth-jwt`](https://github.com/TCatshoek/fastapi-nextauth-jwt).
- The frontend and backend must share the exact same `AUTH_SECRET` (or `NEXTAUTH_SECRET`).

See `frontend/AUTH_SETUP.md` for detailed setup and `backend/README.md` for backend configuration.
