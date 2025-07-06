
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

// Placeholder image URL - replace with the actual ghost image if possible
const pendingImageUrl = "/images/pending-ghost.png"; // Assuming the image is placed in public/images

export default function VendorPendingPage() {
  return (
    <div className="container py-12 flex flex-col justify-center items-center min-h-[calc(100vh-15rem)] text-center">
       <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm dark:bg-background/50">
         <CardHeader>
            {/* You can use an inline SVG or a placeholder if the image isn't available */}
            {/* Using a placeholder div for now */}
            <div className="mx-auto h-32 w-32 flex items-center justify-center rounded-full bg-muted mb-4">
               {/* Placeholder for the ghost image */}
               <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-50"><path d="M12 2a10 10 0 1 0 10 10c0-5.52-4.5-10-10-10Z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>
            </div>
             <CardTitle className="text-3xl font-serif tracking-wider">Oops!</CardTitle>
             <CardDescription className="text-muted-foreground">
                Your vendor registration is under review.
            </CardDescription>
         </CardHeader>
         <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
               We're reviewing your details and will notify you once your account is approved. This usually takes 24-48 hours.
            </p>
            <Button asChild variant="outline">
                <Link href="/">Go back to Home</Link>
            </Button>
         </CardContent>
      </Card>
    </div>
  );
}

// Note: The image provided looks like a custom illustration.
// For optimal display, it should be saved as an image file (e.g., PNG) and placed in the `public` folder.
// Update the `pendingImageUrl` constant accordingly. If the exact image isn't available,
// the SVG placeholder above or another suitable icon (like Hourglass from lucide-react) can be used.
