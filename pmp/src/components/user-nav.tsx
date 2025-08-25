
"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LifeBuoy, LogOut, Settings, User } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { MainNav } from "./main-nav";
import { Icons } from "./icons";

/**
 * The user navigation component, which includes the user's avatar,
 * a dropdown menu with account options, theme toggle, and notifications.
 * It also contains a sheet-based navigation for mobile viewports.
 * @returns {JSX.Element | null} The user navigation component, or null if no user is authenticated.
 */
export function UserNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  const fallback = user.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex items-center gap-2">
        <Popover>
            <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Toggle notifications</span>
            </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
            <div className="grid gap-4">
                <div className="space-y-2">
                <h4 className="font-medium leading-none">Notifications</h4>
                <p className="text-sm text-muted-foreground">
                    You have 3 new messages.
                </p>
                </div>
                <div className="grid gap-2">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://placehold.co/32x32.png" alt="Avatar" data-ai-hint="female portrait" />
                            <AvatarFallback>S</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <p className="text-sm font-medium">New task assigned</p>
                            <p className="text-sm text-muted-foreground">"Design new dashboard" is due tomorrow.</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://placehold.co/32x32.png" alt="Avatar" data-ai-hint="male portrait" />
                            <AvatarFallback>M</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <p className="text-sm font-medium">Project deadline approaching</p>
                            <p className="text-sm text-muted-foreground">"Q2 Marketing Campaign" is due in 3 days.</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://placehold.co/32x32.png" alt="Avatar" data-ai-hint="female face" />
                            <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <p className="text-sm font-medium">Comment on task</p>
                            <p className="text-sm text-muted-foreground">Alice commented on "Fix login bug".</p>
                        </div>
                    </div>
                </div>
            </div>
            </PopoverContent>
        </Popover>
        <ThemeToggle />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/36x36.png" alt={user.name} data-ai-hint="person coding"/>
                <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                <Link href="/users">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
                </DropdownMenuItem>
                {user.role === 'Administrator' ? (
                <DropdownMenuItem asChild>
                    <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Platform Settings</span>
                    </Link>
                </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem asChild>
                        <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Profile & Settings</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
       </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-3/4">
            <SheetHeader>
                <SheetTitle>
                    <Link href="/dashboard" className="flex items-center gap-2 text-foreground">
                        <Icons.logo className="h-6 w-6" />
                        <h1 className="text-xl font-semibold">EasyPM</h1>
                    </Link>
                </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
                <MainNav />
            </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
