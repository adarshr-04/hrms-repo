import type { UserRole } from "@/types";

type RouteRule = {
  prefix: string;
  roles: UserRole[];
};

const routeRules: RouteRule[] = [
  { prefix: "/", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },
  { prefix: "/login", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },

  { prefix: "/employees", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },
  { prefix: "/employees/add", roles: ["ADMIN", "SUPER_ADMIN", "HR"] },
  { prefix: "/employees/edit", roles: ["ADMIN", "SUPER_ADMIN", "HR"] },

  { prefix: "/attendance", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },
  { prefix: "/leaves", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },
  { prefix: "/performance", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },
  { prefix: "/projects", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },
  { prefix: "/training", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },

  { prefix: "/payroll", roles: ["ADMIN", "SUPER_ADMIN", "HR"] },
  { prefix: "/recruitment", roles: ["ADMIN", "SUPER_ADMIN", "HR", "DEPT_MANAGER", "EMPLOYEE"] },
  { prefix: "/settings", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },
  { prefix: "/notifications", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN", "HR"] },
  { prefix: "/reports", roles: ["ADMIN", "SUPER_ADMIN", "HR"] },
];

export function isRouteAllowed(pathname: string, role: UserRole): boolean {
  // Prefer the most specific matching prefix.
  const matching = routeRules
    .filter((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`) || pathname.startsWith(r.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (!matching) return true;
  return matching.roles.includes(role);
}

