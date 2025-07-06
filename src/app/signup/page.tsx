
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Briefcase, Smartphone, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithCustomToken,
    type User as FirebaseUser,
} from "firebase/auth";
import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { auth, db, app } from '@/lib/firebase/config';
import type { AppUser, VendorUser } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';


const functions = getFunctions(app);
const sendCustomOtp = httpsCallable(functions, 'sendCustomOtp');
const verifyCustomOtp = httpsCallable(functions, 'verifyCustomOtp');

export default function SignupPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<'role' | 'mobile' | 'otp'>('role');
  const [selectedRole, setSelectedRole] = useState<'client' | 'vendor' | null>(null);

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && authUser) {
      if (authUser.role === 'vendor') {
          if (!(authUser as VendorUser).isActive) {
              router.push('/profile/register/vendor');
              return;
          }
          router.push('/vendor/dashboard');
      } else if (authUser.role === 'client') {
          router.push('/client/dashboard');
      } else if (authUser.role === 'admin') {
          router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [authLoading, authUser, router]);

  const isValidIndianMobileNumber = (number: string) => /^[6-9]\d{9}$/.test(number);

  const handleMobileInputChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    setMobileNumber(digits.substring(0, 10));
  };

  const handleSendOtpForSignup = async () => {
    if (actionLoading || authLoading || !selectedRole) return;
    if (!isValidIndianMobileNumber(mobileNumber)) {
      toast.error('Invalid Mobile Number: Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setActionLoading(true);
    try {
      await sendCustomOtp({ mobileNumber, isSignup: true });
      setCurrentStep('otp');
      toast.success(`OTP Sent: An OTP has been sent to +91${mobileNumber}.`);
    } catch (error: any) {
      console.error("[Signup Page] Error sending OTP:", error);
      toast.error(`OTP Send Failed: ${error.message || 'Please try again.'}`, { duration: 6000 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtpAndSignup = async () => {
    if (actionLoading || authLoading || !selectedRole) return;
    if (!otp || otp.length !== 6) {
      toast.error('Invalid OTP: Please enter the 6-digit OTP.');
      return;
    }
    setActionLoading(true);
    try {
      const result: HttpsCallableResult<any> = await verifyCustomOtp({ mobileNumber, otp, role: selectedRole });
      await signInWithCustomToken(auth, result.data.token);
      toast.success('Signup Successful! Please complete your profile if required.');
      // useAuth hook will handle redirect
    } catch (error: any) {
      console.error("[Signup Page] OTP Verification/Signup error:", error);
      toast.error(`Signup Error: ${error.message || 'Please try again.'}`);
      setActionLoading(false);
      setCurrentStep('mobile');
    }
  };

  const handleGoogleSignup = async () => {
    if (actionLoading || authLoading || !selectedRole) return;
    setActionLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        
        // Check if user document already exists
        const userRef = doc(db, 'users', fbUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            toast.error("Account exists. Please log in.");
            await auth.signOut();
            router.push('/login');
            return;
        }

        // Create new user document
        const newUserDoc: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            mobileNumber: fbUser.phoneNumber || '',
            role: selectedRole,
            createdAt: serverTimestamp() as Timestamp,
            name: fbUser.displayName || 'New User',
            ...(selectedRole === 'vendor' ? { isActive: false } : {}),
        };
        await setDoc(userRef, newUserDoc);
        
        toast.success('Google Signup Successful!');
        // The useAuth hook will detect the signed-in user and the new doc, then redirect.

    } catch (error: any) {
        console.error("[Signup Page] Google Signup error:", error);
        let description = 'Failed to sign up with Google.';
        if (error.code === 'auth/popup-closed-by-user') {
            description = "Sign up process was cancelled.";
        }
        toast.error(`Google Signup Error: ${description}`);
    } finally {
        setActionLoading(false);
    }
};


  const handleRoleSelect = (role: 'client' | 'vendor') => {
    setSelectedRole(role);
    setCurrentStep('mobile');
  };

  const renderRoleSelectionStep = () => (
    <div className="animate-in fade-in duration-500 grid grid-cols-2 gap-4 md:gap-6">
      <Card
        className={cn("cursor-pointer hover:shadow-primary/20 transition-all duration-200 ease-in-out py-6 md:py-8 flex flex-col items-center justify-center text-center", selectedRole === 'client' ? "ring-2 ring-primary shadow-lg" : "hover:ring-1 hover:ring-primary/50")}
        onClick={() => handleRoleSelect('client')}
      >
        <CardHeader className="p-2">
          <User className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-lg md:text-xl">Client</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <CardDescription className="text-xs md:text-sm">I'm looking for services or products.</CardDescription>
        </CardContent>
      </Card>
      <Card
        className={cn("cursor-pointer hover:shadow-primary/20 transition-all duration-200 ease-in-out py-6 md:py-8 flex flex-col items-center justify-center text-center", selectedRole === 'vendor' ? "ring-2 ring-primary shadow-lg" : "hover:ring-1 hover:ring-primary/50")}
        onClick={() => handleRoleSelect('vendor')}
      >
        <CardHeader className="p-2">
          <Briefcase className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-lg md:text-xl">Vendor</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <CardDescription className="text-xs md:text-sm">I want to offer my services or products.</CardDescription>
        </CardContent>
      </Card>
    </div>
  );

  const renderMobileInputStep = () => (
    <div className="animate-in fade-in duration-500 grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="mobile-signup">Mobile Number</Label>
        <Input id="mobile-signup" type="tel" placeholder="Enter 10-digit mobile number" value={mobileNumber} onChange={(e) => handleMobileInputChange(e.target.value)} disabled={actionLoading} />
        {!isValidIndianMobileNumber(mobileNumber) && mobileNumber.length > 0 && (<p className="text-xs text-destructive">Enter a valid 10-digit Indian mobile number.</p>)}
      </div>
      <Button className="w-full" onClick={handleSendOtpForSignup} disabled={actionLoading || authLoading || !isValidIndianMobileNumber(mobileNumber)}><Smartphone className="mr-2 h-4 w-4" /> Send OTP</Button>
      
      <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">OR</span></div></div>
      <Button variant="secondary" className="w-full" onClick={handleGoogleSignup} disabled={actionLoading || authLoading}>
        <svg className="mr-2 h-4 w-4" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.20455C17.64 8.56636 17.5834 7.95273 17.4702 7.36364H9V10.845H13.8436C13.635 11.9727 13.0014 12.9109 12.0455 13.5491V15.8318H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"></path><path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8318L12.0455 13.5491C11.2391 14.0918 10.2259 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8395 3.96409 10.71H0.957275V13.085C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"></path><path d="M3.96409 10.71C3.78409 10.1768 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.82318 3.96409 7.29L0.957275 4.91455C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0855L3.96409 10.71Z" fill="#FBBC05"></path><path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.91455L3.96409 7.29C4.67182 5.16045 6.65591 3.57955 9 3.57955Z" fill="#EA4335"></path></svg>
        Sign up with Google
      </Button>

      <Button variant="link" size="sm" onClick={() => setCurrentStep('role')} disabled={actionLoading}>Back to Role Selection</Button>
    </div>
  );

  const renderOtpInputStep = () => (
    <div className="animate-in fade-in duration-500 grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="otp-signup">Enter OTP</Label>
        <Input id="otp-signup" type="text" maxLength={6} placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} disabled={actionLoading} />
      </div>
      <Button className="w-full" onClick={handleVerifyOtpAndSignup} disabled={actionLoading || authLoading || otp.length !== 6}><KeyRound className="mr-2 h-4 w-4" /> Verify OTP & Sign Up</Button>
      <Button variant="link" size="sm" onClick={() => {setCurrentStep('mobile');}} disabled={actionLoading}>Change Mobile or Resend OTP</Button>
    </div>
  );

  if (authLoading || (!authLoading && authUser)) {
    return (<div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>);
  }

  return (
    <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-orbitron tracking-tight">SIGN UP</CardTitle>
          {currentStep === 'role' && <CardDescription className="text-muted-foreground">Choose your role on Connectify Hub.</CardDescription>}
          {currentStep === 'mobile' && <CardDescription className="text-muted-foreground">Enter your mobile number to continue as a {selectedRole}.</CardDescription>}
          {currentStep === 'otp' && <CardDescription className="text-muted-foreground">Enter the 6-digit OTP sent to +91{mobileNumber}.</CardDescription>}
        </CardHeader>
        <CardContent className="grid gap-6 px-6 pb-6 pt-2">
          {actionLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {currentStep === 'role' && renderRoleSelectionStep()}
          {currentStep === 'mobile' && renderMobileInputStep()}
          {currentStep === 'otp' && renderOtpInputStep()}
        </CardContent>
        {(currentStep === 'mobile' || currentStep === 'otp') && (
          <CardFooter className="text-center text-sm text-muted-foreground pt-0 pb-6 px-6">
            <p className="w-full">Already have an account? <Link href="/login" className="underline hover:text-primary">Login</Link></p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
