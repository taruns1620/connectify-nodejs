
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, ShoppingBag, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import type { ProviderCardData } from './page'; // Import the type definition

interface ProviderCardProps {
    provider: ProviderCardData;
}

export default function ProviderCard({ provider }: ProviderCardProps) {
    const isService = provider.vendorType === 'service_office' || provider.vendorType === 'service_freelancer';
    const typeIcon = isService ? <Briefcase className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />;

    return (
        <Card key={provider.id} className="flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] bg-card">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                <Avatar className="h-12 w-12 border">
                <AvatarImage src={provider.avatarUrl} alt={provider.name} />
                <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1 text-xs">
                    {typeIcon}
                    {provider.category}
                </CardDescription>
                <CardDescription className="flex items-center gap-1.5 mt-1 text-xs">
                    <MapPin className="h-3.5 w-3.5" /> {provider.location}
                </CardDescription>
                <div className="flex items-center gap-1 mt-1.5">
                    <Star className="h-4 w-4 text-accent fill-accent" />
                    <span className="text-xs font-medium">{provider.rating.toFixed(1)}/5.0</span>
                </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow pt-0 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{provider.description}</p>
            </CardContent>
            <CardFooter className="pt-0">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="sm" asChild>
                    <Link href={`/providers/${provider.id}`}>View Profile</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
