import { Bell, Search, Plus, LogOut, Menu, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TopBarProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export function TopBar({ sidebarCollapsed = false, onMenuClick }: TopBarProps) {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleNavigateToSettings = () => {
    if (userRole === "admin") {
      navigate("/admin/settings");
    } else {
      navigate("/dashboard"); // Or a general settings page if you have one
    }
  };

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "U";

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300",
        sidebarCollapsed ? "lg:left-16" : "lg:left-64",
        "left-0",
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Mobile Menu + Date */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Date and Welcome */}
          <div className="hidden sm:block">
            <h1 className="text-sm lg:text-base font-semibold text-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground">Welcome back, {displayName}</p>
          </div>
        </div>

        {/* Center: Search - Hidden on mobile */}
        <div className="hidden md:block relative w-72 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads, buyers..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Quick Add */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="gradient" size="sm" className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Quick Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/seller-leads/new")}>New Seller Lead</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/buyers/new")}>
                {/* FIXED: Changed from /buyers to /buyers/new */}
                New Buyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/calendar")}>New Appointment</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/expenses")}>New Expense</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Quick Add */}
          <Button variant="gradient" size="icon" className="sm:hidden" onClick={() => navigate("/seller-leads/new")}>
            <Plus className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-secondary rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="py-4 text-center text-sm text-muted-foreground">No new notifications</div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">Role: {userRole || "viewer"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNavigateToSettings}>
                {/* FIXED: Added proper navigation handler */}
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
