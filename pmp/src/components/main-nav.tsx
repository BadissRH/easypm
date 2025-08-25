
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  BarChart,
  Users,
  ShieldCheck,
  Settings,
  ClipboardList,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";

const allLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Administrator", "Project Manager", "Collaborator"] },
  { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["Administrator", "Project Manager"] },
  { href: "/tasks", label: "Tasks", icon: Briefcase, roles: ["Administrator", "Project Manager", "Collaborator"] },
  { href: "/reporting", label: "Reporting", icon: BarChart, roles: ["Administrator", "Project Manager"] },
  { href: "/users", label: "Users", icon: Users, roles: ["Administrator"] },
  { href: "/security", label: "Security", icon: ShieldCheck, roles: ["Administrator"] },
  { href: "/admin/project-logs", label: "Project Logs", icon: ClipboardList, roles: ["Administrator"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["Administrator"] },
];

/**
 * The main navigation component for the application.
 * It renders a list of navigation links based on the authenticated user's role.
 * @param {object} props - The component props.
 * @param {string} [props.className] - Optional additional CSS classes.
 * @returns {JSX.Element} The main navigation bar.
 */
export function MainNav({ className }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const links = allLinks.filter(link => user && link.roles.includes(user.role));

  return (
    <nav className={cn("flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 lg:space-x-6", className)}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-3 text-lg md:text-sm font-medium transition-colors hover:text-primary w-full p-2 md:p-0 rounded-md md:rounded-none md:w-auto",
            pathname === link.href ? "text-primary bg-muted md:bg-transparent" : "text-muted-foreground"
          )}
        >
          <link.icon className="h-5 w-5 md:hidden" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
