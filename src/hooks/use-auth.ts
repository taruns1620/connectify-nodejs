
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, type DocumentData, collection, query, where, limit, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { AppUser, VendorRegistrationRequest, ClientUser, VendorUser, BaseUser } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextProps {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  registrationStatus: VendorRegistrationRequest['status'] | null;
  logout: (redirect?: boolean) => Promise<void>;
}

const defaultAuthContextValue: AuthContextProps = {
  user: null,
  firebaseUser: null,
  loading: true,
  registrationStatus: null,
  logout: async () => {},
};

const AuthContext = createContext<AuthContextProps>(defaultAuthContextValue);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => {
    try {
      return auth.currentUser;
    } catch (error) {
      console.error("[Auth] Error getting initial currentUser:", error);
      return null;
    }
  });
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<VendorRegistrationRequest['status'] | null>(null);
  const router = useRouter();

  const _logout = useCallback(async (redirect = true) => {
    console.log("[Auth] Attempting logout...");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("[Auth] Error signing out from Firebase Auth:", error);
    } finally {
      setUser(null);
      setFirebaseUser(null);
      setRegistrationStatus(null);
      setLoading(false);
      if (redirect) {
        router.push('/login');
      }
    }
  }, [router]);

  const logout = useCallback((redirect = true) => _logout(redirect), [_logout]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      if (!currentFirebaseUser) {
        setUser(null);
        setRegistrationStatus(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;
    let unsubscribeRegStatus: (() => void) | undefined;

    const cleanupListeners = () => {
      unsubscribeUserDoc?.();
      unsubscribeRegStatus?.();
    };

    if (firebaseUser) {
      setLoading(true);
      const userRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as AppUser;

          // If the user is an active vendor, their full profile is on the user doc.
          if (userData.role === 'vendor' && (userData as VendorUser).isActive) {
            setUser(userData);
            setRegistrationStatus('Approved');
            setLoading(false);
          } 
          // If the user is a vendor but NOT active, we need to check their registration status.
          else if (userData.role === 'vendor' && !(userData as VendorUser).isActive) {
            const regQuery = query(
              collection(db, "vendorRegistrations"),
              where("userId", "==", firebaseUser.uid),
              orderBy("submittedDate", "desc"),
              limit(1)
            );
            
            unsubscribeRegStatus?.();
            unsubscribeRegStatus = onSnapshot(regQuery, (regSnapshot) => {
              if (regSnapshot.docs[0]?.exists()) {
                setRegistrationStatus((regSnapshot.docs[0].data() as VendorRegistrationRequest).status);
              } else {
                setRegistrationStatus(null); // No registration found yet
              }
              setUser(userData); // Set the lean user data we have
              setLoading(false);
            }, (error) => {
              console.error(`[Auth] Error fetching registration for vendor ${firebaseUser.uid}:`, error);
              setRegistrationStatus(null);
              setUser(userData);
              setLoading(false);
            });
          }
          // For clients and admins, the user doc is the source of truth.
          else {
            setUser(userData as AppUser);
            setRegistrationStatus(null);
            setLoading(false);
          }
        } else {
          // User doc doesn't exist (e.g., brand new Google signup not yet created)
          setUser(null);
          setRegistrationStatus(null);
          setLoading(false);
        }
      }, (error) => {
        console.error(`[Auth] Error listening to user document for UID ${firebaseUser.uid}:`, error);
        _logout(true);
      });
    } else {
      cleanupListeners();
      setUser(null);
      setRegistrationStatus(null);
      setLoading(false);
    }

    return () => cleanupListeners();
  }, [firebaseUser, _logout]);


  const value = useMemo(() => ({ user, firebaseUser, loading, registrationStatus, logout }), [user, firebaseUser, loading, registrationStatus, logout]);

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
