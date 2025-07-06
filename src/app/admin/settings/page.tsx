
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // Import react-hot-toast
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { PlatformSettings } from '@/types'; 

const SETTINGS_DOC_ID = "platformConfig"; 

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [defaultCommission, setDefaultCommission] = useState(5); 

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const settingsRef = doc(db, "settings", SETTINGS_DOC_ID);
            try {
                const docSnap = await getDoc(settingsRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as PlatformSettings;
                    setDefaultCommission(data.defaultVendorCommission ?? 5); 
                    setNotificationsEnabled(data.adminNotificationsEnabled ?? true);
                } else {
                    console.log("No settings found, initializing with defaults.");
                    await setDoc(settingsRef, {
                        defaultVendorCommission: 5,
                        adminNotificationsEnabled: true,
                        updatedAt: serverTimestamp()
                    });
                }
            } catch (error) {
                console.error("Error fetching settings: ", error);
                toast.error('Error: Failed to load settings.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);


    const handleSaveSettings = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const settingsRef = doc(db, "settings", SETTINGS_DOC_ID);

        try {
            await setDoc(settingsRef, {
                defaultVendorCommission: defaultCommission,
                adminNotificationsEnabled: notificationsEnabled,
                updatedAt: serverTimestamp() 
            }, { merge: true }); 

            toast.success('Settings Saved: Platform settings have been updated.');
        } catch (error) {
            console.error("Error saving settings: ", error);
            toast.error('Error: Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Platform Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure core platform functionalities and defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           {isLoading ? (
               <div className="flex justify-center items-center h-40">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
           ) : (
               <>
                   <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
                    <Label htmlFor="default-commission" className="flex flex-col space-y-1">
                    <span>Default Vendor Commission (%)</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        The default commission rate applied to new vendors upon approval.
                    </span>
                    </Label>
                    <Input
                    id="default-commission"
                    type="number"
                    className="w-20"
                    value={defaultCommission}
                    onChange={(e) => setDefaultCommission(parseFloat(e.target.value) || 0)}
                    disabled={isSaving}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
                    <Label htmlFor="notifications" className="flex flex-col space-y-1">
                    <span>Admin Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Receive email notifications for key events (e.g., new vendor requests).
                    </span>
                    </Label>
                    <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                    disabled={isSaving}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 border p-4 rounded-md opacity-50">
                    <Label htmlFor="security-settings" className="flex flex-col space-y-1">
                    <span>Security Settings</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Configure two-factor authentication, password policies, etc. (Future Feature)
                    </span>
                    </Label>
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                </div>
               </>
           )}


        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveSettings} disabled={isLoading || isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Settings
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
