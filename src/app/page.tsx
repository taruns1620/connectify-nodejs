
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, Building2, Camera, Handshake, Home, Landmark, Paintbrush, Quote, Search, ShieldCheck, Star, Users } from 'lucide-react';
import HeroSectionClient from './hero-section-client'; // Import client-side Hero section specifics
// import AboutSectionClient from './about-section-client'; // Original import
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import AboutSectionClient
const DynamicAboutSectionClient = dynamic(
  () => import('./about-section-client'),
  {
    loading: () => (
      <div className="container py-16 md:py-24">
        <Skeleton className="h-48 w-full" />
      </div>
    ),
    // ssr: false, // Keep SSR true (default) for better SEO and less layout shift if content is static
  }
);


// HomePage remains a Server Component for static content rendering

// Stats Section Component (Server Component)
const StatsSection: React.FC = () => {
    // TODO: Fetch these numbers dynamically (can be done server-side)
    const vendorCount = 150; // Example number
    const categories = ["Plumbing", "Electrician", "Design", "Catering", "Cleaning", "IT Support", "Crafts", "Electronics", "Landscaping", "More..."];

    return (
        // Added gradient for visual separation, padding adjusted
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900/30 py-16 md:py-20 text-white">
            <div className="container grid md:grid-cols-2 gap-8 items-center px-4">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Growing Network</h2>
                    <p className="text-lg text-gray-300 mb-6 max-w-lg mx-auto md:mx-0">
                        Connect with a diverse range of trusted service and product providers across numerous categories.
                    </p>
                    {/* Button styling adjusted for better contrast */}
                     <Button variant="outline" className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 font-bold py-3 px-6 rounded-lg transition-colors duration-200" asChild>
                         <Link href="/providers">Explore Categories</Link>
                     </Button>
                </div>
                 <div className="flex flex-col items-center md:items-end gap-6 mt-8 md:mt-0">
                    <div className="text-center md:text-right">
                         <p className="text-5xl font-extrabold text-white">{vendorCount}+</p>
                         <p className="text-lg text-gray-300">Verified Vendors</p>
                    </div>
                    <div className="text-center md:text-right max-w-md">
                        <h3 className="text-xl font-semibold mb-2">Popular Categories</h3>
                         <div className="flex flex-wrap justify-center md:justify-end gap-2">
                             {/* Added unique key for mapped elements */}
                             {categories.slice(0, 8).map(cat => (
                                <span key={`cat-${cat}`} className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                                     {cat}
                                 </span>
                             ))}
                             {categories.length > 8 && (
                                <span key="cat-more" className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                                    & More
                                </span>
                             )}
                         </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

// Testimonials Section (Server Component)
const TestimonialsSection: React.FC = () => {
  const testimonials = [
    { id: 't1', name: "Alice M.", role: "Client", quote: "Finding a reliable plumber was so easy with Connectify Hub! Plus, I got cashback. Win-win!", avatar: "https://picsum.photos/seed/t1/100" },
    { id: 't2', name: "Bob K.", role: "Vendor (Design)", quote: "The platform brings me qualified leads consistently. The referral system is a great bonus too!", avatar: "https://picsum.photos/seed/t2/100" },
    { id: 't3', name: "Charlie S.", role: "Client", quote: "I referred my friend for catering, and we both got rewarded. Love this system!", avatar: "https://picsum.photos/seed/t3/100" },
  ];

  return (
    <div className="container py-16 md:py-24">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">What Our Users Say</h2>
      <div className="grid gap-6 md:gap-8 md:grid-cols-1 lg:grid-cols-3"> {/* Adjusted grid for better mobile stacking */}
        {/* Added unique key for mapped elements */}
        {testimonials.map((t) => (
           <Card key={t.id} className="flex flex-col items-center text-center p-6 shadow-lg hover:shadow-primary/10 transition-shadow duration-300 bg-card">
            <Quote className="h-8 w-8 text-primary mb-4 transform rotate-180" />
            <CardContent className="flex-grow mb-4">
              <p className="text-muted-foreground italic">"{t.quote}"</p>
            </CardContent>
            <div className="flex flex-col items-center gap-2 pt-4 border-t border-border w-full mt-auto">
              <Avatar>
                <AvatarImage src={t.avatar} alt={t.name} />
                <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};


// Why Choose Us Section (Server Component)
const WhyChooseSection: React.FC = () => {
    return (
         <div className="container py-16 md:py-24 border-t border-border bg-background">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Why Choose Connectify Hub?</h2>
            <div className="grid gap-6 md:gap-8 md:grid-cols-1 lg:grid-cols-3"> {/* Adjusted grid */}
                <Card className="text-center p-6 bg-card">
                    <CardHeader>
                        <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                        <CardTitle className="text-foreground">Verified Professionals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                        Connect with trusted vendors vetted for quality and reliability.
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-center p-6 bg-card">
                    <CardHeader>
                        <Star className="h-10 w-10 text-accent mx-auto mb-3" />
                        <CardTitle className="text-foreground">Earn Rewards</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                        Get cashback on your purchases and earn commissions for referrals.
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-center p-6 bg-card">
                    <CardHeader>
                        <Search className="h-10 w-10 text-primary mx-auto mb-3" />
                        <CardTitle className="text-foreground">Seamless Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                        Easily find the services or products you need with our intuitive search.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


export default function HomePage() {
  return (
    <>
      {/* Use Client Component for animations */}
      <HeroSectionClient />
      {/* Use dynamically imported Client Component for potential video/animation */}
      <DynamicAboutSectionClient />
      {/* Static content rendered on server */}
      <StatsSection />
      <TestimonialsSection />
      <WhyChooseSection />
    </>
  );
}
