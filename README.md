# 🛒 eSeller Platform Backend

> A scalable and secure backend for a multi-vendor e-commerce platform.  
> Built with **Node.js**, this project is maintained by **Varun Trikha** and **Prashant** in collaboration.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![MYSQL](https://img.shields.io/badge/Database-MySQL-blue.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/Status-Under_Development-yellow.svg)

---

## 🚀 Project Overview

The **eSeller Platform Backend** is designed to support:
- Multiple vendors and product management
- Inventory, orders, and user management
- Scalable REST APIs
- Secure authentication and role-based access
- Admin dashboards and analytics endpoints

> 🧑‍💻 Developed by [Varun Trikha](https://github.com/tj-web/tj-service) & [Prashant](https://github.com/prashant)  
> 📅 Started: July 2025

---

## 🧱 Tech Stack

- **Backend**: Node.js (Express.js)
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT, bcrypt
- **Storage**: Cloudinary (for product images)
- **Logging**: Winston / Morgan
- **Environment**: dotenv
- **Testing**: Jest / Postman Collections
- **Deployment**: Docker + CI/CD (planned)

---

## 📁 Folder Structure



e-seller-backend/
│
├── src/
│   ├── models/         # Sequelize models (Data layer)
│   ├── controllers/    # Business logic / route handlers
│   ├── routes/         # Express route declarations
│   ├── middlewares/    # Auth, validation, error handling
│   ├── utils/          # Helpers, formatters
│   ├── config/         # DB connection, env configs, constants
│   └── app.js          # Main Express app configuration
│
├── tests/              # Unit and integration tests
├── .env                # Environment variables
├── .gitignore
├── Dockerfile          # (optional for deployment)
├── package.json
└── README.md





> ✅ The MVP pattern improves testability, readability, and long-term scalability.

---

## ⚙️ Getting Started

### 🔧 Prerequisites

-Project Requirements

-Node.js version 18.x or higher

-MySQL database with Sequelize ORM (supporting raw queries)

-AWS S3 account for media (image/video) uploads

-Postman (or similar API client) for API testing and debugging

-npm or yarn for package management

-Express.js framework for building RESTful APIs

-Environment variables managed via .env

-Docker  for containerized development and deployment

-Git for version control and collaboration

-ESLint / Prettier for code quality and consistency

-Logging (e.g., winston or morgan) for debugging and monitoring

-CORS handling for secure cross-origin requests

-Error handling middleware for centralized API error management

### 📦 Installation

```bash
# Clone the repo
git clone https://github.com/your-org/e-seller-backend.git
cd e-seller-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start in development
npm run dev
## Contributions Till Now

## 📌 Contributions Till Now

| 👤 Contributor | 🚀 Contributions |
|----------------|---------------------------------------------------------------|
| **Varun Trikha** | 📊 Dashboard API, 📋 ManageLeads, ✅ Profile Completion, 🔢 LeadsCount |
- **Prashant**
  - ✅ Manage Orders API – *Completed*
  - ✨ Manage Brands API – *Brand listing and filters completed*
  - 🛠️ Manage Brands – *Add, Edit, and View functionality completed*
  - 📄 Agreement Page – *Completed*







