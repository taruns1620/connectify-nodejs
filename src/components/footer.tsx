import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Instagram, Send, Infinity } from 'lucide-react';

// Inline SVG for X (Twitter) logo
const XLogo = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor" // Use currentColor to inherit text color
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

// Inline SVG for WhatsApp logo
const WhatsAppLogo = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path d="M16.75 13.96c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.18-.54.06-.25-.12-1.06-.39-2.03-1.25-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.52-.56-.53-.14-.01-.31-.01-.47-.01-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.76 2.67 4.27 3.75 1.68.73 2.08.65 2.78.61.7-.04 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18s-.22-.17-.47-.29zM12 2a10 10 0 00-10 10 10 10 0 005.03 8.63l-1.41 5.11 5.26-1.38A10 10 0 0012 22a10 10 0 0010-10 10 10 0 00-10-10z"></path>
    </svg>
);


export function Footer() {
    const currentYear = new Date().getFullYear();
    const supportPhone = "9591073419"; // Phone number from contact page

  return (
    <footer className="bg-background border-t py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
           {/* Column 1: Logo & About */}
          <div className="flex flex-col items-start gap-3">
            <Link href="/" className="flex items-center gap-2 mb-2">
               <Infinity className="h-8 w-8 text-primary" />
               <span className="font-bold text-xl font-orbitron">Connectify Hub</span>
            </Link>
             {/* Social Media Links */}
             <div className="flex gap-4 mt-4"> {/* Increased gap */}
                 <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                     <Facebook size={20}/>
                 </Link>
                 <Link href="#" aria-label="X (Twitter)" className="text-muted-foreground hover:text-primary transition-colors">
                     <XLogo size={18}/> {/* Use the custom XLogo component */}
                 </Link>
                 <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                     <Instagram size={20}/>
                 </Link>
                 <Link href={`https://wa.me/91${supportPhone}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary transition-colors">
                     <WhatsAppLogo size={20}/>
                 </Link>
             </div>
          </div>

           {/* Column 2: Quick Links */}
           <div>
             <h4 className="font-semibold mb-4">Quick Links</h4>
             <ul className="space-y-2 text-sm">
                 <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
                 <li><Link href="/providers" className="text-muted-foreground hover:text-primary transition-colors">Find a Vendor</Link></li>
                 <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                 <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
             </ul>
           </div>

           {/* Column 3: Legal & Support */}
            <div>
             <h4 className="font-semibold mb-4">Support & Legal</h4>
             <ul className="space-y-2 text-sm">
                 <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                 <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                 <li><Link href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">Shipping Policy</Link></li>
                 <li><Link href="/refund" className="text-muted-foreground hover:text-primary transition-colors">Refund & Cancellation</Link></li>
                 <li><Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
             </ul>
           </div>

            {/* Column 4: Newsletter (Optional) */}
           <div>
             <h4 className="font-semibold mb-4">Stay Connected</h4>
             <p className="text-sm text-muted-foreground mb-3">Get updates and offers.</p>
             <div className="flex flex-col sm:flex-row gap-2">
                 <Input type="email" placeholder="Enter your email" className="flex-1 h-10 text-sm" />
                 <Button type="submit" size="icon" className="h-10 w-10 bg-primary hover:bg-primary/90 self-start sm:self-auto">
                     <Send size={18} />
                 </Button>
             </div>
           </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-6 text-center text-sm text-muted-foreground">
           &copy; {currentYear} Connectify Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
