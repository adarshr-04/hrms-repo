import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/auth/AuthGuard';

import HomePage from './pages/page';
import LoginPage from './pages/login/page';
import EmployeesPage from './pages/employees/page';
import EmployeeAddPage from './pages/employees/add/page';
import EmployeeDetailsPage from './pages/employees/details/page';
import EmployeeEditPage from './pages/employees/edit/page';
import AttendancePage from './pages/attendance/page';
import LeavesPage from './pages/leaves/page';
import PerformancePage from './pages/performance/page';
import ProjectsPage from './pages/projects/page';
import TrackerPage from './pages/tracker/page';
import TrainingPage from './pages/training/page';
import PayrollPage from './pages/payroll/page';
import RecruitmentPage from './pages/recruitment/page';
import SettingsPage from './pages/settings/page';
import NotificationsPage from './pages/notifications/page';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/add" element={<EmployeeAddPage />} />
            <Route path="/employees/details" element={<EmployeeDetailsPage />} />
            <Route path="/employees/edit" element={<EmployeeEditPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leaves" element={<LeavesPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tracker" element={<TrackerPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/recruitment" element={<RecruitmentPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </AuthGuard>
      </AuthProvider>
    </BrowserRouter>
  );
}
