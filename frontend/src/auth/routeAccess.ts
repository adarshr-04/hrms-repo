import type { UserRole } from "@/types";

type RouteRule = {
  prefix: string;
  roles: UserRole[];
};

const routeRules: RouteRule[] = [
  { prefix: "/", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN"] },
  { prefix: "/login", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN"] },

  { prefix: "/employees", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN"] },
  { prefix: "/employees/add", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/employees/edit", roles: ["ADMIN", "SUPER_ADMIN"] },

  { prefix: "/attendance", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN"] },
  { prefix: "/leaves", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN"] },
  { prefix: "/performance", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN"] },
  { prefix: "/projects", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN"] },
  { prefix: "/training", roles: ["ADMIN", "DEPT_MANAGER", "EMPLOYEE", "SUPER_ADMIN"] },

  { prefix: "/payroll", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/recruitment", roles: ["ADMIN", "SUPER_ADMIN"] },
];

export function isRouteAllowed(pathname: string, role: UserRole): boolean {
  // Prefer the most specific matching prefix.
  const matching = routeRules
    .filter((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`) || pathname.startsWith(r.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (!matching) return true;
  return matching.roles.includes(role);
}

