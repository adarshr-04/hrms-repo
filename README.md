# HRMS - Human Resource Management System

A full-stack Human Resource Management System built with **Django REST Framework** on the backend and **Vite + React + TypeScript** on the frontend.

## Team Members

- Adarsh
- Rounak

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Python, Django, Django REST Framework |
| Frontend | Vite, React, TypeScript |
| Database | SQLite for development |
| Auth | JWT with Simple JWT |
| Styling | Tailwind CSS |
| Charts | Recharts |

## Project Structure

```text
HRMS/
├── backend/
│   ├── core/           # Django settings and root URLs
│   ├── accounts/       # Roles, profile, auth helpers, notifications
│   ├── employees/      # Employees, departments, documents
│   ├── attendance/     # Attendance tracking
│   ├── leaves/         # Leave management
│   ├── payroll/        # Payroll records
│   ├── performance/    # Performance reviews
│   ├── projects/       # Projects and task logs
│   ├── training/       # Training records
│   ├── recruitment/    # Recruitment workflows
│   └── reports/        # Reports endpoints
├── frontend/
│   ├── src/pages/      # React Router pages
│   ├── src/services/   # API service layer
│   ├── src/components/ # Reusable UI components
│   └── src/context/    # Auth context
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r ../requirements.txt
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

### Local URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Admin panel: http://localhost:8000/admin/

## Environment Variables

The backend uses safe local defaults, but production deployments should set:

```text
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## API Endpoints

| Module | Endpoint |
| --- | --- |
| Auth | `/api/token/`, `/api/token/refresh/` |
| Accounts | `/api/accounts/` |
| Employees | `/api/employees/` |
| Attendance | `/api/attendance/` |
| Leaves | `/api/leaves/` |
| Payroll | `/api/payroll/` |
| Performance | `/api/performance/` |
| Projects | `/api/projects/` |
| Training | `/api/training/` |
| Recruitment | `/api/recruitment/` |
| Reports | `/api/reports/` |

## Verification

```bash
cd backend
python manage.py check
python manage.py test

cd ../frontend
npm run build
```

## License

This project is for educational purposes.
