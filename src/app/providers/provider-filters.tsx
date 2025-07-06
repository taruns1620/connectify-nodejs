
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import ProviderCard from './provider-card'; // Import the card component
import type { ProviderCardData } from './page'; // Import the type

interface ProviderFiltersProps {
    categories: string[];
    initialProviders: ProviderCardData[]; // Receive initial list from server
}

export default function ProviderFilters({ categories, initialProviders }: ProviderFiltersProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'service', 'product'
    const [filterCategory, setFilterCategory] = useState('all');

    // Perform filtering on the client side based on state
    const filteredProviders = useMemo(() => {
        return initialProviders.filter(provider => {
            const nameMatch = provider.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Determine the provider's type ('service' or 'product') for filtering
            let providerType: 'service' | 'product' = 'service';
            if (provider.vendorType === 'shop') {
                providerType = 'product';
            }
            
            const typeMatch = filterType === 'all' || providerType === filterType;
            const categoryMatch = filterCategory === 'all' || provider.category === filterCategory;

            return nameMatch && typeMatch && categoryMatch;
        });
    }, [searchTerm, filterType, filterCategory, initialProviders]);

    return (
        <>
            <Card className="mb-8 p-6 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="md:col-span-1 bg-card"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="service">Service Vendors</SelectItem>
                    <SelectItem value="product">Product Vendors</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Filter by Category" />
                    </SelectTrigger>
                    <SelectContent>
                    {categories.map(cat => (
                        <SelectItem key={`cat-filter-${cat}`} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            </Card>

            {filteredProviders.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProviders.map((provider) => (
                    <ProviderCard key={provider.id} provider={provider} />
                ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <Search className="mx-auto h-12 w-12 mb-4" />
                    <p className="text-xl font-semibold">No Vendors Found</p>
                    <p className="mt-2">Try adjusting your search filters.</p>
                </div>
            )}
        </>
    );
}
