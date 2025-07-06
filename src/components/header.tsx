'use client'; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Infinity, LogOut, User as UserIcon, Loader2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/use-auth'; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getAvatarFallback = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getDashboardLink = () => {
      if (!user) return '/';
      switch (user.role) {
          case 'admin': return '/admin/dashboard';
          case 'vendor': return '/vendor/dashboard';
          case 'client': return '/client/dashboard';
          default: return '/';
      }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center">
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-3/4 sm:max-w-xs">
                  <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle asChild>
                      <Link href="/" className="flex items-center space-x-2">
                        <Infinity className="h-6 w-6 text-primary" />
                        <span className="font-bold">Connectify Hub</span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-3 px-6 py-4">
                       <Link href="/" className="block py-2 transition-colors hover:text-foreground/80 text-foreground/60">Home</Link>
                       <Link href="/providers" className="block py-2 transition-colors hover:text-foreground/80 text-foreground/60">Find a Vendor</Link>
                       <Link href="/about" className="block py-2 transition-colors hover:text-foreground/80 text-foreground/60">About Us</Link>
                       <Link href="/contact" className="block py-2 transition-colors hover:text-foreground/80 text-foreground/60">Contact Us</Link>
                  </div>
                </SheetContent>
              </Sheet>
          </div>
          {/* Desktop Logo & Nav */}
          <div className="hidden md:flex items-center gap-6">
             <Link href="/" className="flex items-center space-x-2">
              <Infinity className="h-6 w-6 text-primary" />
              <span className="font-bold">Connectify Hub</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">Home</Link>
              <Link href="/providers" className="transition-colors hover:text-foreground/80 text-foreground/60">Find a Vendor</Link>
              <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">About Us</Link>
              <Link href="/contact" className="transition-colors hover:text-foreground/80 text-foreground/60">Contact Us</Link>
            </nav>
          </div>
        </div>
        
        {/* Center Section: Mobile Logo */}
        <div className="md:hidden">
            <Link href="/" className="flex items-center space-x-2">
                <Infinity className="h-6 w-6 text-primary" />
                <span className="font-bold">Connectify Hub</span>
            </Link>
        </div>
        
         {/* Right Section: Auth buttons */}
         <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex items-center justify-center h-8 w-20">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !user ? (
              <>
                <Button variant="outline" asChild size="sm">
                    <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            ) : ( 
              <>
                {/* Dashboard button for Vendor/Admin */}
                {user && (user.role === 'vendor' || user.role === 'admin') && (
                    <Button asChild size="sm" className="hidden sm:inline-flex">
                         <Link href={getDashboardLink()}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                )}
                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any).photoUrl || ''} alt={user.name || user.email || 'User'} />
                        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email || 'No email provided'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {/* Show Dashboard link in dropdown for ALL roles */}
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardLink()} className="flex items-center cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
      </div>
    </header>
  );
}
