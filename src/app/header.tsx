
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Infinity } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Infinity className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Connectify Hub
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/providers"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Browse Vendors
            </Link>
            <Link
              href="/client/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Client Dashboard
            </Link>
             <Link
              href="/vendor/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Vendor Dashboard
            </Link>
             <Link
              href="/admin/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Admin
            </Link>
          </nav>
        </div>
        {/* Mobile Nav */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
             <Link href="/" className="flex items-center space-x-2 mb-4">
              <Infinity className="h-6 w-6 text-primary" />
              <span className="font-bold">Connectify Hub</span>
            </Link>
            <div className="flex flex-col space-y-3">
                 <Link
                  href="/providers"
                   className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Browse Vendors
                </Link>
                <Link
                  href="/client/dashboard"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                   Client Dashboard
                </Link>
                 <Link
                  href="/vendor/dashboard"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                   Vendor Dashboard
                </Link>
                 <Link
                  href="/admin/dashboard"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Admin
                </Link>
            </div>
          </SheetContent>
        </Sheet>
         <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
             {/* Future Search Input can go here */}
            </div>
             <div className="flex items-center gap-2">
              {/* TODO: Replace with actual authentication state */}
               <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
              {/* Example logged in state (replace with logic)
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              */}
            </div>
          </div>
      </div>
    </header>
  );
}
