# 💳 Secure Wallet App

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg) ![Stack](https://img.shields.io/badge/stack-MERN-purple.svg)

> A production-ready, full-stack digital wallet application built for security, scalability, and seamless user experience.

---

## 📖 Overview

The **Secure Wallet App** is a comprehensive financial dashboard allowing users to manage credit cards, bank accounts, and transactions. It features a robust **Node.js/Express backend** for secure API handling and a dynamic **React frontend** with 3D card animations and real-time data visualization.

## 🏗️ Project Structure

This repository is organized as a monorepo containing both the frontend and backend services.

```
secure-wallet-app/
├── backend/                 # Node.js + Express Server
│   ├── models/              # MongoDB Schemas (User, Card, BankAccount)
│   ├── routes/              # API Endpoints (Auth, Admin, Manager)
│   ├── middleware/          # Security Middleware (Auth, Role-Check)
│   ├── utils/               # Helpers (Email, Encryption)
│   └── index.ts             # Server Entry Point
│
├── frontend/                # React + Vite Client
│   ├── src/
│   │   ├── components/      # UI Components (Cards, Dashboard, Auth)
│   │   ├── content/         # Global State (AuthContext)
│   │   ├── assets/          # Images & Static Files
│   │   └── App.tsx          # Main Application Component
│   └── vite.config.ts       # Vite Configuration
│
└── render.yaml              # Infrastructure-as-Code for Deployment
```

## ⚡ Tech Stack

### Frontend
*   **Core:** React 19, TypeScript
*   **Build:** Vite
*   **Styling:** Tailwind CSS v4, Lucide Icons
*   **Animation:** Framer Motion
*   **State:** React Context API

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB + Mongoose
*   **Security:** JWT Auth, Bcrypt, CORS
*   **Email:** Nodemailer

## 🚀 Getting Started

Follow these steps to run the application locally.

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)

### 1️⃣ Backend Setup
```bash
cd backend
npm install
# Create a .env file with your credentials (see backend/README.md)
npm run dev
```

### 2️⃣ Frontend Setup
```bash
cd frontend
npm install
# Create a .env file with VITE_API_URL (see frontend/README.md)
npm run dev
```

## 🌐 Deployment

This project includes a `render.yaml` file for **zero-configuration deployment** on [Render](https://render.com).

### Vercel Deployment (Frontend Only)

If you are deploying the **frontend** to Vercel:

1.  **Import Project:** Select the repository in Vercel.
2.  **Framework Preset:** Choose **Vite**.
3.  **Root Directory:** You **MUST** change this to `frontend`.
    *   Click "Edit" next to Root Directory.
    *   Select `frontend`.
4.  **Output Directory:** Ensure this is set to `dist` (default for Vite).
5.  **Environment Variables:** Add `VITE_API_URL` (your backend URL).

We have included a `vercel.json` in the `frontend` folder to help with configuration.


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

*Built with ❤️ by daddyc00l69*
