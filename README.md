# Chatters

**Orchestrates real-time messaging and video via Stream SDK (stream-chat v8.60.0) with JWT token auth (7-day expiry).**

**Automates secure user auth & social workflows — signup/login/logout, onboarding, friend requests — with randomized avatars from a 100-image pool.**

**Ships a full‑stack Vite (React) + Express + MongoDB stack with 21+ npm packages (frontend: 13, backend: 8) and dev scripts for instant local start.**

---

## Overview

Chatters is a full‑stack chat application that integrates Stream’s chat and video SDKs to provide real‑time messaging and media capabilities. It includes secure authentication, onboarding, friend management, and a token‑based system to authorize real‑time connections.

## Key Features

* Real‑time text + video chat using Stream SDKs (client: `stream-chat`, `@stream-io/video-react-sdk`).
* Secure auth with JWT cookies (`7d` expiry) and bcrypt password hashing.
* Onboarding workflow for user profile details (languages, bio, location).
* Social features: friend requests, accept/decline flows, incoming/outgoing lists, and friend lists.
* Stream user upsert on signup/onboarding to keep chat identities in sync.

## Technology Stack

* **Frontend:** React (Vite), `stream-chat-react`, `@stream-io/video-react-sdk`, `react-query`, `zustand`, Tailwind + DaisyUI.
* **Backend:** Node.js, Express, Mongoose (MongoDB), `stream-chat` (server), JWT, bcryptjs.
* **Dev tools:** Vite (frontend), Nodemon (backend).

## Quickstart (local)

**Prerequisites:** Node.js, npm/yarn, MongoDB (local or Atlas).

1. Clone the repo and open project root:

   ```bash
   git clone https://github.com/arth2004/Chatters.git
   cd Chatters
   ```

2. Install backend deps and start server:

   ```bash
   cd backend
   npm install
   cp .env.example .env   # fill values below
   npm run dev            # runs nodemon src/server.js
   ```

3. Install frontend deps and start dev server:

   ```bash
   cd ../frontend
   npm install
   npm run dev            # runs Vite (default: http://localhost:5173)
   ```

## Important environment variables

Create a `.env` file in `backend/` with at least:

```
PORT=5000
MONGO_URI=<your_mongo_connection_string>
JWT_SECRET_KEY=<secure_jwt_secret>
STREAM_API_KEY=<stream_api_key>
STREAM_API_SECRET=<stream_api_secret>
NODE_ENV=development
```

> Note: Stream SDK credentials must be provisioned from your Stream dashboard. Cookie `secure` flag is toggled by `NODE_ENV` in code.

## API Endpoints (high level)

* `POST /auth/signup` — create user, random avatar assignment (1–100), upsert Stream identity, set JWT cookie.
* `POST /auth/login` — validate credentials, set JWT cookie (7-day expiry).
* `POST /auth/logout` — clears cookie.
* `GET /auth/me` — returns authenticated user or `null`.
* `POST /auth/onboarding` — completes onboarding, updates Stream user, marks `isOnboarded`.
* `GET /chat/token` — returns a Stream chat token for frontend real‑time auth.
* User/social routes:

  * `GET /users` — recommended users
  * `GET /users/friends` — get friend list
  * `POST /users/friend-request/:id` — send request
  * `PUT /users/friend-request/:id/accept` — accept request
  * `GET /users/friend-requests` — incoming/outgoing lists

## Notes & Implementation details

* JWTs are sent via `httpOnly` cookies and expire in 7 days (configurable in `signup` & `login` controllers).
* Avatars are assigned using `https://avatar.iran.liara.run/public/{1..100}.png`.
* Global axios response interceptor included on frontend to centrally handle `401` responses.
* Friend request logic prevents self‑requests and duplicate requests, and uses `$addToSet` to avoid dupes when accepting.

## Development tips

* Use `npm run dev` in backend to enable hot reload with nodemon.
* Frontend dev server (Vite) supports fast refresh — use `npm run dev` inside `frontend/`.
* Keep your Stream API secret only on the server; token generation happens server‑side (`/chat/token`).

## Contributing

* Open issues for bugs or feature requests.
* Fork → create a feature branch → PR with clear changelog.

## License

* Backend `package.json` lists license: **ISC**.

---

