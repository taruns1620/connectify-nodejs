
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
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const functions = getFunctions(app);
const sendCustomOtp = httpsCallable(functions, 'sendCustomOtp');
const verifyCustomOtp = httpsCallable(functions, 'verifyCustomOtp');

export default function AdminLoginPage() {
  const router = useRouter();
  const { user: authUser, firebaseUser, loading: authLoading, logout } = useAuth();

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isReadyToRenderForm, setIsReadyToRenderForm] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setIsReadyToRenderForm(false);
      return;
    }

    if (authUser) {
      if (authUser.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      } else {
        logout(false);
        toast.error("Access Denied: You are not an admin.", { duration: 6000 });
        setIsReadyToRenderForm(false);
        return;
      }
    } else if (firebaseUser) {
      logout(false);
      toast.info("Please log in with admin credentials.", { duration: 6000 });
      setIsReadyToRenderForm(false);
      return;
    }
    
    setIsReadyToRenderForm(true);
  }, [authLoading, authUser, firebaseUser, router, logout]);

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
      // We check for admin role on the backend during verification, not here.
      // But we can do a preliminary check to give faster feedback.
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("mobileNumber", "==", mobileNumber), where("role", "==", "admin"), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast.error('Admin Not Found: No admin user is registered with this mobile number.', { duration: 4000 });
        setActionLoading(false);
        return;
      }

      await sendCustomOtp({ mobileNumber, isSignup: false });
      setIsOtpSent(true);
      toast.success(`OTP Sent: An OTP has been sent to +91${mobileNumber}.`);
    } catch (error: any) {
      console.error("[AdminLogin] Error sending OTP:", error);
      toast.error(`OTP Send Failed: ${error.message || 'Please try again.'}`, { duration: 10000 });
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
      console.error("[AdminLogin] OTP Verification error:", error);
      toast.error(`OTP Verification Error: ${error.message || 'Please try again.'}`);
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
      console.error("[AdminLogin] Google Login error:", error);
      toast.error(`Google Login Error: ${error.message || 'Failed to login with Google.'}`);
      setActionLoading(false);
    }
  };

  if (authLoading || !isReadyToRenderForm) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="container py-12 flex justify-center items-center min-h-[calc(100vh-15rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Portal Login</CardTitle>
          <CardDescription>Access the Connectify Hub Admin Dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Login with</span>
            </div>
          </div>

          {!isOtpSent ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile Number (for OTP)</Label>
                <Input
                  id="mobile" type="tel" placeholder="Admin mobile for OTP"
                  value={mobileNumber}
                  onChange={(e) => handleMobileInputChange(e.target.value)}
                  disabled={actionLoading}
                />
              </div>
              <Button className="w-full" onClick={handleSendOtp} disabled={actionLoading || authLoading || !isValidIndianMobileNumber(mobileNumber)}>
                {actionLoading && mobileNumber.trim() && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp" type="text" maxLength={6}
                  placeholder="Enter 6-digit OTP" required value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  disabled={actionLoading}
                />
              </div>
              <Button className="w-full" onClick={handleVerifyOtp} disabled={actionLoading || otp.length !== 6}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP & Login
              </Button>
              <Button variant="link" size="sm" onClick={() => setIsOtpSent(false)} disabled={actionLoading}>
                Try another method
              </Button>
            </>
          )}

          <Button variant="secondary" className="w-full mt-2" onClick={handleGoogleLogin} disabled={actionLoading || isOtpSent}>
            <svg className="mr-2 h-4 w-4" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.20455C17.64 8.56636 17.5834 7.95273 17.4702 7.36364H9V10.845H13.8436C13.635 11.9727 13.0014 12.9109 12.0455 13.5491V15.8318H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"></path><path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8318L12.0455 13.5491C11.2391 14.0918 10.2259 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8395 3.96409 10.71H0.957275V13.085C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"></path><path d="M3.96409 10.71C3.78409 10.1768 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.82318 3.96409 7.29L0.957275 4.91455C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0855L3.96409 10.71Z" fill="#FBBC05"></path><path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.91455L3.96409 7.29C4.67182 5.16045 6.65591 3.57955 9 3.57955Z" fill="#EA4335"></path></svg>
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Not an admin?{' '}
            <Link href="/login" className="underline hover:text-primary">User Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
