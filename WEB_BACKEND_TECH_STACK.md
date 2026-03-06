# MedSync Web & Backend Technology Stack

## Project Overview

This repository contains the backend API and the hospital admin web dashboard for the MedSync system. MedSync is a comprehensive healthcare management platform designed to streamline hospital operations, emergency response, and patient-doctor communication.

## Architecture Overview

The system follows a modern client-server architecture:

```
Web Dashboard (React) → REST API → Node.js / Express backend → MongoDB database → Firebase Cloud Messaging
```

The React-based web dashboard communicates with the backend through RESTful API endpoints. The Express.js server processes requests, interacts with the MongoDB database, and triggers push notifications via Firebase Cloud Messaging when needed.

## Backend Stack

### Node.js

Server-side JavaScript runtime environment that powers the backend application.

### Express.js

Minimalist web framework for Node.js used to build the REST API endpoints and handle HTTP requests.

### REST API Architecture

The backend implements a RESTful API architecture that handles:

- **User Authentication** - Secure login and registration for patients, doctors, and hospital admins
- **Doctor Schedules** - Managing doctor availability and appointment scheduling
- **Hospital Management** - CRUD operations for hospitals, clinics, and equipment
- **SOS Handling** - Emergency request processing and ambulance dispatch
- **Hospital Assignment** - Intelligent assignment of patients to appropriate hospitals
- **Messaging System** - Real-time communication between patients and doctors
- **Push Notifications** - Alert delivery to mobile devices

## Database

### MongoDB

NoSQL document database used for flexible and scalable data storage.

### Mongoose ODM

Object Data Modeling library for MongoDB and Node.js, providing schema validation and data modeling.

MongoDB stores the following data:

- **Users** - Patient accounts and profiles
- **Doctors** - Doctor profiles and credentials
- **Hospitals** - Hospital information and configurations
- **Clinics** - Clinic details and associations
- **Schedules** - Doctor availability and appointment slots
- **SOS Requests** - Emergency request records
- **Conversations** - Chat threads between users
- **Messages** - Individual messages within conversations
- **Ambulance Drivers** - Driver profiles and FCM tokens

## Push Notifications

### Firebase Cloud Messaging (FCM)

Google's cross-platform messaging solution used for delivering push notifications.

FCM is used for:

- **SOS Alerts to Ambulance Drivers** - Immediate notification when emergency requests are created
- **Hospital Alerts to Doctors** - Notifications about patient arrivals and emergencies
- **Patient-Doctor Messages** - Real-time message delivery notifications

## Maps and Location Services

### Google Maps API

Integrated for location-based services throughout the application.

Used for:

- **Distance Calculations** - Computing distances between patients and hospitals
- **Hospital Selection** - Finding the nearest appropriate hospital based on location
- **Ambulance Navigation** - Providing route guidance for ambulance drivers

## Web Application Stack

### React.js

JavaScript library for building the user interface with component-based architecture.

### HTML

Markup language for structuring web content.

### CSS

Stylesheet language for designing and styling the web interface.

### JavaScript

Programming language for client-side interactivity and logic.

The web application is used by hospital administrators to manage:

- **Doctors** - Add, edit, and manage doctor profiles and assignments
- **Equipment** - Track and manage hospital equipment inventory
- **Alerts** - Monitor and respond to system alerts and notifications
- **Schedules** - Configure doctor schedules and availability
- **Hospital Rush Level** - Monitor and update hospital capacity status

## Hosting and Deployment

### Render Cloud Platform

The application is deployed on Render, a cloud platform that provides:

- Automatic deployments from Git
- Managed infrastructure
- SSL certificates
- Environment variable management

## Development Tools

### Visual Studio Code

Primary code editor used for development with extensions for JavaScript, React, and Node.js.

### Git / GitHub

Version control system and repository hosting for collaborative development and code management.

### Hoppscotch / Postman

API testing tools used for:

- Testing REST API endpoints
- Debugging request/response cycles
- Documenting API behavior

## Technology Stack Summary

The web and backend components of MedSync are primarily built using the **MERN stack**:

| Component | Technology |
|-----------|------------|
| **M** | MongoDB - NoSQL database |
| **E** | Express.js - Web framework |
| **R** | React.js - Frontend library |
| **N** | Node.js - Runtime environment |

This modern JavaScript-based stack enables full-stack development with a unified language across the frontend and backend, facilitating rapid development and maintainability.
