# MedSync - Medical Equipment & Staff Management System

A comprehensive MERN stack application designed to manage medical equipment, staff, and operational workflows in healthcare facilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Features](#project-features)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**MedSync** is a medical management system that streamlines operations for healthcare facilities by providing tools to:
- Manage medical staff and doctor information
- Track medical equipment inventory and maintenance
- Handle rush requests and emergency situations
- Monitor stock levels and supplies

## 🛠 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin request handling
- **dotenv** - Environment variable management

### Frontend
- **React 19** - UI library
- **Vite** - Next-generation build tool
- **Axios** - HTTP client
- **ESLint** - Code quality tool
- **CSS3** - Styling

## 📁 Project Structure

```
medsync/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── doctorController.js   # Doctor management logic
│   │   ├── equipmentController.js# Equipment management logic
│   │   ├── rushController.js     # Rush request handling
│   │   └── stockController.js    # Stock management logic
│   ├── models/
│   │   ├── Doctor.js             # Doctor schema
│   │   ├── Equipment.js          # Equipment schema
│   │   ├── Rush.js               # Rush request schema
│   │   └── Stock.js              # Stock schema
│   ├── routes/
│   │   ├── doctorRoutes.js       # Doctor endpoints
│   │   ├── equipmentRoutes.js    # Equipment endpoints
│   │   ├── rushRoutes.js         # Rush request endpoints
│   │   └── stockRoutes.js        # Stock endpoints
│   ├── .env                      # Environment variables
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express server setup
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Card.jsx          # Reusable card component
│   │   │   ├── Navbar.jsx        # Navigation bar
│   │   │   └── Sidebar.jsx       # Sidebar navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── Doctors.jsx       # Doctors management page
│   │   │   ├── Equipment.jsx     # Equipment management page
│   │   │   ├── Rush.jsx          # Rush requests page
│   │   │   └── Stock.jsx         # Stock management page
│   │   ├── services/
│   │   │   └── api.js            # API service calls
│   │   ├── App.jsx               # Root component
│   │   ├── main.jsx              # React entry point
│   │   ├── App.css               # App styling
│   │   └── index.css             # Global styling
│   ├── public/                   # Static assets
│   ├── .eslintrc.js              # ESLint configuration
│   ├── vite.config.js            # Vite configuration
│   ├── index.html                # HTML template
│   ├── package.json              # Frontend dependencies
│   └── README.md                 # Frontend documentation
│
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (local or MongoDB Atlas connection)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medsync
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## ⚙️ Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/medsync
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medsync

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables (if needed)

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🎮 Running the Application

### Development Mode

**Terminal 1 - Start Backend Server:**
```bash
cd backend
npm start
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Start Frontend Development Server:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### Production Build

**Build Frontend:**
```bash
cd frontend
npm run build
```

This creates an optimized build in the `dist/` folder.

## 🔌 API Endpoints

### Base URL: `http://localhost:5000/api`

### Doctor Routes
- `GET /doctors` - Get all doctors
- `GET /doctors/:id` - Get doctor by ID
- `POST /doctors` - Create new doctor
- `PUT /doctors/:id` - Update doctor
- `DELETE /doctors/:id` - Delete doctor

### Equipment Routes
- `GET /equipment` - Get all equipment
- `GET /equipment/:id` - Get equipment by ID
- `POST /equipment` - Create new equipment
- `PUT /equipment/:id` - Update equipment
- `DELETE /equipment/:id` - Delete equipment

### Rush Routes
- `GET /rush` - Get all rush requests
- `GET /rush/:id` - Get rush request by ID
- `POST /rush` - Create new rush request
- `PUT /rush/:id` - Update rush request
- `DELETE /rush/:id` - Delete rush request

### Stock Routes
- `GET /stock` - Get all stock items
- `GET /stock/:id` - Get stock item by ID
- `POST /stock` - Create new stock item
- `PUT /stock/:id` - Update stock item
- `DELETE /stock/:id` - Delete stock item

## ✨ Project Features

### Current Features
- ✅ Responsive UI with React components
- ✅ RESTful API architecture
- ✅ MongoDB data persistence
- ✅ Monorepo structure for scalability
- ✅ CORS enabled for secure cross-origin requests
- ✅ Environment variable management

### Planned Features
- 🔄 User authentication & authorization
- 🔄 Real-time notifications
- 🔄 Advanced filtering and search
- 🔄 Data export functionality
- 🔄 Dashboard analytics
- 🔄 User roles & permissions

## 📝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or check your MongoDB Atlas connection string
- Verify `MONGODB_URI` in `.env` is correct

### Port Already in Use
- Change `PORT` in `.env` for backend (default: 5000)
- Frontend uses port 5173 by default (can be changed in vite.config.js)

### CORS Errors
- Update `CORS_ORIGIN` in backend `.env` to match your frontend URL
- Ensure cors middleware is properly configured in server.js

---

**Last Updated:** December 6, 2025  
**Version:** 1.0.0

For more information or support, please contact the development team.
