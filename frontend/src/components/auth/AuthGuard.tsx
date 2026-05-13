"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import MainLayout from "../layout/MainLayout";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";
import { isRouteAllowed } from "@/auth/routeAccess";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, loading, pathname, router]);

  useEffect(() => {
    if (loading || !isAuthenticated || pathname === "/login") return;
    const role = user?.role ?? "EMPLOYEE";
    if (!isRouteAllowed(pathname, role)) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, pathname, router, user?.role]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If we are on the login page, just show the login page without the layout
  if (pathname === '/login') {
    return (
      <>
        {children}
        <Toaster position="top-right" expand={false} richColors />
      </>
    );
  }

  // If we are authenticated, show the children wrapped in MainLayout
  if (isAuthenticated) {
    return (
      <>
        <MainLayout>{children}</MainLayout>
        <Toaster position="top-right" expand={false} richColors />
      </>
    );
  }

  // Default return for redirect state
  return null;
}
