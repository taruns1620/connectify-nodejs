
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Mail, MapPin, Phone, ShoppingBag, Star, Globe, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProviderConnectButton from './provider-connect-button'; // Import the new client component
import { db } from '@/lib/firebase/config'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import type { VendorUser } from '@/types'; // Assuming VendorUser includes all necessary fields

// Define a type for the provider object - Use VendorUser from types
// type Provider = {
//     id: string;
//     name: string; // Use businessName or name from VendorUser
//     type: 'service' | 'product'; // Need to determine this based on category or other logic
//     category: string;
//     description: string; // Need a description field in VendorUser?
//     location: string;
//     rating: number; // Need to implement rating system
//     avatar: string; // Use photoUrl from VendorUser
//     contactEmail: string | null; // Use email from VendorUser
//     contactPhone: string | null; // Use mobileNumber from VendorUser
//     website: string | null;
//     servicesOffered: string[]; // Need field in VendorUser?
//     productsOffered: string[]; // Need field in VendorUser?
// };


// Fetch data directly on the server
const getProviderById = async (id: string): Promise<VendorUser | null> => {
    try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().role === 'vendor') {
            // Add id to the data
            return { id: docSnap.id, ...docSnap.data() } as VendorUser;
        } else {
            console.log(`No vendor found with ID: ${id}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching vendor:", error);
        return null;
    }
};

// Placeholder function to determine type - adjust as needed
const getProviderType = (category: string): 'service' | 'product' => {
    // Example logic: Assume categories like 'Electronics', 'Crafts' are products
    const productCategories = ['Electronics', 'Crafts'];
    return productCategories.includes(category) ? 'product' : 'service';
};

// Placeholder function for rating - replace with actual logic
const getProviderRating = (vendorId: string): number => {
    // Fetch or calculate rating based on reviews, etc.
    return 4.5; // Mock rating
};

// Placeholder for services/products - fetch from subcollection or separate field
const getOfferings = (vendorId: string, type: 'service' | 'product'): string[] => {
    // Fetch based on type
    return type === 'service'
        ? ['Service A', 'Service B'] // Mock data
        : ['Product X', 'Product Y']; // Mock data
};


// This is now a Server Component by default
export default async function ProviderProfilePage({ params }: { params: { id: string } }) {
  // Fetch data directly on the server
  const provider = await getProviderById(params.id);

  if (!provider) {
    notFound(); // Show 404 if provider doesn't exist
  }

  // Determine provider type and offerings (replace placeholders)
  const providerType = getProviderType(provider.category);
  const offerings = getOfferings(provider.id!, providerType);
  const rating = getProviderRating(provider.id!);

  // TODO: Need a description field in the VendorUser type or fetch from elsewhere
  const providerDescription = `Details about ${provider.businessName || provider.name}'s offerings in ${provider.category}.`; // Placeholder


  return (
    <div className="container py-12 max-w-5xl mx-auto"> {/* Limit width */}
      <Card className="mb-8 overflow-hidden shadow-lg dark:bg-card"> {/* Added shadow, adjusted bg */}
        <CardHeader className="p-6">
           <div className="flex flex-col md:flex-row items-start gap-6">
             {/* Use relative positioning for potential badges */}
             <div className="relative shrink-0">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-primary/50 shadow-md"> {/* Adjusted border */}
                    <AvatarImage src={provider.photoUrl || undefined} alt={provider.businessName || provider.name || 'Vendor'} />
                    <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                        {(provider.businessName || provider.name || 'V').charAt(0)}
                     </AvatarFallback>
                </Avatar>
             </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <CardTitle className="text-3xl font-bold text-foreground">{provider.businessName || provider.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-2 sm:mt-0">
                    {[...Array(5)].map((_, i) => (
                        <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.round(rating) ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} // Dimmed non-filled stars
                        />
                    ))}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">({rating.toFixed(1)})</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1.5">
                        {providerType === 'service' ? <Briefcase className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                        <span>{provider.category}</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{provider.location}</span>
                    </div>
                </div>

                 <p className="text-muted-foreground leading-relaxed mb-4">{providerDescription}</p>

                 {/* Use the Client Component for the button interaction */}
                 {/* TODO: Consider how to pass client ID securely if needed for connection */}
                 <ProviderConnectButton providerId={provider.id!} providerName={provider.businessName || provider.name || 'Vendor'} />
              </div>

           </div>
        </CardHeader>
      </Card>

       <div className="grid md:grid-cols-3 gap-8">
         {/* Services/Products Section */}
          <Card className="md:col-span-2 dark:bg-card">
             <CardHeader>
               <CardTitle className="text-foreground">{providerType === 'service' ? 'Services Offered' : 'Featured Products'}</CardTitle>
                <CardDescription>Key offerings from {provider.businessName || provider.name}</CardDescription>
             </CardHeader>
              <Separator className="mb-4 bg-border" />
             <CardContent>
               {(providerType === 'service' || providerType === 'product') && offerings?.length > 0 ? (
                 <ul className="list-disc list-outside pl-5 space-y-2 text-muted-foreground">
                   {offerings.map(offering => <li key={offering}>{offering}</li>)}
                 </ul>
               ) : (
                 <p className="text-muted-foreground italic">No specific {providerType === 'service' ? 'services' : 'products'} listed by the vendor.</p>
               )}
             </CardContent>
           </Card>

            {/* Contact Info Section */}
           <Card className="dark:bg-card">
             <CardHeader>
               <CardTitle className="text-foreground">Contact Details</CardTitle>
             </CardHeader>
              <Separator className="mb-4 bg-border" />
             <CardContent className="space-y-4">
               {provider.email && (
                 <div className="flex items-start gap-3"> {/* Changed to items-start */}
                   <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" /> {/* Added shrink-0 */}
                   <a href={`mailto:${provider.email}`} className="text-sm hover:text-primary break-all">{provider.email}</a>
                 </div>
               )}
                {provider.mobileNumber && (
                 <div className="flex items-start gap-3">
                   <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                   {/* Consider formatting the phone number */}
                   <a href={`tel:${provider.mobileNumber}`} className="text-sm hover:text-primary">{provider.mobileNumber}</a>
                 </div>
               )}
                {provider.website && (
                 <div className="flex items-start gap-3">
                   <Globe className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                   {/* Use the API route for tracked redirection */}
                   <a href={`/api/visit/${provider.id}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary break-all">{provider.website}</a>
                 </div>
               )}
               <div className="flex items-start gap-3">
                   <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                   <span className="text-sm">{provider.location}</span>
                 </div>
                 {/* Add Social Media links here if applicable */}
             </CardContent>
           </Card>
       </div>

    </div>
  );
}

// Optional: generateStaticParams can still be used if needed for SSG
export async function generateStaticParams() {
  // In a real app, fetch all vendor IDs from your data source
  // For now, return an empty array or a few known IDs if needed
   const mockVendors: Pick<VendorUser, 'id'>[] = [
     { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' } // Use existing mock IDs if they represent vendors
   ];
   return mockVendors.map((vendor) => ({
     id: vendor.id!, // Add non-null assertion if ID is guaranteed
   }));
}

// Ensure dynamic segments are handled correctly
export const dynamicParams = true; // Allow generating pages for IDs not listed in generateStaticParams
