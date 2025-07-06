'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Building, Send, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { SupportTicket } from '@/types';
import Link from 'next/link';

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


export default function ContactUsPage() {
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const supportEmail = "connectify.hub.india@gmail.com";
  const supportPhone = "9591073419";
  const registeredAddress = "L I G 28K H B COLONY NEW MARKET YARD Sirsi, Uttara Kannada, KA 581402";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
        toast.error("Please fill out all form fields.");
        return;
    }
    setIsSubmitting(true);
    
    try {
        const ticketData: Omit<SupportTicket, 'id' | 'lastReplyDate' | 'assignedAdmin'> = {
            senderUid: user?.uid || 'anonymous_guest',
            senderRole: user?.role || 'guest',
            senderEmail: email,
            subject: subject,
            message: message,
            status: 'Open',
            submittedDate: serverTimestamp() as any,
        };

        await addDoc(collection(db, "supportTickets"), ticketData);
        
        toast.success("Your message has been sent!");
        setSubject('');
        setMessage('');
        if (!user) {
            setName('');
            setEmail('');
        }

    } catch (error) {
        console.error("Error submitting contact form: ", error);
        toast.error("Failed to send message. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
            <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold font-orbitron">Contact Us</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              We're here to help! Reach out with any questions or issues. Our support team typically responds within 24-48 hours.
            </p>
        </div>

        <Card className="max-w-5xl mx-auto bg-card shadow-xl p-6 sm:p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Left Column: Info Cards */}
            <div className="space-y-6">
                <div className="p-6 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-full">
                           <Phone size={20} />
                        </div>
                        <h3 className="font-semibold text-lg">WhatsApp / Phone Support</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">For immediate assistance or inquiries, feel free to call or message us on WhatsApp.</p>
                    <p className="text-xl font-semibold tracking-wider">{supportPhone}</p>
                    <Button asChild variant="link" className="p-0 h-auto text-green-400 hover:text-green-300 mt-2">
                        <a href={`https://wa.me/91${supportPhone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                             <WhatsAppLogo size={16}/> Chat on WhatsApp
                        </a>
                    </Button>
                </div>
                 <div className="p-6 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-4 mb-3">
                         <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-full">
                           <Mail size={20} />
                        </div>
                        <h3 className="font-semibold text-lg">Email Support</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">For non-urgent matters or detailed queries, please email us.</p>
                     <a href={`mailto:${supportEmail}`} className="text-primary hover:underline break-all">{supportEmail}</a>
                </div>
                 <div className="p-6 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-4 mb-3">
                         <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-full">
                           <Building size={20} />
                        </div>
                        <h3 className="font-semibold text-lg">Registered Office</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">Official correspondence can be sent to:</p>
                    <p className="text-foreground mt-2">{registeredAddress}</p>
                </div>
            </div>

            {/* Right Column: Form */}
            <div>
                <h3 className="text-2xl font-bold mb-1">Send us a message</h3>
                <p className="text-muted-foreground mb-6">Fill out the form and we'll get back to you.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting || !!user?.name} required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting || !!user?.email} required />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="What is your message about?" value={subject} onChange={e => setSubject(e.target.value)} disabled={isSubmitting} required />
                  </div>
                  <div>
                     <Label htmlFor="message">Message</Label>
                     <Textarea id="message" placeholder="Type your message here..." rows={5} value={message} onChange={e => setMessage(e.target.value)} disabled={isSubmitting} required />
                  </div>
                  <Button type="submit" className="w-full font-bold h-12" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Message
                  </Button>
                </form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
