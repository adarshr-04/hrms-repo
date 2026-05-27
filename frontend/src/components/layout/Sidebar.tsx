
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  CreditCard,
  BarChart3,
  Briefcase,
  GraduationCap,
  Settings,
  LogOut,
  UserPlus,
  TrendingUp,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
  { name: 'Employees', href: '/employees', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
  { name: 'Attendance', href: '/attendance', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
  { name: 'Leaves', href: '/leaves', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
  { name: 'Payroll', href: '/payroll', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'HR'] },
  { name: 'Performance', href: '/performance', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
  { name: 'Projects', href: '/projects', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
  { name: 'Training', href: '/training', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
  { name: 'Recruitment', href: '/recruitment', icon: UserPlus, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
  { name: 'Reports', href: '/reports', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'HR'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'DEPT_MANAGER', 'EMPLOYEE'] },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const userRole = user?.role || 'EMPLOYEE';

  // Read company name from localStorage so it updates when admin saves Company Config
  const [companyName, setCompanyName] = useState('HRMS Enterprise');

  useEffect(() => {
    const readCompanyName = () => {
      try {
        const saved = localStorage.getItem('companySettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.name) setCompanyName(parsed.name);
        }
      } catch {
        setCompanyName('HRMS Enterprise');
      }
    };
    readCompanyName();
    // Listen for storage events so changes in other tabs / same-tab saves are picked up
    window.addEventListener('storage', readCompanyName);
    return () => window.removeEventListener('storage', readCompanyName);
  }, []);

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex flex-col h-full w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">{companyName.charAt(0).toUpperCase()}</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tight truncate">{companyName}</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
          const label = item.name === 'Recruitment' && (userRole === 'EMPLOYEE' || userRole === 'DEPT_MANAGER') ? 'Interviews' : item.name;
          return (
            <Link key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-indigo-600/10 text-indigo-400 font-medium"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-indigo-500" : "text-slate-400 group-hover:text-indigo-400"
              )} />
              <span>{label}</span>

              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="px-3 py-2 mb-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logged in as</p>
          <p className="text-xs font-bold text-indigo-400 truncate">{user?.first_name} ({userRole})</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
