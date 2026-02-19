# MedSync Web Application - Hospital Admin Dashboard

<p align="center">
  <b>Comprehensive Hospital Management Platform</b>
</p>

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Frontend Features](#frontend-features)
- [Backend Features](#backend-features)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)

---

## 🏥 Overview

**MedSync Web App** is a hospital administration dashboard that enables healthcare facility administrators to manage doctors, monitor ambulances, track SOS emergencies, oversee equipment, and communicate with medical staff in real-time.

The dashboard provides:
- Real-time SOS emergency monitoring and tracking
- Ambulance fleet management
- Doctor management and attendance tracking
- Equipment and stock monitoring
- Hospital-wide alert system
- Patient inflow analytics

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📊 **Admin Dashboard** | Central hub with real-time stats on doctors, ambulances, SOS, and rush levels |
| 🚨 **SOS Emergency Tracking** | Monitor incoming emergencies with severity levels and driver assignments |
| 🚑 **Ambulance Management** | View ambulance fleet status, locations, and assignments |
| 👨‍⚕️ **Doctor Management** | Add, search, filter doctors by department and duty status |
| 🔔 **Alert System** | Critical alerts for equipment maintenance and low stock |
| 🛠️ **Equipment Tracking** | Monitor medical equipment status (operational, maintenance, out-of-service) |
| ⚙️ **Settings & Profile** | Manage admin profile and hospital information |
| 💬 **Doctor Messaging** | Send alerts and messages to hospital doctors |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MedSync Web Application                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  React Frontend (Vite)                    │   │
│  │  • Admin Dashboard    • SOS Emergencies    • Doctors     │   │
│  │  • Ambulances         • Equipment          • Alerts      │   │
│  │  • Settings           • Login/Signup                      │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │                                  │
│                               │ REST API                         │
│                               ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Node.js/Express Backend                     │   │
│  │  • Authentication     • SOS Management                    │   │
│  │  • Admin Dashboard    • Ambulance APIs                    │   │
│  │  • Doctor APIs        • Equipment/Stock                   │   │
│  │  • Alerts & Messaging • Hospital Config                   │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MongoDB Database                       │   │
│  │  • Users    • Doctors    • Hospitals    • SOS Requests   │   │
│  │  • Drivers  • Equipment  • Appointments • Messages       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
| Component | Technology |
|-----------|------------|
| **Framework** | React 18 with Vite |
| **Styling** | Tailwind CSS |
| **HTTP Client** | Axios |
| **Routing** | React Router |
| **Build Tool** | Vite |

### Backend
| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | Session-based with Firebase |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |

---

## 📱 Frontend Features

### Dashboard Page
- **Overview Cards**: Active ambulances, doctors on duty, SOS count, rush level
- **SOS Trend Chart**: Hourly SOS trends over 24 hours
- **Critical Alerts**: Equipment maintenance and low stock warnings
- **Patient Inflow**: Hourly patient arrival statistics
- **Real-time Polling**: Auto-refresh every 10-60 seconds

### SOS Emergencies Page
- **Emergency List**: View all incoming SOS requests
- **Severity Indicators**: Critical, severe, moderate, mild classifications
- **Status Tracking**: Pending, awaiting driver, assigned, arrived, completed
- **Map Integration**: Google Maps showing patient and ambulance locations
- **Route Visualization**: Polyline routes between driver and patient

### Ambulance Management Page
- **Driver List**: All ambulance drivers near hospital
- **Status Summary**: Total, active, inactive, on-assignment counts
- **Driver Details**: Name, phone, vehicle info, distance from hospital
- **Status Toggle**: Activate/deactivate drivers

### Doctors Page
- **Doctor Directory**: Searchable list of hospital doctors
- **Filters**: By department, duty status (on/off duty)
- **Search**: By name, MRN, or department
- **Add Doctor**: Form to register new doctors
- **Department Tabs**: Organize doctors by specialty

### Equipment Page
- **Equipment List**: All medical equipment in hospital
- **Status Tracking**: Operational, under maintenance, out of service
- **Search & Filter**: Find equipment by name or status
- **Visual Icons**: Equipment type indicators

### Alerts Page
- **Alert Types**: Critical, warning, info classifications
- **Summary Cards**: Count by alert type
- **Filter Options**: View by severity
- **Doctor Messaging**: Send alerts to individual or all doctors

### Settings Page
- **Profile Management**: Update admin personal info
- **Hospital Info**: View and edit hospital details
- **Password Change**: Secure password update
- **Section Navigation**: Profile, hospital, security tabs

---

## ⚙️ Backend Features

### Authentication & Authorization
- Patient, doctor, driver, and admin login/registration
- Role-based access control
- Session management

### Admin Dashboard Controller
- **Doctors Count**: Total and on-duty doctors per facility
- **Hospital Info**: Facility details retrieval
- **Critical Alerts**: Equipment and stock warnings
- **Patient Inflow**: Hourly statistics aggregation
- **Doctor Management**: Add, list, filter doctors

### SOS Management
- **SOS Summary**: Counts by status (pending, in-progress, assigned, completed)
- **Recent Requests**: Latest emergencies list
- **Severity Breakdown**: Stats by severity level
- **Trend Analysis**: Hourly trends over 24 hours
- **FCM Notifications**: Push alerts to drivers

### Ambulance Controller
- **Driver Proximity**: Find drivers near hospital district
- **Summary Stats**: Active, inactive, on-assignment counts
- **Status Management**: Toggle driver availability

### Alerts System
- **Equipment Alerts**: Maintenance and low stock warnings
- **Doctor Messaging**: Send messages via FCM
- **Alert Categorization**: Critical, warning, info levels

### Hospital-Doctor Messaging
- **Conversation Management**: Create and track conversations
- **Message History**: Retrieve conversation messages
- **Read Status**: Mark messages as read

---

## 🔗 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | POST | Admin/user login |
| `/registerpatient` | POST | Patient registration |
| `/registerdoctor` | POST | Doctor registration |
| `/registerdriver` | POST | Driver registration |

### Admin Dashboard
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/dashboard/doctors-count` | GET | Get doctors count |
| `/admin/dashboard/hospital-info` | GET | Get hospital info |
| `/admin/dashboard/doctors` | GET | List all doctors |
| `/admin/dashboard/doctors/departments` | GET | Get departments |
| `/admin/dashboard/critical-alerts` | GET | Get critical alerts |
| `/admin/dashboard/patient-inflow` | GET | Get patient inflow data |
| `/admin/dashboard/doctors/add` | POST | Add new doctor |

### SOS Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sos/summary` | GET | Get SOS counts summary |
| `/sos/recent` | GET | Get recent SOS requests |
| `/sos/severity` | GET | Get SOS by severity |
| `/sos/trend` | GET | Get hourly SOS trend |

### Ambulance Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/ambulance/drivers` | GET | Get drivers near hospital |
| `/admin/ambulance/summary` | GET | Get drivers summary |
| `/admin/ambulance/driver-status` | PUT | Update driver status |

### Alerts
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/alerts/all` | GET | Get all alerts |
| `/alerts/send-message` | POST | Send message to doctors |

### Settings
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/settings/profile` | GET | Get admin profile |
| `/settings/profile` | PUT | Update profile |
| `/settings/password` | PUT | Change password |
| `/settings/hospital-info` | GET | Get hospital info |
| `/settings/hospital-info` | PUT | Update hospital info |

---

## 📦 Data Models

| Model | Description |
|-------|-------------|
| **User** | Patient/admin user accounts |
| **Doctor** | Doctor profiles with hospital/clinic assignments |
| **Hospital** | Hospital facility information |
| **Clinic** | Clinic facility information |
| **HospitalAdmin** | Admin-to-hospital assignments |
| **AmbulanceDriver** | Driver profiles and status |
| **AmbulanceLiveLocation** | Real-time driver locations |
| **AmbulanceAssignment** | Driver-to-SOS assignments |
| **SosRequest** | Emergency SOS requests |
| **Appointment** | Patient appointments |
| **Equipment** | Medical equipment inventory |
| **Stock** | Medical supplies inventory |
| **DoctorAttendanceLog** | Doctor attendance records |
| **DoctorSchedule** | Doctor availability schedules |
| **Conversation** | Messaging conversations |
| **Message** | Individual messages |
| **Rush** | Hospital rush level tracking |

---

## 🎨 UI/UX Features

### Design System
- **Theme**: Dark mode with glass-morphism effects
- **Colors**: Blue/cyan accent palette on dark backgrounds
- **Components**: GlassSurface cards, responsive sidebar navigation
- **Animations**: Liquid Ether animated background

### Layout Components
- **SideNav**: Collapsible navigation sidebar
- **TopNavbar**: Header with breadcrumbs and actions
- **GlassSurface**: Frosted glass effect containers
- **ProtectedRoute**: Auth-guarded routes

### Responsive Design
- Mobile-friendly sidebar toggle
- Adaptive grid layouts
- Touch-friendly interactions

---

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
npm install
# Configure .env with MongoDB URI and Firebase credentials
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

<p align="center">
  <b>MedSync Web App</b> - Empowering Hospital Administration
</p>
