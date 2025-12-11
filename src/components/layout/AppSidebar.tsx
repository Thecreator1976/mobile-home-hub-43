import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
  Shield,
  UserCog,
  Menu,
  X,
  Zap,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Seller Leads", href: "/seller-leads", icon: Users },
  { title: "Buyers", href: "/buyers", icon: UserCheck },
  { title: "Calendar", href: "/calendar", icon: Calendar },
  { title: "Appointments", href: "/appointments", icon: ClipboardList },
  { title: "Messenger", href: "/messenger", icon: MessageSquare },
];

const financeNavItems: NavItem[] = [
  { title: "Expenses", href: "/expenses", icon: DollarSign },
  { title: "Purchase Orders", href: "/purchase-orders", icon: FileText },
  { title: "Personal Advances", href: "/personal-advances", icon: PiggyBank },
];

const toolsNavItems: NavItem[] = [
  { title: "Value Estimator", href: "/value-estimator", icon: Calculator },
  { title: "Contracts", href: "/contracts", icon: FileText },
];

const adminNavItems: NavItem[] = [
  { title: "User Management", href: "/admin/users", icon: UserCog, adminOnly: true },
  { title: "Profit & Loss", href: "/profit-loss", icon: BarChart3, adminOnly: true },
  { title: "Contract Templates", href: "/admin/contract-templates", icon: FileText, adminOnly: true },
  { title: "Integrations", href: "/admin/integrations", icon: Zap, adminOnly: true },
  { title: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
];

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function AppSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: AppSidebarProps) {
  const location = useLocation();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => {
    const filteredItems = items.filter(item => !item.adminOnly || isAdmin);
    if (filteredItems.length === 0) return null;

    return (
      <div className="space-y-1">
        {!collapsed && (
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
            {title}
          </h3>
        )}
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
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
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
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
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-sidebar-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-3">
        <nav className="flex flex-col gap-6">
          <NavSection title="Main" items={mainNavItems} />
          <NavSection title="Finance" items={financeNavItems} />
          <NavSection title="Tools" items={toolsNavItems} />
          {isAdmin && <NavSection title="Admin" items={adminNavItems} />}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle - Desktop only */}
      <div className="hidden lg:block p-3 border-t border-sidebar-border">
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
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
