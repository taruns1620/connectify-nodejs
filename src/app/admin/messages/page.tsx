
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast'; // Import react-hot-toast
import { Send, Users, Store, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { PlatformMessage } from '@/types'; 

export default function AdminMessagesPage() {
    const [recipientType, setRecipientType] = useState<'clients' | 'vendors' | 'all'>('clients'); 
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async () => {
        if (!subject.trim() || !message.trim()) {
             toast.error('Error: Subject and message cannot be empty.');
            return;
        }

        setIsSending(true);

        const messageData: Omit<PlatformMessage, 'id'> = { 
            recipientType: recipientType,
            sender: 'admin', 
            subject: subject.trim(),
            message: message.trim(),
            sentDate: serverTimestamp() as any, 
        };

        try {
            await addDoc(collection(db, "messages"), messageData);

            toast.success(`Message Queued: Your message to ${recipientType} has been queued for sending.`);
            setSubject('');
            setMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
             toast.error('Error: Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Send Bulk Message</h1>

      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
          <CardDescription>
            Send a notification or announcement to all clients, all vendors, or everyone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
             <Label>Send message to:</Label>
             <RadioGroup
                defaultValue="clients"
                value={recipientType}
                onValueChange={(value: 'clients' | 'vendors' | 'all') => setRecipientType(value)}
                className="flex flex-wrap gap-4" 
                disabled={isSending}
            >
                <div className="flex items-center space-x-2 p-3 border rounded-md flex-1 hover:bg-accent/50 transition-colors data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground min-w-[120px]">
                    <RadioGroupItem value="clients" id="r-clients" />
                    <Label htmlFor="r-clients" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-5 w-5"/> All Clients
                    </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md flex-1 hover:bg-accent/50 transition-colors data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground min-w-[120px]">
                    <RadioGroupItem value="vendors" id="r-vendors" />
                    <Label htmlFor="r-vendors" className="flex items-center gap-2 cursor-pointer">
                        <Store className="h-5 w-5"/> All Vendors
                    </Label>
                </div>
             </RadioGroup>
          </div>

           <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
                id="subject"
                placeholder="Enter message subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
                required
             />
          </div>

           <div className="space-y-2">
            <Label htmlFor="message">Message Body</Label>
            <Textarea
                id="message"
                placeholder={`Type your message for all ${recipientType}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                disabled={isSending}
                required
             />
          </div>

        </CardContent>
        <CardFooter>
            <Button onClick={handleSendMessage} disabled={isSending || !subject.trim() || !message.trim()}>
                 {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                 {isSending ? 'Sending...' : `Send Message to ${recipientType === 'clients' ? 'Clients' : recipientType === 'vendors' ? 'Vendors' : 'All Users'}`}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
