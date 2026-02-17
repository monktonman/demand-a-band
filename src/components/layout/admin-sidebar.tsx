"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Music2,
  Users,
  MessageSquarePlus,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/events", label: "Events", icon: Calendar, adminOnly: false },
  { href: "/admin/venues", label: "Venues", operatorLabel: "My Venues", icon: MapPin, adminOnly: false },
  { href: "/admin/bands", label: "Bands", icon: Music2, adminOnly: true },
  { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquarePlus, adminOnly: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-zinc-50">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">
          {isAdmin ? "Admin Panel" : "Operator Panel"}
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-100 text-orange-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {!isAdmin && "operatorLabel" in item && item.operatorLabel ? item.operatorLabel : item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="border-t p-4">
        <Link
          href="/events"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}
