# Credit Card Wallet - Backend

The robust RESTful API powering the Credit Card Wallet application. It checks all the boxes for a secure, scalable, and efficient backend system, handling user authentication, data management, and administrative operations.

## 🚀 Technologies

- **Runtime:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) (using Mongoose)
- **Authentication:** JWT (JSON Web Tokens) & Bcrypt
- **Email Service:** Nodemailer
- **Environment Management:** Dotenv
- **Security:** CORS enabled

## 🔑 Key Features

- **Authentication:** Secure login/register flows with password encryption.
- **Role-Based Access Control:** Distinct middlewares for User, Manager, and Admin routes.
- **Ticket Management:** Support system api for creating, replying to, and closing tickets.
- **User Management:** Admin APIs to view, verify, and manage users.
- **Analytics:** Data aggregation for admin instrumentation.

## 🛠️ Installation & Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root of the `backend` directory with the following variables:
    ```env
    PORT=5000
    MONGO_URI=mongodb+srv://<your-connection-string>
    JWT_SECRET=<your-super-secret-key>
    CORS_ORIGIN=*
    EMAIL_USER=<your-email@gmail.com>
    EMAIL_PASS=<your-app-password>
    APP_URL=http://localhost:5173
    ```

4.  **Build the project:**
    ```bash
    npm run build
    ```

5.  **Start the server:**
    ```bash
    npm start
    ```
    *For development with auto-reload:*
    ```bash
    npm run dev
    ```

## 📡 API Documentation

The API is organized into the following main routes:

- `/api/auth`: Authentication endpoints (login, register, verify).
- `/api/users`: User profile management.
- `/api/cards`: Credit card data operations.
- `/api/admin`: Administrative actions and analytics.
- `/api/manager`: Support ticket management for managers.
- `/api/support`: General support ticket creation.

## 🚀 Deployment

This project is configured for easy deployment on platforms like Render. See `render.yaml` in the parent directory for infrastructure-as-code configuration.
