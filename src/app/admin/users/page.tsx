
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Search, UserCheck, UserX, Mail, Phone, Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, where } from 'firebase/firestore';
import type { AppUser, VendorUser, ClientUser, BaseUser } from '@/types';
import Link from 'next/link';

const MOCK_USERS: AppUser[] = [
    { uid: 'admin001', name: 'Super Admin', email: 'admin@connectify.hub', mobileNumber: '+919999988888', role: 'admin', createdAt: Timestamp.fromDate(new Date(2023, 0, 1)) },
    { uid: 'client001', name: 'Alice Wonderland', email: 'alice@example.com', mobileNumber: '+919876543210', role: 'client', createdAt: Timestamp.fromDate(new Date(2024, 5, 10)), upiId: 'alice@upi' } as ClientUser,
    { uid: 'vendor001', name: 'Bob The Builder', businessName: "Bob's Constructions", email: 'bob@builder.com', mobileNumber: '+918765432109', role: 'vendor', vendorType: 'service_office', category: 'Construction', commissionRate: 12, isActive: true, createdAt: Timestamp.fromDate(new Date(2024, 4, 15)), upiId: 'bob@construction', location: 'Main Street, Townsville' } as VendorUser,
    { uid: 'vendor002', name: 'Carol Danvers', shopName: "Captain's Crafts", email: 'carol@crafts.com', mobileNumber: '+917654321098', role: 'vendor', vendorType: 'shop', category: 'Handicrafts', commissionRate: 8, isActive: false, createdAt: Timestamp.fromDate(new Date(2024, 3, 20)), upiId: 'carol@craft', location: 'Craft Lane, City' } as VendorUser,
    { uid: 'client002', name: 'David Copperfield', email: 'david@magic.com', mobileNumber: '+916543210987', role: 'client', createdAt: Timestamp.fromDate(new Date(2024, 6, 1)) } as ClientUser,
];


export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'vendor' | 'admin'>('all');
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    let q = query(collection(db, "users"), orderBy("createdAt", "desc"));

    if (roleFilter !== 'all') {
        q = query(q, where("role", "==", roleFilter));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedUsers: AppUser[] = [];
        querySnapshot.forEach((doc) => {
            fetchedUsers.push({ uid: doc.id, ...doc.data() } as AppUser);
        });
        if(fetchedUsers.length === 0) {
            console.log("No live users found, using mock data.");
            setUsers(MOCK_USERS);
        } else {
            setUsers(fetchedUsers);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching users:", error);
        toast.error('Error: Could not fetch users. Displaying mock data.');
        setUsers(MOCK_USERS);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [roleFilter]);

  const handleToggleVendorStatus = async (vendor: VendorUser) => {
    if (isProcessing[vendor.uid]) return;
    setIsProcessing(prev => ({...prev, [vendor.uid]: true}));
    const userRef = doc(db, "users", vendor.uid);
    try {
        await updateDoc(userRef, { isActive: !vendor.isActive });
        toast.success(`Vendor ${vendor.name || vendor.uid} status updated to ${!vendor.isActive ? 'Active' : 'Inactive'}.`);
    } catch (error) {
        console.error("Error updating vendor status:", error);
        toast.error('Error: Could not update vendor status.');
    } finally {
        setIsProcessing(prev => ({...prev, [vendor.uid]: false}));
    }
  };

  const filteredUsers = useMemo(() => {
    let usersToFilter = users;
     if (roleFilter !== 'all') {
        usersToFilter = usersToFilter.filter(user => user.role === roleFilter);
    }
    if (!searchTerm.trim()) {
      return usersToFilter;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return usersToFilter.filter(user =>
      user.uid.toLowerCase().includes(lowerSearch) ||
      (user.name && user.name.toLowerCase().includes(lowerSearch)) ||
      ((user as VendorUser).businessName && (user as VendorUser).businessName!.toLowerCase().includes(lowerSearch)) ||
      ((user as VendorUser).shopName && (user as VendorUser).shopName!.toLowerCase().includes(lowerSearch)) ||
      ((user as VendorUser).fullName && (user as VendorUser).fullName!.toLowerCase().includes(lowerSearch)) ||
      (user.email && user.email.toLowerCase().includes(lowerSearch)) ||
      user.mobileNumber.includes(lowerSearch)
    );
  }, [users, searchTerm, roleFilter]);

  const getRoleVariant = (role: AppUser['role']) => {
    if (role === 'admin') return 'destructive';
    if (role === 'vendor') return 'default';
    return 'secondary';
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View, search, and manage all registered users on the platform.
          </CardDescription>
          <div className="pt-4 flex flex-col sm:flex-row gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  placeholder="Search by Name, Email, Mobile, UID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="vendor">Vendors</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
          </div>
        </CardHeader>
        <CardContent>
           {isLoading ? (
               <div className="flex justify-center items-center h-40">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
           ) : (
               <div className="overflow-x-auto">
                 <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>UID</TableHead>
                      <TableHead>Name / Business</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {filteredUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium truncate max-w-[100px]">{user.uid}</TableCell>
                        <TableCell>{user.name || (user as VendorUser).businessName || (user as VendorUser).shopName || (user as VendorUser).fullName || 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant={getRoleVariant(user.role)} className="capitalize">{user.role}</Badge>
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]">{user.email || 'N/A'}</TableCell>
                        <TableCell>{user.mobileNumber}</TableCell>
                        <TableCell>{user.createdAt instanceof Timestamp ? format(user.createdAt.toDate(), 'PP') : 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          {user.role === 'vendor' && (user as VendorUser).isActive && <Badge variant="default">Active</Badge>}
                          {user.role === 'vendor' && !(user as VendorUser).isActive && <Badge variant="outline">Inactive</Badge>}
                          {user.role === 'client' && <Badge variant="secondary">Active</Badge>}
                          {user.role === 'admin' && <Badge variant="destructive">Admin</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                            {user.role === 'vendor' && (
                                <Button
                                    variant={(user as VendorUser).isActive ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => handleToggleVendorStatus(user as VendorUser)}
                                    disabled={isProcessing[user.uid]}
                                >
                                    {isProcessing[user.uid] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {(user as VendorUser).isActive ? <UserX className="mr-1 h-3 w-3" /> : <UserCheck className="mr-1 h-3 w-3" />}
                                    {(user as VendorUser).isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                            )}
                             {(user.role === 'client' || user.role === 'admin') && (
                                 <Button variant="ghost" size="icon" disabled>
                                    <ShieldAlert className="h-4 w-4 text-muted-foreground" title="No actions available"/>
                                 </Button>
                            )}
                        </TableCell>
                      </TableRow>
                  ))}
                  {filteredUsers.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          {searchTerm || roleFilter !== 'all' ? 'No users match your search/filter.' : 'No users found.'}
                        </TableCell>
                      </TableRow>
                  )}
                  </TableBody>
                </Table>
               </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

    