'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Building, Shield, Mail, Phone, ExternalLink, IndianRupee, MapPin, Briefcase } from 'lucide-react';
import type { ClientUser, VendorUser, AppUser, BaseUser } from '@/types';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Client Profile Component
const ClientProfileCard = ({ user }: { user: ClientUser }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={(user as any).photoUrl} alt={user.name || 'Client'} />
          <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'C'}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-2xl">{user.name || 'Client User'}</CardTitle>
          <CardDescription>Client Account</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center text-sm">
        <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
        <span>{user.email || 'No email provided'}</span>
      </div>
      <div className="flex items-center text-sm">
        <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
        <span>{user.mobileNumber || 'No mobile provided'}</span>
      </div>
      <div className="flex items-center text-sm">
        <IndianRupee className="mr-3 h-4 w-4 text-muted-foreground" />
        <span>UPI ID: {user.upiId || 'Not set'}</span>
      </div>
    </CardContent>
    <CardFooter>
      <Button asChild className="w-full">
        <Link href="/client/dashboard">Go to Dashboard</Link>
      </Button>
    </CardFooter>
  </Card>
);

// Vendor Profile Form Component
const VendorProfileForm = ({ user }: { user: VendorUser }) => {
    const [businessName, setBusinessName] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // This effect ensures the form state is updated when the user prop is available/changes
    useEffect(() => {
        if (user) {
            setBusinessName(user.businessName || user.name || '');
            setLocation(user.location || user.permanentAddress || '');
            setWebsite(user.website || '');
        }
    }, [user]);

    const handleUpdate = async () => {
        setIsUpdating(true);
        const userRef = doc(db, 'users', user.uid);
        try {
            const updateData: Partial<VendorUser> = {
                name: businessName, // Keep name in sync
                website: website,
            };

            // Update specific fields based on vendorType
            if(user.vendorType === 'shop' || user.vendorType === 'service_office') {
                updateData.businessName = businessName;
                updateData.location = location;
            } else if (user.vendorType === 'service_freelancer') {
                updateData.fullName = businessName;
                updateData.permanentAddress = location;
            }

            await updateDoc(userRef, updateData);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error('Failed to update profile.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.photoUrl} alt={user.businessName || user.name || 'Vendor'} />
                        <AvatarFallback>{(businessName || 'V').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{businessName || 'Vendor Profile'}</CardTitle>
                        <CardDescription>Vendor Account {user.isActive ? '(Active)' : '(Inactive)'}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="businessName">Business/Full Name</Label>
                    <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} disabled={isUpdating} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="location">Location / Address</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} disabled={isUpdating} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={isUpdating} />
                </div>

                <div className="flex items-center text-sm pt-4 border-t mt-4">
                    <Briefcase className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Category: {user.category || 'Not set'}</span>
                </div>
                <div className="flex items-center text-sm">
                    <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>{user.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center text-sm">
                    <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>{user.mobileNumber || 'No mobile provided'}</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button onClick={handleUpdate} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Profile
                </Button>
                <Button asChild variant="secondary">
                    <Link href="/vendor/dashboard">Go to Dashboard</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}


// Admin Profile Component
const AdminProfileCard = ({ user }: { user: BaseUser }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
           <AvatarImage src={(user as any).photoUrl} alt={(user as any).name || 'Admin'} />
          <AvatarFallback><Shield /></AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-2xl">{(user as any).name || 'Admin'}</CardTitle>
          <CardDescription>Administrator Account</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center text-sm">
        <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
        <span>{user.email || 'No email provided'}</span>
      </div>
      <div className="flex items-center text-sm">
        <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
        <span>{user.mobileNumber || 'No mobile provided'}</span>
      </div>
    </CardContent>
    <CardFooter>
       <Button asChild className="w-full">
        <Link href="/admin/dashboard">Go to Dashboard</Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const renderProfile = () => {
    switch (user.role) {
      case 'client':
        return <ClientProfileCard user={user as ClientUser} />;
      case 'vendor':
        return <VendorProfileForm user={user as VendorUser} />;
      case 'admin':
        return <AdminProfileCard user={user as BaseUser} />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Unknown User Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your user role could not be determined. Please contact support.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="container py-12 flex justify-center items-start min-h-[calc(100vh-15rem)]">
      <div className="w-full max-w-2xl">
        {renderProfile()}
      </div>
    </div>
  );
}
