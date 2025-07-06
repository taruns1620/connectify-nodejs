
import ProviderFilters from './provider-filters';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { VendorUser, Category } from '@/types';

// Define the shape of the data the card needs.
// This simplifies passing data from the server component to the client component.
export type ProviderCardData = {
    id: string;
    name: string;
    vendorType: 'shop' | 'service_office' | 'service_freelancer';
    category: string;
    description: string;
    location: string;
    rating: number; // This will be mocked for now
    avatarUrl?: string;
};

// Fetch active vendors directly on the server
const getProviders = async (): Promise<ProviderCardData[]> => {
    const vendorsRef = collection(db, "users");
    // Query for users who are 'vendor' and are 'isActive'
    const q = query(vendorsRef, where("role", "==", "vendor"), where("isActive", "==", true));
    
    try {
        const querySnapshot = await getDocs(q);
        const vendors: ProviderCardData[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as VendorUser;
            // More robustly determine the display name by checking multiple fields
            const displayName = data.businessName || data.shopName || data.officeName || data.fullName || data.name || "Unnamed Vendor";

            vendors.push({
                id: doc.id,
                name: displayName,
                vendorType: data.vendorType,
                category: data.category || 'Uncategorized',
                // Placeholder description, as it's not in the DB model
                description: `A verified professional in the ${data.category || 'general'} category, serving the ${data.location || data.areaOfService || 'area'}.`,
                location: data.location || data.areaOfService || "Online",
                // Mock rating as it doesn't exist yet
                rating: 4.0 + Math.random(),
                avatarUrl: data.photoUrl,
            });
        });
        return vendors;
    } catch (error) {
        console.error("Error fetching vendors:", error);
        return []; // Return an empty array on error to prevent crashes
    }
};

// Fetch categories dynamically from Firestore
const getCategories = async (): Promise<string[]> => {
    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("name"));
    try {
        const querySnapshot = await getDocs(q);
        const categories = querySnapshot.docs.map(doc => (doc.data() as Category).name);
        return ['all', ...new Set(categories)]; // Add 'all' for the filter
    } catch (error) {
        console.error("Error fetching categories:", error);
        return ['all']; // Fallback
    }
};


// This is the main server component for the page
export default async function BrowseVendorsPage() {
    // Fetch initial data on the server
    const allProviders = await getProviders();
    const categories = await getCategories();

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold mb-8">Browse Vendors</h1>

            {/* Pass the server-fetched data to the client component for filtering */}
            <ProviderFilters categories={categories} initialProviders={allProviders} />
        </div>
    );
}
