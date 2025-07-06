
'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithCustomToken,
    type User as FirebaseUser,
} from 'firebase/auth';
import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { auth, db, app } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { AppUser, VendorUser, ClientUser } from '@/types';

const functions = getFunctions(app);
const sendCustomOtp = httpsCallable(functions, 'sendCustomOtp');
const verifyCustomOtp = httpsCallable(functions, 'verifyCustomOtp');

export default function LoginPage() {
  const router = useRouter();
  const { user: authUser, firebaseUser, loading: authLoading, registrationStatus: authRegStatus, logout } = useAuth();

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleLoginRedirect = useCallback((currentAppUser: AppUser | null, currentRegStatus: string | null, currentFbUser: FirebaseUser | null) => {
    setActionLoading(false);
    if (!currentFbUser) {
        return;
    }

    if (currentRegStatus === 'Pending') {
      router.push('/profile/register/pending');
      return;
    }
    if (currentRegStatus === 'Rejected') {
      toast.error('Registration Rejected: Your registration was not approved. Contact support.', { duration: 5000 });
      logout();
      return;
    }

    if (currentAppUser) {
      if (currentAppUser.role === 'client') router.push('/client/dashboard');
      else if (currentAppUser.role === 'vendor') {
        const vendorUser = currentAppUser as VendorUser;
        if (vendorUser.isActive) router.push('/vendor/dashboard');
        else router.push('/profile/register/vendor');
      } else if (currentAppUser.role === 'admin') router.push('/admin/dashboard');
      else router.push('/');
    }
  }, [router, logout]);

  const createUserDocument = async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      console.log(`[Login Page] Profile already exists for ${firebaseUser.uid}. No action needed.`);
      return;
    }
    const newUser: ClientUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      mobileNumber: firebaseUser.phoneNumber || '',
      role: 'client', // Default to client for logins
      name: firebaseUser.displayName || 'New User',
      createdAt: serverTimestamp() as Timestamp,
    };
    await setDoc(userRef, newUser);
    console.log(`[Login Page] Default client profile created for ${firebaseUser.uid}.`);
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (authUser) {
      handleLoginRedirect(authUser, authRegStatus, firebaseUser);
    } else if (firebaseUser && !authUser) {
      setActionLoading(true);
      createUserDocument(firebaseUser)
        .catch((err) => {
          console.error("Error creating default profile on login:", err);
          logout();
        })
        .finally(() => {
          // The useAuth hook will now pick up the new user and trigger the redirect.
        });
    }
  }, [authLoading, authUser, firebaseUser, authRegStatus, handleLoginRedirect, logout]);

  const isValidIndianMobileNumber = (number: string) => /^[6-9]\d{9}$/.test(number);

  const handleMobileInputChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    setMobileNumber(digits.substring(0, 10));
  };


  const handleSendOtp = async () => {
    if (actionLoading || authLoading) return;
    if (!isValidIndianMobileNumber(mobileNumber)) {
      toast.error('Invalid Mobile Number: Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setActionLoading(true);
    try {
      await sendCustomOtp({ mobileNumber, isSignup: false });
      setIsOtpSent(true);
      toast.success(`OTP Sent: An OTP has been sent to +91${mobileNumber}.`);
    } catch (error: any) {
      console.error("[Login Page] Error sending OTP:", error);
      toast.error(`OTP Send Failed: ${error.message || 'Please try again.'}`, { duration: 6000 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (actionLoading || authLoading) return;
    if (!otp || otp.length !== 6) {
      toast.error('Invalid OTP: Please enter the 6-digit OTP.');
      return;
    }
    setActionLoading(true);
    try {
      const result: HttpsCallableResult<any> = await verifyCustomOtp({ mobileNumber, otp });
      await signInWithCustomToken(auth, result.data.token);
    } catch (error: any) {
      console.error("[Login Page] OTP Verification error:", error);
      toast.error(`OTP Verification Error: ${error.message || 'Please try again.'}`);
      if (error.code === 'functions/deadline-exceeded') {
          setIsOtpSent(false);
          setOtp('');
      }
      setActionLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    if (actionLoading || authLoading) return;
    setActionLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("[Login Page] Google Login error:", error);
      let description = 'Failed to login with Google.';
      if (error.code === 'auth/account-exists-with-different-credential') description = 'Account exists with this email using a different sign-in method.';
      if (error.code === 'auth/popup-closed-by-user') description = 'Google Sign-in popup closed.';
      toast.error(`Google Login Error: ${description}`);
      setActionLoading(false);
    }
  };

  if (authLoading || actionLoading || (firebaseUser && !authUser)) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
         <p className="ml-4 text-muted-foreground">Logging in...</p>
      </div>
    );
  }

  if (firebaseUser && authUser) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Access your Connectify Hub account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile" type="tel" placeholder="Enter 10-digit mobile number"
              pattern="[6-9]{1}[0-9]{9}"
              title="Please enter a valid 10-digit Indian mobile number."
              required value={mobileNumber}
              onChange={(e) => handleMobileInputChange(e.target.value)}
              disabled={actionLoading || isOtpSent}
            />
            {!isOtpSent && !isValidIndianMobileNumber(mobileNumber) && mobileNumber.length > 0 && (
                <p className="text-xs text-destructive">Enter a valid 10-digit Indian mobile number.</p>
            )}
          </div>

          {isOtpSent && (
            <div className="grid gap-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp" type="text" maxLength={6} pattern="\d{6}"
                placeholder="Enter 6-digit OTP" required value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={actionLoading}
              />
            </div>
          )}

          {!isOtpSent ? (
            <Button className="w-full" onClick={handleSendOtp} disabled={actionLoading || authLoading || !isValidIndianMobileNumber(mobileNumber)}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
          ) : (
            <Button className="w-full" onClick={handleVerifyOtp} disabled={actionLoading || otp.length !== 6}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP & Login
            </Button>
          )}
          {isOtpSent && (
            <Button variant="link" size="sm" onClick={() => { setIsOtpSent(false); setOtp(''); }} disabled={actionLoading}>
              Change Mobile Number or Resend OTP
            </Button>
          )}

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

           <Button variant="secondary" className="w-full" onClick={handleGoogleLogin} disabled={actionLoading || isOtpSent}>
             {actionLoading && !mobileNumber.trim() && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             <svg className="mr-2 h-4 w-4" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.20455C17.64 8.56636 17.5834 7.95273 17.4702 7.36364H9V10.845H13.8436C13.635 11.9727 13.0014 12.9109 12.0455 13.5491V15.8318H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"></path><path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8318L12.0455 13.5491C11.2391 14.0918 10.2259 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8395 3.96409 10.71H0.957275V13.085C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"></path><path d="M3.96409 10.71C3.78409 10.1768 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.82318 3.96409 7.29L0.957275 4.91455C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0855L3.96409 10.71Z" fill="#FBBC05"></path><path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.91455L3.96409 7.29C4.67182 5.16045 6.65591 3.57955 9 3.57955Z" fill="#EA4335"></path></svg>
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="underline hover:text-primary">Sign Up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
