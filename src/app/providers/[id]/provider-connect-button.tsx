
'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface ProviderConnectButtonProps {
    providerId: string;
    providerName: string;
}

export default function ProviderConnectButton({ providerId, providerName }: ProviderConnectButtonProps) {

   const handleContactClick = () => {
        // TODO: Implement contacting logic (API call, logging for commission)
        // This remains client-side logic
        console.log(`Contacting ${providerName}... (ID: ${providerId})`);
        alert(`Contacting ${providerName}. In a real app, this would initiate the connection process.`);
        // Example: You might trigger a Server Action here to record the connection attempt.
        // startConnection(providerId);
   }

   return (
        <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleContactClick}>
           <MessageSquare className="mr-2 h-5 w-5" /> Connect with {providerName}
        </Button>
   );
}
