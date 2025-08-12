# Family Social Networking Application

This repository contains a lightweight proof‑of‑concept for a private family social network with a Node/Express backend and a Next.js frontend.

## Project structure

```
backend/ (this repo root)
  - index.js           Express API server
  - package.json       Backend dependencies and scripts
  - data.json          JSON datastore for users/posts/tasks/categories
frontend/
  - pages/             Next.js pages (feed, tasks, login/register, admin)
  - components/        Shared UI components
  - styles/            Global styles
  - package.json       Frontend dependencies and scripts
```

## Backend

- Start: `npm install && npm start` (defaults to http://localhost:3001)
- Env: `JWT_SECRET` (optional, default dev secret)
- Endpoints:
  - Auth: `POST /api/auth/register`, `POST /api/auth/login`
  - Admin: `GET /api/admin/pending-users`, `POST /api/admin/users/:id/approve`, `POST /api/admin/users/:id/deny`
  - Posts: `GET /api/posts`, `POST /api/posts`
  - Tasks: `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
  - Categories: `GET /api/categories`
  - Facebook feed (placeholder): `GET /api/facebook/feed`

## Frontend

- Dev: `cd frontend && npm install && NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev` (http://localhost:3000)
- Build: `cd frontend && npm run build && npm start`

Pages:
- `/` Home feed (post, view posts, and a placeholder Facebook family feed)
- `/tasks` Task manager
- `/login` Login
- `/register` Register (pending approval unless you are the first user)
- `/admin` Approvals (owner/admin only)

## Notes
- First approved admin is auto‑assigned to the first registrant; subsequent users require admin approval.
- Replace the placeholder Facebook route with a real Graph API integration when ready.
- For production, move from JSON to a database and set a strong `JWT_SECRET`.