import {
  UserSquare2,
  Users,
  CalendarDays,
  Clock,
  Briefcase,
  Wallet,
} from "lucide-react";
import type { HubConfig } from "../types";

export const hrHub: HubConfig = {
  id: "hr",
  label: "Human Resources",
  description: "Manage staff, shifts, attendance, and payroll.",
  icon: UserSquare2,
  basePath: "/hr",
  wrapAntd: true,
  tabs: [
    {
      id: "employees",
      label: "Employee Directory",
      path: "/hr/employees",
      icon: Users,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      order: { SUPER_ADMIN: 1, MANAGER: 1, STAFF: 3 },
    },
    {
      id: "shifts",
      label: "Shift Management",
      path: "/hr/shifts",
      icon: CalendarDays,
      roles: ["SUPER_ADMIN", "MANAGER"],
      order: { SUPER_ADMIN: 2, MANAGER: 2 },
    },
    {
      id: "attendance",
      label: "Attendance",
      path: "/hr/attendance",
      icon: Clock,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      order: { SUPER_ADMIN: 3, MANAGER: 3, STAFF: 1 },
    },
    {
      id: "leave",
      label: "Leave Requests",
      path: "/hr/leave",
      icon: Briefcase,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      order: { SUPER_ADMIN: 4, MANAGER: 4, STAFF: 2 },
    },
    {
      id: "payroll",
      label: "Payroll",
      path: "/hr/payroll",
      icon: Wallet,
      roles: ["SUPER_ADMIN", "MANAGER"],
      order: { SUPER_ADMIN: 5, MANAGER: 5 },
    },
  ],
};
