"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Briefcase, 
  GraduationCap,
  UserPlus,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
  { name: 'Leaves', href: '/leaves', icon: FileText },
  { name: 'Payroll', href: '/payroll', icon: CreditCard },
  { name: 'Performance', href: '/performance', icon: BarChart3 },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Training', href: '/training', icon: GraduationCap },
  { name: 'Recruitment', href: '/recruitment', icon: UserPlus },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">H</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">HRMS Enterprise</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
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
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-all mt-1"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
