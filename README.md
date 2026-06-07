# ConnectSphere – Real-Time Communication Platform

ConnectSphere is a robust, full-stack real-time communication platform designed to mimic core functionalities of Discord, Slack, and WhatsApp. It is built as a final-year academic capstone project to demonstrate scalable software engineering practices, WebSocket concurrency, peer-to-peer WebRTC media flows, and local client-side cryptographic message encryption.

---

## 👨‍💻 Developer & Project Owner Information

* **Developer Name:** Mukesh Podugu
* **Mobile Number:** +91 8143999463
* **Email:** [mukeshpodugu123@gmail.com](mailto:mukeshpodugu123@gmail.com)
* **Project Status:** Production-Ready Capstone Portfolio

---

## 🚀 Key Features

### 1. Authentication & Security
* **JWT Authentication:** Dual-tokens system (Access tokens valid for 15 mins, Secure HTTP-only Cookie Refresh tokens valid for 7 days).
* **Email Verification & Passwords:** Hashed passwords using `bcryptjs` and mock email verification tokens printed to backend console logs.
* **Security Middleware:** CORS configurations, Helmet headers, NoSQL Injection filters (mongoSanitize), and input XSS scrubbing.

### 2. Real-Time Chat System
* **Simulated End-to-End Encryption:** Messages are encrypted client-side using CryptoJS AES-256 before transit and stored as ciphertext in MongoDB. Decryption happens on the client, keeping message bodies private from database inspects.
* **Typing Indicator & Online Presence:** Live feedback updates via Socket.IO, with online statuses tracked via Redis memory fallbacks.
* **Receipts & Messaging Options:** Sent, Delivered, and Read receipt indicators; message edits, message deletion, reply threads, starred messages, pins, and message forwarding.

### 3. Voice & Video Calling (WebRTC)
* **One-to-One Streams:** Low-latency browser-to-browser media channels using WebRTC peer connections negotiated via WebSockets.
* **Stream Controls:** Interactive microphone mute, camera toggles, and live screen sharing (HTML5 Display Capture API).
* **Future Ready:** Modular code architecture ready for scaling signaling channels to multi-party room conferences.

### 4. Collaborative Group Channels
* **Team Channels:** Create groups, upload group avatar icons, manage description parameters, and define administrators.
* **Mod Controls:** Group administrators can add new participants, assign additional admins, or remove group members.

### 5. Analytics & Moderation Dashboard
* **Admin Dashboard:** Access-restricted view displaying total user directories, active groups, reported messages, and weekly message volume graphs (Recharts).
* **Abuse reports:** Users can flag offensive items, letting moderators resolve reports or purge content.

---

## 🛠 Tech Stack

* **Frontend:** React.js, TypeScript, Tailwind CSS, Redux Toolkit, React Router v6, Axios, Socket.IO Client, Framer Motion, Recharts, CryptoJS
* **Backend:** Node.js, Express.js, TypeScript, Socket.IO, Multer, Bcrypt, JsonWebToken, Redis Client
* **Database:** MongoDB Atlas (Mongoose ODM)

---

## 📂 Project Directory Structure

```
connectsphere/
├── shared/                 # Shared types, validation schemas, and constants
│   └── types.ts            # Common interfaces and Socket events
├── server/                 # Node.js/Express/TypeScript backend
│   ├── src/
│   │   ├── config/         # Environment variables & DB setup
│   │   ├── controllers/    # API Controllers (Auth, User, Chat, Group, Call, Admin)
│   │   ├── middleware/     # Auth, Security, XSS, RateLimiter, ErrorHandler
│   │   ├── models/         # Mongoose Schemas (User, Chat, Message, Group, Call, Report, File)
│   │   ├── routes/         # Express API Route mappings
│   │   ├── services/       # Presence (Redis/Memory), Upload (Multer)
│   │   ├── socket/         # Socket.IO connection and calling signaling handlers
│   │   └── app.ts          # Server entry point
│   ├── .env                # Local configuration values
│   └── package.json
└── client/                 # React/TypeScript/Tailwind frontend
    ├── src/
    │   ├── components/     # Sidebar, CallingOverlay, ProjectInfoModal
    │   ├── context/        # Dark/Light Theme Context
    │   ├── hooks/          # useSocket, useWebRTC
    │   ├── pages/          # Landing, Login, Register, Dashboard, ChatInterface, Profile, Settings, etc.
    │   ├── services/       # Axios API, CryptoJS Encryption/Decryption utilities
    │   ├── store/          # Redux Toolkit store and slices (Auth, Chat, Call)
    │   └── main.tsx        # React mounting entry script
    └── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file under the `/server` folder:

```env
# Server
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/connectsphere

# Redis (Optional: Leave empty for In-Memory Presence fallback)
REDIS_URL=

# Authentication
JWT_SECRET=connectsphere_secret_key_123
JWT_REFRESH_SECRET=connectsphere_refresh_key_456
```

---

## 📦 Local Installation Guide

### Prerequisites
* **Node.js** (v16.x or higher)
* **NPM** (v8.x or higher)
* **MongoDB** (Local instance or active Atlas cluster URI)

### Steps

1. **Clone and Navigate:**
   ```bash
   cd C:\Users\mukes\.gemini\antigravity\scratch\connectsphere
   ```

2. **Install all dependencies:**
   The workspace is configured with workspace scripts. Run:
   ```bash
   npm run install:all
   ```

3. **Configure Settings:**
   * Create `server/.env` based on the variables above.

4. **Start Development Servers:**
   Launch both Express and Vite servers concurrently:
   ```bash
   npm run dev
   ```
   * **Frontend Client:** Runs on [http://localhost:3000](http://localhost:3000)
   * **Backend Server:** Runs on [http://localhost:5000](http://localhost:5000)

---

## 🔌 Core API Endpoints

### Authentication
* `POST /api/auth/register` - Create new user account
* `POST /api/auth/verify-email` - Verify email token
* `POST /api/auth/login` - Verify password and return JWTs
* `POST /api/auth/refresh-token` - Issue rotated access token
* `POST /api/auth/logout` - Clear refresh tokens cookie

### Profile & Settings
* `GET /api/users/profile` - Fetch current user bio
* `PUT /api/users/profile` - Update bio / upload avatar file
* `GET /api/users/search?query=name` - Query registered users

### Conversations & Messages
* `GET /api/chats` - List recent direct and group chats
* `POST /api/chats/direct` - Open or fetch direct conversation
* `GET /api/chats/:chatId/messages` - Download message history
* `POST /api/chats/message` - Send encrypted message / file attachment
* `PUT /api/chats/message/:messageId` - Edit message content
* `DELETE /api/chats/message/:messageId` - Purge message
* `POST /api/chats/message/:messageId/pin` - Toggle pin flag

### Moderation & Analytics (Admin Only)
* `GET /api/admin/stats` - Fetch dashboard metrics datasets
* `GET /api/admin/reports` - List filed user complaints
* `PUT /api/admin/reports/:reportId` - Resolve or delete message
* `DELETE /api/admin/users/:userId` - Terminate user account

---

## 🛡️ License & Academic Credits

Developed under university guidelines as a Capstone Engineering Project. Hand-crafted with code annotations by **Mukesh Podugu**.
