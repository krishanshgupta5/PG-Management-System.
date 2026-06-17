# 🏠 PG Management System

A full-stack web application for managing Paying Guest (PG) accommodations. It provides separate dashboards for **Landlords** and **Tenants**, streamlining property management, rent payments, complaint tracking, and notifications.

---

## 📸 Features

### 👤 Authentication
- JWT-based secure login & registration
- Role-based access: **Landlord** and **Tenant**
- Password hashing with bcrypt

### 🏢 Landlord Dashboard
- Add and manage PG properties and rooms
- View and manage tenant information
- Track rent payments and dues
- Respond to tenant complaints
- Send notifications to tenants
- View tenant feedback

### 🛋️ Tenant Dashboard
- View assigned room and property details
- Submit and track complaints
- View payment history and dues
- Receive notifications from landlord
- Submit feedback

### 🔔 Other Features
- **Email Notifications** via Nodemailer (rent reminders, updates)
- **Automated Cron Jobs** for scheduled rent reminders
- **File Uploads** for property images (via Multer)
- **Docker support** for easy containerized deployment

---

## 🛠️ Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, React Router v6, Vite, Lucide React   |
| Backend    | Node.js, Express.js                             |
| Database   | MongoDB (Mongoose ODM)                          |
| Auth       | JSON Web Tokens (JWT), bcryptjs                 |
| Email      | Nodemailer                                      |
| Scheduler  | node-cron                                       |
| File Upload| Multer                                          |
| DevOps     | Docker, Docker Compose                          |

---

## 📁 Project Structure

```
PG-Management-System/
├── backend/
│   ├── controllers/        # Route handler logic
│   ├── middleware/         # Auth & other middleware
│   ├── models/             # Mongoose schemas (User, Property, Room, Payment, Complaint, Notification, Feedback)
│   ├── routes/             # API route definitions
│   ├── uploads/            # Uploaded property images
│   ├── utils/              # Cron jobs & helpers
│   └── server.js           # Express app entry point
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── context/        # React context (auth state)
│       ├── pages/          # Page components (Login, LandlordDashboard, TenantDashboard, FeedbackForm)
│       ├── App.jsx
│       └── main.jsx
├── Dockerfile
├── docker-compose.yml
├── package.json            # Root scripts for running both frontend & backend
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/PG-Management-System.git
cd PG-Management-System
```

### 2. Install All Dependencies

```bash
npm run install-all
```

> This installs dependencies for the root, backend, and frontend in one command.

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```bash
# backend/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pg_management
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

> 💡 For `EMAIL_PASS`, use a [Gmail App Password](https://support.google.com/accounts/answer/185833), not your regular password.

### 4. Run the Application

**Run backend and frontend separately (development):**

```bash
# Terminal 1 — Start backend
npm run dev-backend

# Terminal 2 — Start frontend
npm run dev-frontend
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 🐳 Running with Docker

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running.

```bash
docker-compose up --build
```

The app will be available at `http://localhost:5000`.

To stop:
```bash
docker-compose down
```

---

## 🔌 API Endpoints

| Method | Endpoint                    | Description                  | Auth Required |
|--------|-----------------------------|------------------------------|---------------|
| POST   | `/api/auth/register`        | Register a new user          | ❌            |
| POST   | `/api/auth/login`           | Login and get JWT token      | ❌            |
| GET    | `/api/properties`           | Get all properties           | ✅            |
| POST   | `/api/properties`           | Create a property            | ✅ Landlord   |
| GET    | `/api/complaints`           | Get complaints               | ✅            |
| POST   | `/api/complaints`           | Submit a complaint           | ✅ Tenant     |
| GET    | `/api/payments`             | Get payment records          | ✅            |
| POST   | `/api/payments`             | Record a payment             | ✅            |
| GET    | `/api/notifications`        | Get notifications            | ✅            |
| POST   | `/api/feedback`             | Submit feedback              | ✅ Tenant     |

---

## 🚀 Build for Production

```bash
npm run build
npm start
```

This builds the React frontend into `frontend/dist/` and serves it via the Express backend on port `5000`.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Krishansh Gupta**  
[GitHub](https://github.com/krishanshgupta5)
