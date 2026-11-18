# SkillSwap — Full-stack starter

This project keeps the uploaded SkillSwap dashboard design and connects it to a Node.js/Express API and MongoDB.

## Included features

- Student sign-up and sign-in
- Password hashing with bcrypt
- JWT-based login session
- Profile details and teach/learn skills saved in MongoDB
- Discover other students who have listed skills
- Book a learning session (10 credits are deducted)
- Credit transaction history
- Create project posts and request to join projects

## Requirements

- Node.js LTS and npm
- MongoDB Atlas account (or a local MongoDB server)
- VS Code (recommended)

## 1. Configure MongoDB

1. Create a free MongoDB Atlas cluster.
2. Create a database user and password.
3. In Network Access, allow your development IP address.
4. Copy the Node.js connection string for your cluster.
5. In the project root, duplicate `.env.example` and name the copy `.env`.
6. Paste your connection string into `MONGODB_URI`.
7. Replace `JWT_SECRET` with a long, random secret. Do not share or upload `.env`.

Example `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://dbUser:YOUR_PASSWORD@cluster0.example.mongodb.net/skillswap?retryWrites=true&w=majority
JWT_SECRET=use_a_long_random_secret_here
```

If your database password contains special characters, URL-encode them in the connection string.

## 2. Install packages

Open Terminal in the `skillswap-fullstack` folder and run:

```bash
npm install
```

## 3. Start the website

```bash
npm run dev
```

Open:

```text
http://localhost:5000
```

The frontend and API are served from the same Express server. Do not open `frontend/index.html` directly by double-clicking it; use the localhost address.

## 4. First test

1. Create an account on the sign-up screen.
2. Complete your profile and add at least one skill under “Skills I can teach”.
3. Create a second test account in another browser/incognito window and add teachable skills.
4. Sign back into the first account and open Discover to see the second account.
5. Book a session. The current starter charges 10 credits per booking.
6. Post a project and try joining it from another account.

New accounts start with 120 demo credits so you can test the flow. This is a starter credit policy, not a real payment system.

## API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Check signed-in user |
| GET / PUT | `/api/profile` | Read/update profile |
| PUT | `/api/profile/skills` | Save teach/learn skills |
| GET | `/api/people` | Discover students |
| GET / POST | `/api/sessions` | List/book sessions |
| GET | `/api/wallet` | Balance and transactions |
| GET / POST | `/api/projects` | List/create projects |
| POST | `/api/projects/:id/join` | Join a project |

## Important notes

- This is a learning/demo full-stack starter, not a production-ready service.
- It does not include email verification, password reset, chat, calendar invitations, payment processing, moderation, or administrator tools yet.
- Session requests are stored with `Requested` status. The starter does not yet include teacher acceptance/completion controls or automatic credit payout to teachers.
- The starter uses a fixed 10-credit booking cost. We can make this configurable later.
- Before public deployment, add rate limiting, stronger validation, secure cookie/token handling, logging, privacy controls and production CORS settings.
- Do not commit `.env` or real passwords to GitHub.
