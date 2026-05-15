# 🏢 HRMS - Human Resource Management System

A full-stack enterprise HR Management System built with **Django REST Framework** (Backend) and **Next.js** (Frontend).

## 👥 Team Members
- **Adarsh**
- **Rounak**

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Python, Django 6.0, Django REST Framework |
| Frontend    | Next.js (App Router), React, TypeScript |
| Database    | SQLite (Development)                |
| Auth        | JWT (Simple JWT)                    |
| Styling     | Tailwind CSS                        |
| Charts      | Recharts                            |

## 📁 Project Structure

```
HRMS/
├── backend/                 # Django Backend
│   ├── core/               # Project settings & URLs
│   ├── accounts/           # Role & UserRole management
│   ├── employees/          # Employee, Department, Branch, Location
│   ├── attendance/         # Attendance tracking
│   ├── leaves/             # Leave management & approval
│   ├── payroll/            # Salary & payroll processing
│   ├── performance/        # Performance reviews
│   ├── projects/           # Project & assignment tracking
│   ├── training/           # Training & enrollment
│   └── recruitment/        # Recruitment (in progress)
├── frontend/               # Next.js Frontend
│   ├── src/app/            # App Router pages
│   ├── src/services/       # API service layer
│   ├── src/components/     # Reusable UI components
│   └── src/context/        # Auth context
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## 📦 API Endpoints

| Module       | Endpoint                      |
|-------------|-------------------------------|
| Auth        | `/api/token/`, `/api/token/refresh/` |
| Employees   | `/api/employees/`             |
| Recruitment | `/api/recruitment/`           |
| Attendance  | `/api/attendance/`            |
| Leaves      | `/api/leaves/`                |
| Payroll     | `/api/payroll/`               |
| Performance | `/api/performance/`           |
| Projects    | `/api/projects/`              |
| Training    | `/api/training/`              |

## 📄 License
This project is for educational purposes.
