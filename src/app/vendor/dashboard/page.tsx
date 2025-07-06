
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 
import { Camera, ScanLine, Upload, Users, IndianRupee, Send, QrCode, Loader2 } from 'lucide-react'; 
import toast from 'react-hot-toast';
import Image from 'next/image'; 
import { db, storage } from '@/lib/firebase/config'; 
import { collection, addDoc, serverTimestamp, Timestamp, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { CashTransaction, ClientCheckin, Commission, VendorReferral, VendorUser } from '@/types'; 
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';


const generateQrCodeDataUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

export default function VendorDashboardPage() {
  const { user: authUser, loading: authLoading, registrationStatus } = useAuth();
  const router = useRouter();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false); 
  const videoRef = useRef<HTMLVideoElement>(null);

  const [referralName, setReferralName] = useState('');
  const [referralNumber, setReferralNumber] = useState('');
  const [referralCategory, setReferralCategory] = useState('');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false); 

  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingCash, setIsUploadingCash] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null); 

  // Dynamic Data State
  const [stats, setStats] = useState({
    walkinsToday: 0,
    walkinEarnings: 0,
    referralsMade: 0,
    referralEarnings: 0,
  });
  const [recentCheckins, setRecentCheckins] = useState<ClientCheckin[]>([]);
  const [vendorReferrals, setVendorReferrals] = useState<VendorReferral[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace('/login');
      return;
    }
    if (authUser.role !== 'vendor') {
      if (authUser.role === 'client') router.replace('/client/dashboard');
      else if (authUser.role === 'admin') router.replace('/admin/dashboard');
      else router.replace('/');
      return;
    }
    const vendorUser = authUser as VendorUser;
    if (!vendorUser.isActive) {
      if (registrationStatus === 'Pending') router.replace('/profile/register/pending');
      else router.replace('/profile/register/vendor');
      return;
    }

    setIsLoadingData(true);

    // Set up listeners for all dynamic data
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // Query for check-ins today to count walk-ins
    const checkinsTodayQuery = query(collection(db, "clientCheckins"), 
        where("vendorId", "==", authUser.uid),
        where("checkinTime", ">=", Timestamp.fromDate(todayStart)),
        where("checkinTime", "<=", Timestamp.fromDate(todayEnd))
    );
    const unsubCheckinsToday = onSnapshot(checkinsTodayQuery, (snapshot) => {
        setStats(prev => ({ ...prev, walkinsToday: snapshot.size }));
    });
    
    // Query for walk-in and referral earnings from commissions
    const commissionsWalkinQuery = query(collection(db, "commissions"), where("vendorId", "==", authUser.uid));
    const unsubWalkinEarnings = onSnapshot(commissionsWalkinQuery, (snapshot) => {
        let total = 0;
        snapshot.forEach(doc => {
            total += (doc.data() as Commission).vendorPayout || 0;
        });
        setStats(prev => ({ ...prev, walkinEarnings: total }));
    });

    const commissionsReferralQuery = query(collection(db, "commissions"), where("referrerId", "==", authUser.uid));
    const unsubReferralEarnings = onSnapshot(commissionsReferralQuery, (snapshot) => {
        let total = 0;
        snapshot.forEach(doc => {
            total += (doc.data() as Commission).referrerPayout || 0;
        });
        setStats(prev => ({ ...prev, referralEarnings: total }));
    });

    // Query for referral history and count
    const referralsQuery = query(collection(db, "vendorReferrals"), where("referrerVendorId", "==", authUser.uid), orderBy("referralDate", "desc"));
    const unsubReferrals = onSnapshot(referralsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, referralsMade: snapshot.size }));
        setVendorReferrals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorReferral)));
    });

    // Query for recent check-ins table
    const qRecentCheckins = query(collection(db, "clientCheckins"), where("vendorId", "==", authUser.uid), orderBy("checkinTime", "desc"), limit(5));
    const unsubRecentCheckins = onSnapshot(qRecentCheckins, (snapshot) => {
        setRecentCheckins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientCheckin)));
        if (isLoadingData) setIsLoadingData(false);
    }, (error) => {
        console.error("Error fetching recent check-ins:", error);
        toast.error("Could not load recent check-ins.");
        setIsLoadingData(false);
    });

    return () => {
        unsubCheckinsToday();
        unsubWalkinEarnings();
        unsubReferralEarnings();
        unsubReferrals();
        unsubRecentCheckins();
    };

  }, [authLoading, authUser, registrationStatus, router]);


   useEffect(() => {
        if (!isScanning) {
            if (videoRef.current?.srcObject) {
                 (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                 videoRef.current.srcObject = null;
                 setHasCameraPermission(null); 
            }
            return;
        }

        const getCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); 
            setHasCameraPermission(true);

            if (videoRef.current) {
            videoRef.current.srcObject = stream;
             startScanning(); 
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast.error('Camera Access Denied: Please enable camera permissions in your browser settings to scan QR codes.');
            setIsScanning(false); 
        }
        };

        getCameraPermission();

        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
  }, [isScanning]); 


  const startScanning = () => {
    console.log("Scanning started...");
    const intervalId = setInterval(() => {
        if (Math.random() > 0.95) { 
            const fakeScanData = `connectify-client-checkin:CLIENT${Math.floor(Math.random() * 1000)}`;
            setScannedData(fakeScanData);
            toast.success(`QR Code Scanned! Data: ${fakeScanData}`);
            setIsScanning(false); 
             console.log("Processing check-in for:", fakeScanData);
             clearInterval(intervalId); 
        }
    }, 1000);

     return () => clearInterval(intervalId);
  };

  const isValidIndianMobileNumber = (number: string) => {
    return /^[6-9]\d{9}$/.test(number); 
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReferral || !authUser) return; 

    if (!isValidIndianMobileNumber(referralNumber)) {
        toast.error("Invalid Mobile Number: Please enter the client's valid 10-digit Indian mobile number.");
        return;
    }
     if (!referralCategory) {
         toast.error('Missing Category: Please select the service/product category needed.');
         return;
     }

    setIsSubmittingReferral(true);
    try {
        const referralData: Omit<VendorReferral, 'id'> = {
            referrerVendorId: authUser.uid,
            referrerVendorName: (authUser as VendorUser).businessName || authUser.name || '', 
            referredClientName: referralName.trim(),
            referredClientMobile: referralNumber,
            requestedCategory: referralCategory,
            status: 'Pending', 
            referralDate: serverTimestamp() as Timestamp, 
            connectionEstablished: false,
            transactionCompleted: false,
        };

        const docRef = await addDoc(collection(db, "vendorReferrals"), referralData);
        console.log("Vendor referral submitted with ID:", docRef.id);

        toast.success(`Referral Submitted: Referral for ${referralName} in category ${referralCategory} sent successfully.`);
        setReferralName('');
        setReferralNumber('');
        setReferralCategory('');
    } catch (error) {
         console.error("Vendor referral submission error:", error);
         toast.error('Error: Failed to submit referral. Please try again.');
    } finally {
        setIsSubmittingReferral(false);
    }
  };

  const handleCashReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const file = e.target.files?.[0];
       if (file) {
           if (file.size > 5 * 1024 * 1024) { 
               toast.error('File Too Large: Receipt image/PDF must be under 5MB.');
               setReceiptFile(null);
               e.target.value = ''; 
               return;
           }
           setReceiptFile(file);
       } else {
           setReceiptFile(null);
       }
   };


   const handleCashSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser || isUploadingCash || !receiptFile || !cashAmount) {
            if (!receiptFile) toast.error('Missing Receipt: Please upload a receipt file.');
            if (!cashAmount) toast.error('Missing Amount: Please enter the amount received.');
            return;
        }
        const amount = parseFloat(cashAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Invalid Amount: Please enter a valid positive amount.');
            return;
        }


        setIsUploadingCash(true);
        try {
            const storageRefVal = ref(storage, `cashReceipts/${authUser.uid}/${Date.now()}_${receiptFile.name}`);
            const uploadResult = await uploadBytes(storageRefVal, receiptFile);
            const receiptUrl = await getDownloadURL(uploadResult.ref);
            console.log('Receipt uploaded to:', receiptUrl);

            const cashTransactionData: Omit<CashTransaction, 'id'> = {
                vendorId: authUser.uid,
                vendorName: (authUser as VendorUser).businessName || authUser.name || '',
                clientId: scannedData ? scannedData.replace('connectify-client-checkin:', '') : undefined,
                billAmount: amount,
                receiptUrl: receiptUrl,
                submittedAt: serverTimestamp() as any, 
                status: 'Pending Verification', 
                clientVerified: null, 
                clientVerificationTimestamp: undefined,
            };

            await addDoc(collection(db, "cashTransactions"), cashTransactionData);

             if (scannedData) {
                console.log(`Notification simulation: Sent verification request to client ${scannedData} for amount ${amount}`);
             }

             toast.success("Cash Transaction Submitted: Receipt uploaded. Pending client and admin verification.");

            setIsCashModalOpen(false);
            setCashAmount('');
            setReceiptFile(null);
            if (receiptInputRef.current) receiptInputRef.current.value = ''; 

        } catch (error) {
             console.error("Error submitting cash transaction:", error);
             toast.error('Submission Failed: Could not submit cash transaction details.');
        } finally {
             setIsUploadingCash(false);
        }
   };

  const vendorPaymentQrCodeUrl = authUser ? generateQrCodeDataUrl(`connectify-vendor-payment:${authUser.uid}`) : '';
  
  if (authLoading || !authUser || authUser.role !== 'vendor' || !(authUser as VendorUser).isActive) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying vendor access...</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Vendor Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" /> Client Check-in
                </CardTitle>
                <CardDescription>Scan client QR code to log their visit.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                {!isScanning ? (
                 <Button onClick={() => setIsScanning(true)} className="w-full">
                     <ScanLine className="mr-2 h-4 w-4" /> Start Scanner
                 </Button>
                 ) : (
                 <div className="w-full relative aspect-video overflow-hidden rounded-md bg-muted"> 
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                        <div className="absolute left-0 h-1.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-scanline"></div>
                    </div>
                 </div>
                 )}

                {hasCameraPermission === false && !isScanning && (
                    <Alert variant="destructive" className="mt-4 w-full">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use the scanner.
                    </AlertDescription>
                    </Alert>
                )}
                 {scannedData && (
                     <Alert variant="default" className="mt-4 w-full">
                         <AlertTitle>Scan Successful</AlertTitle>
                         <AlertDescription className="break-all">
                            Checked in: {scannedData.replace('connectify-client-checkin:', '')}
                         </AlertDescription>
                     </Alert>
                 )}

                 <div className="mt-4 w-full text-center">
                    <Button variant="link" size="sm" className="p-0 h-auto underline text-sm text-muted-foreground hover:text-primary" onClick={() => setIsCashModalOpen(true)}>
                        Upload receipt for cash payment
                    </Button>
                 </div>

            </CardContent>
             <CardFooter>
                 {isScanning && (
                    <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full">Cancel Scan</Button>
                 )}
            </CardFooter>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
            <CardDescription>Summary of your activity on Connectify Hub.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="flex flex-col items-center p-4 border rounded-md bg-secondary/50">
               <Users className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Walk-ins (Today)</p>
              {isLoadingData ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold">{stats.walkinsToday}</p>}
            </div>
             <div className="flex flex-col items-center p-4 border rounded-md bg-secondary/50">
               <IndianRupee className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Total Walk-in Earnings</p>
              {isLoadingData ? <Skeleton className="h-8 w-24 mt-1" /> : <p className="text-2xl font-bold">₹{stats.walkinEarnings.toFixed(2)}</p>}
            </div>
              <div className="flex flex-col items-center p-4 border rounded-md bg-secondary/50">
               <Send className="h-8 w-8 text-accent mb-2" />
              <p className="text-sm text-muted-foreground">Total Referrals Made</p>
              {isLoadingData ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-bold">{stats.referralsMade}</p>}
            </div>
             <div className="flex flex-col items-center p-4 border rounded-md bg-secondary/50">
               <IndianRupee className="h-8 w-8 text-accent mb-2" />
              <p className="text-sm text-muted-foreground">Total Referral Earnings</p>
              {isLoadingData ? <Skeleton className="h-8 w-24 mt-1" /> : <p className="text-2xl font-bold">₹{stats.referralEarnings.toFixed(2)}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="refer">Refer Client</TabsTrigger>
          <TabsTrigger value="payment">Payment QR</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
           <Card>
            <CardHeader>
              <CardTitle>Recent Check-ins & Referrals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div>
                    <h3 className="text-lg font-semibold mb-2">Recent Client Check-ins</h3>
                     <div className="overflow-x-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Client ID</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingData && [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
                                {!isLoadingData && recentCheckins.map((checkin) => (
                                <TableRow key={checkin.id}>
                                    <TableCell className="font-medium truncate max-w-[150px]">{checkin.clientId}</TableCell>
                                    <TableCell>{checkin.checkinTime instanceof Timestamp ? format(checkin.checkinTime.toDate(), 'p') : 'N/A'}</TableCell>
                                    <TableCell>{checkin.checkinTime instanceof Timestamp ? format(checkin.checkinTime.toDate(), 'PP') : 'N/A'}</TableCell>
                                    <TableCell><span className="capitalize">{checkin.status}</span></TableCell>
                                </TableRow>
                                ))}
                                {!isLoadingData && recentCheckins.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No recent check-ins.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Your Referrals</h3>
                    <div className="overflow-x-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Client Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Potential Commission</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingData && [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
                                {!isLoadingData && vendorReferrals.map((referral) => (
                                <TableRow key={referral.id}>
                                    <TableCell>{referral.referredClientName}</TableCell>
                                    <TableCell>{referral.requestedCategory}</TableCell>
                                    <TableCell><span className="capitalize">{referral.status}</span></TableCell>
                                    <TableCell>{referral.referralDate instanceof Timestamp ? format(referral.referralDate.toDate(), 'PP') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">₹{referral.commissionAmount?.toFixed(2) || '--'}</TableCell>
                                </TableRow>
                                ))}
                                {!isLoadingData && vendorReferrals.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No referrals made yet.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refer">
          <Card>
            <CardHeader>
              <CardTitle>Refer a Client to Another Vendor</CardTitle>
              <CardDescription>
                 Help a client find a service you don't offer and earn a commission if they connect through the Hub.
              </CardDescription>
            </CardHeader>
             <form onSubmit={handleReferralSubmit}>
                <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                    <Label htmlFor="refClientNameVendor">Client's Name</Label>
                    <Input id="refClientNameVendor" placeholder="Jane Smith" value={referralName} onChange={(e) => setReferralName(e.target.value)} required disabled={isSubmittingReferral}/>
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="refClientNumberVendor">Client's Mobile Number</Label>
                    <Input
                        id="refClientNumberVendor"
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength={10} 
                        pattern="[6-9]{1}[0-9]{9}" 
                        title="Please enter a valid 10-digit Indian mobile number."
                        required
                        value={referralNumber}
                        onChange={(e) => setReferralNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                        disabled={isSubmittingReferral}
                     />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="refClientCategoryVendor">Service/Product Category Needed</Label>
                    <Select value={referralCategory} onValueChange={setReferralCategory} required disabled={isSubmittingReferral}>
                        <SelectTrigger id="refClientCategoryVendor">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Interior Design">Interior Design</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Legal Services">Legal Services</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Real Estate">Real Estate</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Plumbing">Plumbing</SelectItem>
                            <SelectItem value="Writing & Content">Writing & Content</SelectItem>
                            <SelectItem value="Electrician">Electrician</SelectItem>
                            <SelectItem value="Catering">Catering</SelectItem>
                            <SelectItem value="IT Support">IT Support</SelectItem>
                            <SelectItem value="Cleaning Services">Cleaning Services</SelectItem>
                            <SelectItem value="Landscaping">Landscaping</SelectItem>
                            <SelectItem value="Web Development">Web Development</SelectItem>
                            <SelectItem value="Accounting">Accounting</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                </CardContent>
                <CardFooter>
                <Button type="submit" disabled={isSubmittingReferral}>
                    {isSubmittingReferral ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isSubmittingReferral ? 'Submitting...' : 'Submit Referral'}
                </Button>
                </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="flex flex-col items-center justify-center text-center">
            <CardHeader className="text-center w-full">
                <CardTitle>Your Payment QR Code</CardTitle>
                <CardDescription>
                   Show this QR code for client UPI payments.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                 {vendorPaymentQrCodeUrl ? (
                    <Image
                        src={vendorPaymentQrCodeUrl}
                        alt="Vendor Payment QR Code"
                        width={250}
                        height={250}
                        className="rounded-md shadow-lg"
                        data-ai-hint="payment qr code"
                        priority
                    />
                 ) : (
                    <Skeleton className="h-[250px] w-[250px]" />
                 )}
                <p className="text-xs text-muted-foreground mt-3">Payment ID: {authUser.uid}</p>
            </CardContent>
            <CardFooter>
                <Button variant="outline"><QrCode className="mr-2 h-4 w-4" /> Download QR Code</Button>
            </CardFooter>
            </Card>
        </TabsContent>

      </Tabs>


       <Dialog open={isCashModalOpen} onOpenChange={setIsCashModalOpen}>
         <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
                 <DialogTitle>Upload Cash Payment Details</DialogTitle>
                 <DialogDescription>
                     Enter the amount received and upload the receipt for verification.
                 </DialogDescription>
             </DialogHeader>
             <form onSubmit={handleCashSubmit}>
                 <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="cashAmount" className="text-right col-span-1">
                             Amount
                         </Label>
                         <div className="relative col-span-3">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                 id="cashAmount"
                                 type="number"
                                 placeholder="Amount received"
                                 value={cashAmount}
                                 onChange={(e) => setCashAmount(e.target.value)}
                                 required
                                 min="0.01" 
                                 step="0.01"
                                 className="pl-8" 
                                 disabled={isUploadingCash}
                              />
                          </div>
                     </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="receipt" className="text-right col-span-1">
                             Receipt
                         </Label>
                         <Input
                              id="receipt"
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleCashReceiptFileChange}
                              required
                              className="col-span-3"
                              ref={receiptInputRef}
                              disabled={isUploadingCash}
                          />
                     </div>
                 </div>
                 <DialogFooter>
                     <Button type="button" variant="outline" onClick={() => setIsCashModalOpen(false)} disabled={isUploadingCash}>Cancel</Button>
                     <Button type="submit" disabled={isUploadingCash || !receiptFile || !cashAmount}>
                          {isUploadingCash ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {isUploadingCash ? 'Submitting...' : 'Submit for Verification'}
                     </Button>
                 </DialogFooter>
             </form>
         </DialogContent>
       </Dialog>

    </div>
  );
}
