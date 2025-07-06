'use client'; // Make RootLayout a client component to use usePathname

import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header'; // Main app header
import { Footer } from '@/components/footer'; // Main app footer
import { AuthProvider } from '@/hooks/use-auth';
import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation'; // Import usePathname
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const orbitron = Orbitron({
    subsets: ['latin'],
    variable: '--font-orbitron',
    weight: ['400', '700', '900'],
    display: 'swap',
});

// Metadata can still be exported from a client component in Next.js 13+ App Router
// export const metadata: Metadata = {
//   title: 'Connectify Hub',
//   description: 'Connecting clients with service and product providers.',
// };
// For client components, if you need dynamic metadata, you'd use the `generateMetadata` pattern
// or set it directly if static. For now, let's keep it simple or assume it's handled elsewhere if dynamic.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
     <html lang="en" className="dark" suppressHydrationWarning>
       <head>
        {/* Metadata can be placed directly in head if static or handled by generateMetadata */}
        <title>Connectify Hub</title>
        <meta name="description" content="Connecting clients with service and product providers." />
       </head>
       <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          orbitron.variable
        )}
      >
         <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
            {!isAdminRoute && <Header />} {/* Conditionally render main Header */}
            <main className="flex-1">{children}</main>
            {!isAdminRoute && <Footer />} {/* Conditionally render main Footer */}
            </div>
            <HotToaster position="top-center" />
         </AuthProvider>
         <SpeedInsights />
      </body>
    </html>
  );
}
