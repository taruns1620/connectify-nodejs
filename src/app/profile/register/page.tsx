
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithCustomToken,
} from "firebase/auth";
import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { auth, app } from '@/lib/firebase/config';
import type { VendorUser } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const functions = getFunctions(app);
const sendCustomOtp = httpsCallable(functions, 'sendCustomOtp');
const verifyCustomOtp = httpsCallable(functions, 'verifyCustomOtp');

export default function RegisterPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, registrationStatus: authRegStatus } = useAuth();

  const [role, setRole] = useState<'client' | 'vendor'>('client');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setIsAuthCheckComplete(true);
      if (authUser) {
        console.log("[Register Page] User already logged in, determining redirect path...");
        if (authRegStatus === 'Pending') {
          router.push('/profile/register/pending');
        } else if (authRegStatus === 'Rejected') {
          router.push('/profile/register'); 
        } else if (authUser.role === 'client') {
          router.push('/client/dashboard');
        } else if (authUser.role === 'vendor') {
          router.push((authUser as VendorUser).isActive ? '/vendor/dashboard' : '/profile/register/vendor');
        } else if (authUser.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      }
    }
  }, [authLoading, authUser, authRegStatus, router]);

  const isValidIndianMobileNumber = (number: string) => /^[6-9]\d{9}$/.test(number);

  const handleMobileInputChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    setMobileNumber(digits.substring(0, 10));
  };

  const handleSendOtpForSignup = async () => {
    if (isLoading || authLoading) return;
    if (!isValidIndianMobileNumber(mobileNumber)) {
      toast.error('Invalid Mobile Number: Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      await sendCustomOtp({ mobileNumber, isSignup: true });
      setIsOtpSent(true);
      toast.success(`OTP Sent: An OTP has been sent to +91${mobileNumber}.`);
    } catch (error: any) {
      toast.error(`OTP Send Failed: ${error.message || 'Please try again.'}`, { duration: 6000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndSignup = async () => {
    if (isLoading || authLoading) return;
    if (!otp || otp.length !== 6) {
      toast.error('Invalid OTP: Please enter the 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    try {
      const result: HttpsCallableResult<any> = await verifyCustomOtp({ mobileNumber, otp, role });
      await signInWithCustomToken(auth, result.data.token);
      toast.success('Signup Successful!');
    } catch (error: any) {
      toast.error(`Signup Error: ${error.message || 'Please try again.'}`);
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (isLoading || authLoading) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      const verifyResult: HttpsCallableResult<any> = await verifyCustomOtp({ 
          mobileNumber: fbUser.phoneNumber?.slice(3) || "0000000000",
          otp: 'google-signup',
          role: role,
          googleUser: {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              phoneNumber: fbUser.phoneNumber,
          }
      });
      await signInWithCustomToken(auth, verifyResult.data.token);
      toast.success('Google Signup Successful!');
    } catch (error: any) {
      toast.error(`Google Signup Error: ${error.message || 'Please try again.'}`);
      setIsLoading(false);
    }
  };

  if (!isAuthCheckComplete || authLoading || (authUser && isAuthCheckComplete)) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        {authUser && <p className="ml-4 text-muted-foreground">Redirecting...</p>}
      </div>
    );
  }

  return (
    <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create your Connectify Hub account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>I want to join as a:</Label>
            <RadioGroup defaultValue="client" value={role} onValueChange={(value: 'client' | 'vendor') => setRole(value)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="r1-signup" disabled={isLoading || isOtpSent} />
                <Label htmlFor="r1-signup">Client</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vendor" id="r2-signup" disabled={isLoading || isOtpSent} />
                <Label htmlFor="r2-signup">Vendor</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mobile-signup">Mobile Number</Label>
            <Input
              id="mobile-signup" type="tel" placeholder="Enter your 10-digit mobile number"
              value={mobileNumber} onChange={(e) => handleMobileInputChange(e.target.value)}
              disabled={isLoading || isOtpSent}
            />
          </div>
          {isOtpSent && (
            <div className="grid gap-2">
              <Label htmlFor="otp-signup">Enter OTP</Label>
              <Input
                id="otp-signup" type="text" maxLength={6} placeholder="Enter 6-digit OTP"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isLoading}
              />
            </div>
          )}
          {!isOtpSent ? (
            <Button className="w-full" onClick={handleSendOtpForSignup} disabled={isLoading || authLoading || !isValidIndianMobileNumber(mobileNumber)}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
          ) : (
            <Button className="w-full" onClick={handleVerifyOtpAndSignup} disabled={isLoading || authLoading || otp.length !== 6}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP & Sign Up
            </Button>
          )}
          {isOtpSent && (
            <Button variant="link" size="sm" onClick={() => setIsOtpSent(false)} disabled={isLoading}>
              Change Mobile Number or Resend OTP
            </Button>
          )}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
          </div>
          <Button variant="secondary" className="w-full" onClick={handleGoogleSignup} disabled={isLoading || authLoading || isOtpSent}>
            <svg className="mr-2 h-4 w-4" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.20455C17.64 8.56636 17.5834 7.95273 17.4702 7.36364H9V10.845H13.8436C13.635 11.9727 13.0014 12.9109 12.0455 13.5491V15.8318H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"></path><path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8318L12.0455 13.5491C11.2391 14.0918 10.2259 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8395 3.96409 10.71H0.957275V13.085C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"></path><path d="M3.96409 10.71C3.78409 10.1768 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.82318 3.96409 7.29L0.957275 4.91455C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0855L3.96409 10.71Z" fill="#FBBC05"></path><path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.91455L3.96409 7.29C4.67182 5.16045 6.65591 3.57955 9 3.57955Z" fill="#EA4335"></path></svg>
            Sign up with Google
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <Link href="/login" className="underline hover:text-primary">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
