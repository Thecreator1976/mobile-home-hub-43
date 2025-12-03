import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  Calculator,
  PiggyBank,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Seller Leads", href: "/seller-leads", icon: Users, badge: "12" },
  { title: "Buyers", href: "/buyers", icon: UserCheck },
  { title: "Calendar", href: "/calendar", icon: Calendar },
  { title: "Appointments", href: "/appointments", icon: ClipboardList },
];

const financeNavItems: NavItem[] = [
  { title: "Expenses", href: "/expenses", icon: DollarSign },
  { title: "Purchase Orders", href: "/purchase-orders", icon: FileText },
  { title: "Personal Advances", href: "/personal-advances", icon: PiggyBank },
];

const toolsNavItems: NavItem[] = [
  { title: "Value Estimator", href: "/value-estimator", icon: Calculator },
  { title: "Contracts", href: "/contracts", icon: FileText },
  { title: "Profit & Loss", href: "/profit-loss", icon: BarChart3 },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="space-y-1">
      {!collapsed && (
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
          {title}
        </h3>
      )}
      {items.map((item) => {
        const isActive = location.pathname.startsWith(item.href);
        return (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />
            {!collapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary">
          <Home className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground">MobileHome</span>
            <span className="text-xs text-sidebar-foreground/60">CRM</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-6 p-3 overflow-y-auto h-[calc(100vh-8rem)]">
        <NavSection title="Main" items={mainNavItems} />
        <NavSection title="Finance" items={financeNavItems} />
        <NavSection title="Tools" items={toolsNavItems} />
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
