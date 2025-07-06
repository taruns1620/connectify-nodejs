
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Building, ShoppingCart, UserCircle } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { VendorRegistrationRequest } from '@/types';
import { useAuth } from '@/hooks/use-auth';

type VendorType = 'shop' | 'service_office' | 'service_freelancer';

const MOCK_CATEGORIES = [
    { name: 'Interior Design' }, { name: 'Electronics' }, { name: 'Legal Services' },
    { name: 'Healthcare' }, { name: 'Real Estate' }, { name: 'Design' }, { name: 'Plumbing' },
    { name: 'Writing & Content' }, { name: 'Electrician' }, { name: 'Catering' },
    { name: 'IT Support' }, { name: 'Cleaning Services' }, { name: 'Landscaping' },
    { name: 'Web Development' }, { name: 'Accounting' }, { name: 'Marketing' },
];

export default function VendorRegistrationFormPage() {
  const router = useRouter();
  const { user, loading: authLoading, registrationStatus } = useAuth();

  const [vendorType, setVendorType] = useState<VendorType | ''>('');

  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [upiId, setUpiId] = useState('');
  const [website, setWebsite] = useState('');

  // Shop
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');

  // Service Office
  const [officeName, setOfficeName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');

  // Freelancer
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [areaOfService, setAreaOfService] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("You must be logged in to register as a vendor.");
        router.replace('/login');
        return;
      }
      
      if (registrationStatus === 'Pending') {
        console.log("[Vendor Reg Page] Status is Pending. Redirecting to waiting page.");
        router.replace('/profile/register/pending');
        return;
      }
      
      if (registrationStatus === 'Approved') {
        console.log("[Vendor Reg Page] Status is Approved. Redirecting to dashboard.");
        router.replace('/vendor/dashboard');
        return;
      }

      // If user exists and status is not Pending/Approved, pre-fill form
      // Note: A 'Rejected' status will correctly land the user here to re-submit.
      setMobileNumber(user.mobileNumber?.replace('+91','') || '');
      setEmail(user.email || '');
      setFullName(user.name || '');
    }
  }, [user, authLoading, registrationStatus, router]);

 const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Not Logged In: You must be logged in.');
      return;
    }
    if (!vendorType) {
      toast.error('Missing Information: Please select a vendor type.');
      return;
    }
    if (!category) {
        toast.error('Missing Category: Please select a category.');
        return;
    }
    if (!upiId.trim()) {
        toast.error('UPI ID is required for payments.');
        return;
    }

    if (vendorType === 'shop' && (!shopName.trim() || !shopAddress.trim())) {
        toast.error("Shop name and address are required.");
        return;
    }
    if (vendorType === 'service_office' && (!officeName.trim() || !officeAddress.trim())) {
        toast.error("Office name and address are required.");
        return;
    }
    if (vendorType === 'service_freelancer' && (!fullName.trim() || !profession.trim() || !permanentAddress.trim())) {
        toast.error("Full name, profession, and address are required for freelancers.");
        return;
    }

    setIsSubmitting(true);

    try {
      const registrationData: VendorRegistrationRequest = {
        userId: user.uid,
        mobileNumber: mobileNumber,
        email: email,
        vendorType: vendorType,
        category: category,
        upiId: upiId.trim(),
        website: website.trim(),
        submittedDate: serverTimestamp() as Timestamp,
        status: 'Pending',
      };

      if (vendorType === 'shop') {
        registrationData.shopName = shopName;
        registrationData.shopAddress = shopAddress;
      } else if (vendorType === 'service_office') {
        registrationData.officeName = officeName;
        registrationData.officeAddress = officeAddress;
      } else if (vendorType === 'service_freelancer') {
        registrationData.fullName = fullName;
        registrationData.profession = profession;
        registrationData.permanentAddress = permanentAddress;
        registrationData.areaOfService = areaOfService;
      }

      await addDoc(collection(db, "vendorRegistrations"), registrationData);
      toast.success("Registration Submitted: Your application is under review.");
      router.push('/profile/register/pending');

    } catch (error: any) {
      console.error('Error submitting vendor registration:', error);
      let errorMessage = 'Submission Failed: An unexpected error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = 'Submission Failed: You do not have permission to upload files. Please check your login status.';
            break;
          case 'storage/canceled':
            errorMessage = 'Submission Failed: File upload was cancelled.';
            break;
          case 'firestore/permission-denied':
             errorMessage = 'Submission Failed: You do not have permission to submit this form.';
             break;
          default:
            errorMessage = `Submission Failed: ${error.message}`;
        }
      }
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (user && (registrationStatus === 'Pending' || registrationStatus === 'Approved'))) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Checking registration status...</p>
      </div>
    );
  }

  const renderFormFields = () => {
    const categorySelect = (
        <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required disabled={isSubmitting}>
                <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {MOCK_CATEGORIES.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );

    return (
      <div className="space-y-6">
        <div className="p-4 border-b">
            <h3 className="font-semibold text-lg">{vendorType === 'shop' ? 'Shop Details' : vendorType === 'service_office' ? 'Office Details' : 'Freelancer Details'}</h3>
            <p className="text-sm text-muted-foreground">Fill in the information for your business.</p>
        </div>

        {vendorType === 'shop' && (
            <div className="space-y-4 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="shopName">Shop Name</Label>
                        <Input id="shopName" placeholder="Your Shop Name" required value={shopName} onChange={(e) => setShopName(e.target.value)} disabled={isSubmitting} />
                    </div>
                    {categorySelect}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="shopAddress">Shop Address</Label>
                    <Textarea id="shopAddress" placeholder="Full shop address" required value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} disabled={isSubmitting} />
                </div>
            </div>
        )}

        {vendorType === 'service_office' && (
             <div className="space-y-4 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="officeName">Office/Business Name</Label>
                        <Input id="officeName" placeholder="Your Office/Business Name" required value={officeName} onChange={(e) => setOfficeName(e.target.value)} disabled={isSubmitting} />
                    </div>
                     {categorySelect}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="officeAddress">Office Address</Label>
                    <Textarea id="officeAddress" placeholder="Full office address" required value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} disabled={isSubmitting} />
                </div>
            </div>
        )}

        {vendorType === 'service_freelancer' && (
            <div className="space-y-4 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="Your Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isSubmitting} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="profession">Profession</Label>
                        <Input id="profession" placeholder="e.g., Electrician, Plumber, Astrologer" required value={profession} onChange={(e) => setProfession(e.target.value)} disabled={isSubmitting} />
                    </div>
                </div>
                {categorySelect}
                <div className="grid gap-2">
                    <Label htmlFor="permanentAddress">Permanent Address</Label>
                    <Textarea id="permanentAddress" placeholder="Your permanent residential address" required value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="areaOfService">Area of Service (City/Region)</Label>
                        <Input id="areaOfService" placeholder="e.g., South Bangalore, Sirsi Taluk" required value={areaOfService} onChange={(e) => setAreaOfService(e.target.value)} disabled={isSubmitting} />
                    </div>
                </div>
            </div>
        )}

        <div className="space-y-4 px-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Contact & Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting || !!user?.email} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mobileNumber">Contact Mobile Number</Label>
                  <Input id="mobileNumber" type="tel" placeholder="Your 10-digit mobile number" required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} disabled={isSubmitting || !!user?.phoneNumber} maxLength={10} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input id="upiId" placeholder="yourname@bank" required value={upiId} onChange={(e) => setUpiId(e.target.value)} disabled={isSubmitting} />
                    <p className="text-xs text-muted-foreground">This will be used for payments.</p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input id="website" type="url" placeholder="https://yourwebsite.com" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={isSubmitting} />
                </div>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <span className="text-primary font-semibold text-sm">CONNECTIFY HUB</span>
            <CardTitle className="text-2xl">Vendor Registration</CardTitle>
            <CardDescription>
              Complete your profile to start connecting with clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {!vendorType ? (
              <div className="space-y-4 p-4">
                <Label className="text-base font-semibold text-center block">Step 1: Choose Your Vendor Type</Label>
                <RadioGroup onValueChange={(value) => setVendorType(value as VendorType)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <RadioGroupItem value="shop" id="type-shop" className="peer sr-only" />
                    <Label htmlFor="type-shop" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <ShoppingCart className="mb-3 h-6 w-6" />
                      Shop (Products)
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="service_office" id="type-service-office" className="peer sr-only" />
                    <Label htmlFor="type-service-office" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <Building className="mb-3 h-6 w-6" />
                      Service (with Office)
                    </Label>
                  </div>
                   <div>
                    <RadioGroupItem value="service_freelancer" id="type-service-freelancer" className="peer sr-only" />
                    <Label htmlFor="type-service-freelancer" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <UserCircle className="mb-3 h-6 w-6" />
                      Service (Freelancer)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ) : (
                renderFormFields()
            )}
          </CardContent>
          {vendorType && (
            <CardFooter className="flex flex-col items-center gap-4 pt-4 border-t">
                <div className="flex w-full justify-between">
                    <Button type="button" variant="outline" onClick={() => setVendorType('')} disabled={isSubmitting}>
                        Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground pt-2">
                    By registering, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> and{' '}
                    <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                </p>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
