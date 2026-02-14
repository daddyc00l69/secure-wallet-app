# Credit Card Wallet - Frontend

A modern, responsive web application for managing credit cards, featuring a sleek user interface, comprehensive admin dashboard, and secure user authentication. Built with React and extensive modern tooling.

## 🚀 Technologies

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State Management & Data Fetching:** React Hooks, [Axios](https://axios-http.com/)
- **Form Handling:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)

## ✨ Features

- **User Dashboard:** View and manage credit cards with realistic 3D flip animations.
- **Admin Dashboard:** Manage users, managers, and support tickets with detailed analytics.
- **Manager Dashboard:** Dedicated interface for support staff to handle tickets.
- **Security:** Protected routes, JWT-based authentication, and role-based access control.
- **Responsive Design:** Fully optimized for desktop and mobile devices.

## 🛠️ Installation & Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root of the `frontend` directory:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```
    *Note: Update the URL to match your backend server address.*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 📦 Build for Production

To create a production-ready build:

```bash
npm run build
```

The artifacts will be generated in the `dist` directory. You can preview the build locally using:

```bash
npm run preview
```

## 📂 Project Structure

- `src/components`: UI components organized by feature (Auth, Admin, Manager, etc.).
- `src/context`: React Context providers for global state (AuthContext).
- `src/assets`: Static assets like images and global styles.
