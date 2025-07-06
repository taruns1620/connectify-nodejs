
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Search, Users, Gift, Send, Loader2, WalletCards, IndianRupee, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import type { ClientUser, ClientReferral, Commission } from '@/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const generateQrCodeDataUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

export default function ClientDashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // Component State
  const [clientUniqueId, setClientUniqueId] = useState<string | null>(null);
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  const [isSubmittingUpi, setIsSubmittingUpi] = useState(false);
  const [existingUpiId, setExistingUpiId] = useState<string | null | undefined>(undefined);
  
  // Form State
  const [referralName, setReferralName] = useState('');
  const [referralNumber, setReferralNumber] = useState('');
  const [referralCategory, setReferralCategory] = useState('');
  const [upiId, setUpiId] = useState('');

  // Dynamic Data State
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [earnings, setEarnings] = useState({ cashback: 0, referralRewards: 0 });
  const [referralHistory, setReferralHistory] = useState<ClientReferral[]>([]);
  const [cashbackHistory, setCashbackHistory] = useState<Commission[]>([]);

   useEffect(() => {
       if (!authLoading && authUser) {
            if (authUser.role !== 'client') {
                console.log(`User role is ${authUser.role}, redirecting from client dashboard.`);
                if (authUser.role === 'vendor') router.push('/vendor/dashboard');
                else if (authUser.role === 'admin') router.push('/admin/dashboard');
                else router.push('/');
                return;
            }

            const clientUser = authUser as ClientUser;
            setClientUniqueId(clientUser.uid);
            setExistingUpiId(clientUser.upiId || null);
            setUpiId(clientUser.upiId || '');

            // --- Set up Firestore listeners for dynamic data ---
            setIsLoadingData(true);

            // Listener for referrals made by this client
            const referralsQuery = query(collection(db, "clientReferrals"), where("referrerClientId", "==", clientUser.uid), orderBy("referralDate", "desc"));
            const unsubscribeReferrals = onSnapshot(referralsQuery, (snapshot) => {
                const fetchedReferrals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientReferral));
                setReferralHistory(fetchedReferrals);
            });

            // Listener for commissions (for both cashback and referral earnings)
            const commissionsAsClientQuery = query(collection(db, "commissions"), where("clientId", "==", clientUser.uid));
            const commissionsAsReferrerQuery = query(collection(db, "commissions"), where("referrerId", "==", clientUser.uid));

            const unsubscribeCommissionsClient = onSnapshot(commissionsAsClientQuery, (clientSnapshot) => {
                 const clientCommissions = clientSnapshot.docs.map(doc => doc.data() as Commission);
                 setCashbackHistory(clientCommissions.filter(c => c.clientCashback > 0));
                 updateEarnings();
            });
            const unsubscribeCommissionsReferrer = onSnapshot(commissionsAsReferrerQuery, (referrerSnapshot) => {
                 updateEarnings();
            });

            const updateEarnings = async () => {
                const clientCommissionsSnap = await getDocs(commissionsAsClientQuery);
                const referrerCommissionsSnap = await getDocs(commissionsAsReferrerQuery);

                let totalCashback = 0;
                clientCommissionsSnap.forEach(doc => {
                    totalCashback += (doc.data() as Commission).clientCashback || 0;
                });

                let totalReferralRewards = 0;
                referrerCommissionsSnap.forEach(doc => {
                    totalReferralRewards += (doc.data() as Commission).referrerPayout || 0;
                });
                
                setEarnings({ cashback: totalCashback, referralRewards: totalReferralRewards });
                setIsLoadingData(false);
            };

            updateEarnings(); // Initial fetch

            return () => {
                unsubscribeReferrals();
                unsubscribeCommissionsClient();
                unsubscribeCommissionsReferrer();
            };
       } else if (!authLoading && !authUser) {
           console.log("No authenticated user found, redirecting to login.");
           router.push('/login');
       }
   }, [authLoading, authUser, router]);


   const isValidIndianMobileNumber = (number: string) => /^[6-9]\d{9}$/.test(number);
   const isValidUpiId = (id: string) => id.includes('@');

   const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (isSubmittingReferral || !authUser) return;

     if (!isValidIndianMobileNumber(referralNumber)) {
        toast.error('Invalid Mobile Number: Please enter a valid 10-digit Indian mobile number for your friend.');
        return;
    }
     if (!referralCategory) {
         toast.error('Missing Category: Please select the service/product category needed.');
         return;
     }

    setIsSubmittingReferral(true);
    try {
        const referralData: Omit<ClientReferral, 'id'> = {
            referrerClientId: authUser.uid,
            referrerClientName: (authUser as ClientUser).name || authUser.email || 'A friend',
            referredFriendName: referralName.trim(),
            referredFriendMobile: referralNumber,
            requestedCategory: referralCategory,
            status: 'Pending',
            referralDate: serverTimestamp() as Timestamp,
        };

        const docRef = await addDoc(collection(db, "clientReferrals"), referralData);
        console.log("Client referral submitted with ID:", docRef.id);

        toast.success(`Referral Submitted: Referral for ${referralName} sent successfully.`);
        setReferralName('');
        setReferralNumber('');
        setReferralCategory('');
    } catch (error) {
        console.error("Referral submission error:", error);
        toast.error('Error: Failed to submit referral. Please try again.');
    } finally {
        setIsSubmittingReferral(false);
    }
  };

    const handleUpiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser || authUser.role !== 'client' || isSubmittingUpi) return;

        if (!isValidUpiId(upiId)) {
            toast.error('Invalid UPI ID: Please enter a valid UPI ID (e.g., yourname@bank).');
            return;
        }

        setIsSubmittingUpi(true);
        const userRef = doc(db, 'users', authUser.uid);

        try {
            await updateDoc(userRef, { upiId: upiId.trim(), upiVerifiedAt: serverTimestamp() as Timestamp });
            setExistingUpiId(upiId.trim());
            toast.success("UPI ID Saved! You are now eligible for cashback and referral earnings.");
        } catch (error) {
            console.error("Error saving UPI ID:", error);
            toast.error('Error: Failed to save your UPI ID. Please try again.');
        } finally {
            setIsSubmittingUpi(false);
        }
    };

    const clientQrCodeUrl = clientUniqueId ? generateQrCodeDataUrl(`connectify-client-checkin:${clientUniqueId}`) : '';

    const handleDownloadQr = () => {
        if (!clientQrCodeUrl || !clientUniqueId) return;
        const link = document.createElement('a');
        link.href = clientQrCodeUrl;
        link.download = `connectify-hub-qrcode-${clientUniqueId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("QR Code downloading...");
    };

  if (authLoading || !authUser) {
      return (
          <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      );
  }

   if (authUser.role !== 'client') return null;

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Client Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center">
          <CardHeader>
            <CardTitle>Your Check-in Code</CardTitle>
            <CardDescription>Show this to vendors for cashback</CardDescription>
          </CardHeader>
          <CardContent className="relative group">
             {clientUniqueId ? (
                 <>
                    <Image src={clientQrCodeUrl} alt="Client Check-in QR Code" width={200} height={200} className="rounded-md shadow-md transition-all duration-300 group-hover:brightness-50" priority data-ai-hint="qr code" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 rounded-md">
                        <Button variant="ghost" size="sm" onClick={handleDownloadQr} className="text-white hover:bg-white/20 hover:text-white">
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    </div>
                </>
             ) : (
                <div className="h-[200px] w-[200px] bg-muted rounded-md flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                 </div>
             )}
            <p className="text-xs text-muted-foreground mt-2">ID: {clientUniqueId || 'Loading...'}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Earnings Summary</CardTitle>
             <CardDescription>Your total rewards from Connectify Hub.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-md bg-secondary/50 transition-transform hover:scale-105">
               <Gift className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Total Cashback</p>
              {isLoadingData ? <Skeleton className="h-8 w-24 mt-1" /> : <p className="text-2xl font-bold">₹{earnings.cashback.toFixed(2)}</p>}
            </div>
             <div className="flex flex-col items-center p-4 border rounded-md bg-secondary/50 transition-transform hover:scale-105">
               <Users className="h-8 w-8 text-accent mb-2" />
              <p className="text-sm text-muted-foreground">Referral Rewards</p>
              {isLoadingData ? <Skeleton className="h-8 w-24 mt-1" /> : <p className="text-2xl font-bold">₹{earnings.referralRewards.toFixed(2)}</p>}
            </div>
          </CardContent>
           <CardFooter>
                {existingUpiId === undefined ? (
                    <p className="text-xs text-muted-foreground">Loading UPI status...</p>
                ) : !existingUpiId ? (
                    <p className="text-xs text-destructive font-medium">Warning: Please add your UPI ID in the 'Activity & UPI' tab to receive payouts.</p>
                ) : (
                    <p className="text-xs text-green-600 font-medium">Your UPI ID is set up. Payouts will be processed to it.</p>
                )}
           </CardFooter>
        </Card>
      </div>

       <Tabs defaultValue="refer" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="refer">Refer a Friend</TabsTrigger>
          <TabsTrigger value="find">Find Vendors</TabsTrigger>
          <TabsTrigger value="history">Activity & UPI</TabsTrigger>
        </TabsList>

        <TabsContent value="refer">
          <Card>
            <CardHeader><CardTitle>Refer Someone</CardTitle><CardDescription>Enter their details and the service category they need. We'll connect them with a great vendor, and you'll earn rewards!</CardDescription></CardHeader>
            <form onSubmit={handleReferralSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="refNameClient">Friend's Name</Label><Input id="refNameClient" placeholder="John Doe" value={referralName} onChange={(e) => setReferralName(e.target.value)} required disabled={isSubmittingReferral || !authUser}/></div>
                <div className="space-y-1"><Label htmlFor="refNumberClient">Friend's Mobile Number</Label><Input id="refNumberClient" type="tel" placeholder="10-digit mobile number" maxLength={10} pattern="[6-9]{1}[0-9]{9}" title="Please enter a valid 10-digit Indian mobile number." required value={referralNumber} onChange={(e) => setReferralNumber(e.target.value.replace(/[^0-9]/g, ''))} disabled={isSubmittingReferral || !authUser} /></div>
              </div>
               <div className="space-y-1">
                <Label htmlFor="refCategoryClient">Service/Product Category Needed</Label>
                 <Select value={referralCategory} onValueChange={setReferralCategory} required disabled={isSubmittingReferral || !authUser}>
                    <SelectTrigger id="refCategoryClient"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Interior Design">Interior Design</SelectItem><SelectItem value="Electronics">Electronics</SelectItem><SelectItem value="Legal Services">Legal Services</SelectItem><SelectItem value="Healthcare">Healthcare</SelectItem><SelectItem value="Real Estate">Real Estate</SelectItem><SelectItem value="Design">Design</SelectItem><SelectItem value="Plumbing">Plumbing</SelectItem><SelectItem value="Writing & Content">Writing & Content</SelectItem><SelectItem value="Electrician">Electrician</SelectItem><SelectItem value="Catering">Catering</SelectItem><SelectItem value="IT Support">IT Support</SelectItem><SelectItem value="Cleaning Services">Cleaning Services</SelectItem><SelectItem value="Landscaping">Landscaping</SelectItem><SelectItem value="Web Development">Web Development</SelectItem><SelectItem value="Accounting">Accounting</SelectItem><SelectItem value="Marketing">Marketing</SelectItem><SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter><Button type="submit" disabled={isSubmittingReferral || !authUser}>{isSubmittingReferral ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{isSubmittingReferral ? 'Submitting...' : 'Submit Referral'}</Button></CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="find">
           <Card>
            <CardHeader><CardTitle>Search for Vendors</CardTitle><CardDescription>Find services or products near you.</CardDescription></CardHeader>
            <CardContent>
               <div className="flex flex-col sm:flex-row gap-2"><Input placeholder="Search by name, category, or location..." className="flex-1"/><Button type="button" variant="secondary" className="w-full sm:w-auto"><Search className="mr-2 h-4 w-4" /> Search</Button></div>
               <p className="text-sm text-muted-foreground mt-4 text-center">Or <Link href="/providers" className="underline text-primary">browse all vendors</Link>.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid gap-6">
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="h-5 w-5"/> Your UPI ID</CardTitle><CardDescription>Add your UPI ID to receive cashback and referral rewards directly to your bank account.{existingUpiId === undefined ? (<span className="text-muted-foreground"> Loading UPI details...</span>) : !existingUpiId && (<span className="text-destructive"> Rewards cannot be paid out until a valid UPI ID is added.</span>)}</CardDescription></CardHeader>
                 <form onSubmit={handleUpiSubmit}>
                    <CardContent className="space-y-3"><div className="space-y-1"><Label htmlFor="upiIdClient">UPI ID</Label><Input id="upiIdClient" placeholder="yourname@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} required disabled={isSubmittingUpi || !authUser} />{existingUpiId && <p className="text-xs text-green-600">Your UPI ID is saved and eligible for payouts.</p>}</div></CardContent>
                    <CardFooter><Button type="submit" disabled={isSubmittingUpi || upiId === existingUpiId || !authUser}>{isSubmittingUpi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4" />}{isSubmittingUpi ? 'Saving...' : existingUpiId ? 'Update UPI ID' : 'Save UPI ID'}</Button></CardFooter>
                 </form>
             </Card>
            <Card>
                <CardHeader><CardTitle>Your Activity History</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Referral History</h3>
                        <div className="overflow-x-auto">
                            <Table>
                            <TableHeader><TableRow><TableHead>Friend's Name</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Potential Reward</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoadingData && <tr><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></tr>}
                                {!isLoadingData && referralHistory.map((ref) => (
                                <TableRow key={ref.id}><TableCell>{ref.referredFriendName}</TableCell><TableCell>{ref.requestedCategory}</TableCell><TableCell><span className="capitalize">{ref.status}</span></TableCell><TableCell>{ref.referralDate instanceof Timestamp ? format(ref.referralDate.toDate(), 'PP') : 'N/A'}</TableCell><TableCell className="text-right">₹{ref.rewardAmount?.toFixed(2) || '--'}</TableCell></TableRow>
                                ))}
                                {!isLoadingData && referralHistory.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No referrals made yet.</TableCell></TableRow>
                                )}
                            </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Cashback History</h3>
                        <div className="overflow-x-auto">
                            <Table>
                            <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Cashback Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoadingData && <tr><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></tr>}
                                {!isLoadingData && cashbackHistory.map((cb) => (
                                <TableRow key={cb.id}><TableCell>{cb.vendorName}</TableCell><TableCell>{cb.transactionDate instanceof Timestamp ? format(cb.transactionDate.toDate(), 'PP') : 'N/A'}</TableCell><TableCell className="text-right">₹{cb.clientCashback.toFixed(2)}</TableCell></TableRow>
                                ))}
                                {!isLoadingData && cashbackHistory.length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No cashback received yet.</TableCell></TableRow>
                                )}
                            </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
