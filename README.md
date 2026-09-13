<div align="center">
  <img width="64" height="64" alt="Flowy" src="https://github.com/user-attachments/assets/02f42716-daff-48d6-85c9-86673b6aa428" />
  <h1>Flowy</h1>
  <p>A modern full-stack notes app for writing, drawing, organizing, and syncing ideas.</p>
  <p>
    <a href="https://flow-sandy.vercel.app/"><strong>Live Demo</strong></a>
    &nbsp;·&nbsp;
    <a href="https://github.com/hmntsriv/flowy"><strong>Source Code</strong></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white" alt="React + Vite" />
    <img src="https://img.shields.io/badge/Backend-Node%20%2B%20Express-339933?logo=node.js&logoColor=white" alt="Node + Express" />
    <img src="https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
  </p>
</div>

---

## Overview

Flowy is a MERN-based notes application built for both **focused writing** and **freeform visual thinking**.

It combines text notes and canvas notes with JWT authentication, autosave, starring, search, trash/restore, realtime updates, responsive mobile layouts, and light/dark themes.

The frontend and backend are deployed independently:

- **Frontend:** Vercel — https://flow-sandy.vercel.app/
- **Backend:** Render — https://flowy-backend-g7e4.onrender.com/

## Features

### Notes

- 📝 Text notes with debounced autosave
- 🎨 Freeform canvas notes
- ⭐ Star / unstar important notes
- 🔎 Search and filtered views
- 📋 Duplicate and copy notes
- 🔄 Save-status feedback
- 🛡️ Protected note APIs

### Trash

- 🗑️ Move notes to Trash instead of immediate permanent deletion
- ♻️ Restore notes
- ❌ Permanently delete notes

### Authentication

- 🔐 Registration and login
- 🔑 JWT-based authentication
- 🔒 Password hashing with bcrypt
- 🚪 Automatic handling of expired/invalid sessions

### UX

- 📱 Responsive desktop, tablet, and mobile layouts
- 🌙 Light and dark themes
- 👤 User profile/account panel
- 🔔 Toast-based success and error feedback
- ⚡ Loading and empty states
- Touch-friendly mobile interactions

### Realtime

- ⚡ Socket.IO-powered realtime note updates
- 👤 User-specific socket rooms
- 🔄 Updates can propagate across connected sessions

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Socket.IO Client
- Lucide React

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt
- Socket.IO
- CORS
- dotenv

## Architecture

```text
┌──────────────────────────────┐
│          Vercel              │
│      React + Vite            │
│         Frontend             │
└──────────────┬───────────────┘
               │
         REST + Socket.IO
               │
               ▼
┌──────────────────────────────┐
│          Render              │
│      Node + Express          │
│         Backend              │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          MongoDB             │
│      Persistent storage       │
└──────────────────────────────┘
```

## Project Structure

```text
flowy/
├── web/                         # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Node + Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
│
└── README.md
```

## Authentication & API

Flowy uses JWT authentication. After login, the frontend sends the JWT as a Bearer token for protected API requests.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Notes

```text
GET    /api/notes
GET    /api/notes/:id
POST   /api/notes
PUT    /api/notes/:id
DELETE /api/notes/:id
GET    /api/notes/trash
PATCH  /api/notes/:id/restore
DELETE /api/notes/:id/permanent
```

Protected note operations require authentication.

## Canvas Notes

Canvas notes use a drawing canvas and persist the resulting canvas data through the backend.

Canvas updates are debounced before being sent to the API to reduce unnecessary requests. The backend also allows larger JSON request bodies because canvas data can be significantly larger than a normal text note.

## Local Development

### 1. Clone

```bash
git clone https://github.com/hmntsriv/flowy.git
cd flowy
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend

Open a second terminal:

```bash
cd web
npm install
```

Create `web/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start Vite:

```bash
npm run dev
```

> Never commit `.env` files or production secrets to GitHub.

## Deployment

### Vercel — Frontend

- Root directory: `web`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:

```env
VITE_API_URL=https://flowy-backend-g7e4.onrender.com/api
```

### Render — Backend

- Root directory: `server`
- Start command: `npm start`
- Required environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=<provided by Render>
```

Production CORS must allow the deployed Vercel frontend origin.

## Screenshots

### Dashboard

**Light Mode**

<img width="1920" height="1080" alt="Flowy dashboard light mode" src="https://github.com/user-attachments/assets/1536c7c8-8fc8-4a8b-b80a-ce5ca88ba640" />

**Dark Mode**

<img width="1920" height="1080" alt="Flowy dashboard dark mode" src="https://github.com/user-attachments/assets/42eb52a8-ceaa-4a70-9728-fe54b70dc22c" />

### Login & Registration

**Light Mode**

<img width="1920" height="1080" alt="Flowy authentication light mode" src="https://github.com/user-attachments/assets/ad6ef4dd-8de6-4550-9c31-3fbccf79e0df" />

**Dark Mode**

<img width="1920" height="1080" alt="Flowy authentication dark mode" src="https://github.com/user-attachments/assets/9629b45b-46f5-4bd5-8b64-39a6e4a2ed18" />

### Canvas Notes

**Light Mode**

<img width="1920" height="1080" alt="Flowy canvas light mode" src="https://github.com/user-attachments/assets/ebb4d486-1412-492a-80b0-589a0746f514" />

**Dark Mode**

<img width="1920" height="1080" alt="Flowy canvas dark mode" src="https://github.com/user-attachments/assets/f7945df0-0052-46b6-85ab-6bf1e5016125" />

### Mobile

**Light Mode**

<img width="414" height="913" alt="Flowy mobile light mode" src="https://github.com/user-attachments/assets/d153fbd7-522a-415a-913a-1a3c40a64382" />
<img width="413" height="915" alt="Flowy mobile light mode second view" src="https://github.com/user-attachments/assets/b699dfe7-3143-4a48-a14e-9305c4753bb2" />

**Dark Mode**

<img width="415" height="914" alt="Flowy mobile dark mode" src="https://github.com/user-attachments/assets/82d2ff41-7d8e-46d5-a9db-7db958dadd5b" />
<img width="407" height="919" alt="Flowy mobile dark mode second view" src="https://github.com/user-attachments/assets/e6ae55b5-d2fe-43ea-88cc-adecc215abe8" />

## Testing Checklist

Before a production release, verify:

- Registration and login
- Protected routes
- Text note create / update / delete
- Canvas drawing, saving, reloading, and clearing
- Autosave and save-state feedback
- Star / unstar
- Search and filtering
- Duplicate / copy
- Trash / restore / permanent delete
- Expired JWT handling
- Realtime note updates
- Mobile navigation and editor flows
- Light / dark themes
- Production API and Socket.IO connectivity

## What This Project Demonstrates

Flowy is a portfolio-focused full-stack project demonstrating:

- React application architecture
- REST API design
- MongoDB data modeling with Mongoose
- JWT authentication and authorization
- Password hashing
- Debounced autosave
- Canvas data persistence
- Realtime communication with Socket.IO
- Responsive UI engineering
- Environment-based configuration
- Independent frontend/backend deployment
- Production debugging across Vercel, Render, and browser CORS

## Roadmap

Planned ideas for future iterations:

- Rich text editing
- Tags and folders
- File/image attachments
- Note sharing and collaboration
- More advanced canvas tools
- Offline/PWA support
- Rate limiting and stronger observability

## License

No open-source license is currently included.

---

<p align="center">Built with React, Node.js, Express, MongoDB, Socket.IO, and a questionable amount of debugging. 🚀</p>
