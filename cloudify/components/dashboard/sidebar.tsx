"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Cloud,
  Home,
  Folder,
  GitBranch,
  Globe,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  Search,
  LogOut,
  User,
  CreditCard,
  Users,
  Moon,
  Sun,
  Terminal,
  Puzzle,
  Flag,
  Key,
  Activity,
  Zap,
  HardDrive,
  Database,
  Command,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Deployments", href: "/deployments", icon: GitBranch },
  { name: "Functions", href: "/functions", icon: Zap },
  { name: "Storage", href: "/storage", icon: HardDrive },
  { name: "Edge Config", href: "/edge-config", icon: Database },
  { name: "Domains", href: "/domains", icon: Globe },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Logs", href: "/logs", icon: Terminal },
  { name: "Feature Flags", href: "/feature-flags", icon: Flag },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Team", href: "/team", icon: Users },
  { name: "Integrations", href: "/integrations", icon: Puzzle },
  { name: "API Tokens", href: "/tokens", icon: Key },
  { name: "Usage", href: "/usage", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image;
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen w-[220px] flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <Cloud className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Cloudify
          </span>
        </Link>
      </div>

      {/* Team Selector */}
      <div className="border-b border-border px-3 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-8 px-2"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-secondary text-foreground">
                    {userInitials.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{userName}&apos;s Projects</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Switch Team</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Avatar className="h-5 w-5 mr-2">
                <AvatarFallback className="text-[10px]">
                  {userInitials.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              Personal Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search trigger */}
      <div className="px-3 py-2.5">
        <button
          className="flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-secondary"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              })
            );
          }}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-border px-1 py-0.5 text-[10px] text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav role="navigation" aria-label="Main navigation" className="flex-1 space-y-0.5 px-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-foreground" />
              )}
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Quick actions */}
      <div className="px-3 py-2.5 border-t border-border">
        <Button variant="default" className="w-full h-8 text-sm" asChild>
          <Link href="/new">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* User menu */}
      <div className="border-t border-border px-3 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2.5 h-auto p-2">
              <Avatar className="h-7 w-7">
                {userImage && <AvatarImage src={userImage} />}
                <AvatarFallback className="text-xs bg-secondary text-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">{userName}</div>
                <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/usage">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/team">
                <Users className="h-4 w-4 mr-2" />
                Team Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[#ee0000]"
              onSelect={(e) => {
                e.preventDefault();
                signOut({ callbackUrl: "/login" });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
