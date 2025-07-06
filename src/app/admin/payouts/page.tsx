
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee, Gift, CheckCircle, XCircle, Hourglass, Search, Filter, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, where } from 'firebase/firestore';
import type { Commission } from '@/types';

type PayoutStatus = Commission['payoutStatusClient'] | Commission['payoutStatusReferrer'];

export default function AdminPayoutsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    let q = query(collection(db, "commissions"), orderBy("transactionDate", "desc"));

    // Firestore doesn't directly support OR on different fields for filtering like this.
    // We fetch all and filter client-side for payout statuses.
    // More complex backend filtering might be needed for very large datasets.

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedCommissions: Commission[] = [];
        querySnapshot.forEach((doc) => {
            const commission = { id: doc.id, ...doc.data() } as Commission;
            // Only include commissions that have potential payouts
            if ((commission.clientCashback && commission.clientCashback > 0) || (commission.referrerPayout && commission.referrerPayout > 0)) {
                 fetchedCommissions.push(commission);
            }
        });
        setCommissions(fetchedCommissions);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching commissions for payouts:", error);
        toast.error('Error: Could not fetch commission data.');
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAsPaid = async (commissionId: string, payoutType: 'client' | 'referrer') => {
    if (isProcessing[commissionId + payoutType]) return;
    setIsProcessing(prev => ({...prev, [commissionId + payoutType]: true}));
    const commissionRef = doc(db, "commissions", commissionId);
    const updateField = payoutType === 'client' ? 'payoutStatusClient' : 'payoutStatusReferrer';
    try {
        await updateDoc(commissionRef, { [updateField]: 'Paid' });
        toast.success(`${payoutType === 'client' ? 'Client Cashback' : 'Referrer Payout'} for ${commissionId} marked as Paid.`);
    } catch (error) {
        console.error("Error marking as paid:", error);
        toast.error('Error: Could not update payout status.');
    } finally {
        setIsProcessing(prev => ({...prev, [commissionId + payoutType]: false}));
    }
  };

  const getPayoutStatusVariant = (status?: PayoutStatus) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending UPI': return 'destructive';
      case 'Processing': return 'secondary';
      case 'Cancelled':
      case 'Failed':
        return 'outline';
      default: return 'outline';
    }
  };

  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
        const searchMatch = searchTerm.trim() === '' ||
            c.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.referrerId && c.referrerId.toLowerCase().includes(searchTerm.toLowerCase()));

        const clientPayoutMatch = statusFilter === 'all' || c.payoutStatusClient === statusFilter;
        const referrerPayoutMatch = statusFilter === 'all' || c.payoutStatusReferrer === statusFilter;

        // Show if search matches AND (either client payout matches OR referrer payout matches)
        // And if the specific payout type exists (amount > 0)
        let matchesFilter = false;
        if (c.clientCashback && c.clientCashback > 0 && clientPayoutMatch) {
            matchesFilter = true;
        }
        if (c.referrerPayout && c.referrerPayout > 0 && referrerPayoutMatch) {
            matchesFilter = true;
        }
        if (statusFilter === 'all' && ((c.clientCashback && c.clientCashback > 0) || (c.referrerPayout && c.referrerPayout > 0))) {
           matchesFilter = true; // If filter is all, just ensure there's some payout
        }


        return searchMatch && matchesFilter;
    });
  }, [commissions, searchTerm, statusFilter]);

  const payoutStatuses: PayoutStatus[] = ['Pending UPI', 'Processing', 'Paid', 'Cancelled', 'Failed'];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Payout Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Client Cashback & Referrer Rewards</CardTitle>
          <CardDescription>
            Track and manage payouts for clients and referrers.
          </CardDescription>
          <div className="pt-4 flex flex-col sm:flex-row gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  placeholder="Search by Txn ID, Client, Vendor, Referrer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Payout Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payout Statuses</SelectItem>
                    {payoutStatuses.map(status => (
                        <SelectItem key={status} value={status!}>{status}</SelectItem>
                    ))}
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
                      <TableHead>Txn ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Client Cashback</TableHead>
                      <TableHead>Referrer Payout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {filteredCommissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium truncate max-w-[100px]">{c.id}</TableCell>
                        <TableCell>{c.transactionDate instanceof Timestamp ? format(c.transactionDate.toDate(), 'PP') : 'N/A'}</TableCell>
                        <TableCell>{c.clientName || c.clientId}</TableCell>
                        <TableCell>{c.referrerId || 'N/A'}</TableCell>
                        <TableCell>
                            {c.clientCashback && c.clientCashback > 0 ? (
                                <div className="flex items-center gap-2">
                                    <IndianRupee className="h-3.5 w-3.5"/>{c.clientCashback.toFixed(2)}
                                    <Badge variant={getPayoutStatusVariant(c.payoutStatusClient)}>{c.payoutStatusClient || 'N/A'}</Badge>
                                </div>
                            ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                             {c.referrerPayout && c.referrerPayout > 0 ? (
                                <div className="flex items-center gap-2">
                                    <IndianRupee className="h-3.5 w-3.5"/>{c.referrerPayout.toFixed(2)}
                                     <Badge variant={getPayoutStatusVariant(c.payoutStatusReferrer)}>{c.payoutStatusReferrer || 'N/A'}</Badge>
                                </div>
                            ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                            {c.clientCashback && c.clientCashback > 0 && c.payoutStatusClient !== 'Paid' && c.payoutStatusClient !== 'Cancelled' && c.payoutStatusClient !== 'Failed' && (
                                 <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(c.id!, 'client')} disabled={isProcessing[c.id!+'client']}>
                                    {isProcessing[c.id!+'client'] && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Mark Client Paid
                                 </Button>
                            )}
                            {c.referrerPayout && c.referrerPayout > 0 && c.payoutStatusReferrer !== 'Paid' && c.payoutStatusReferrer !== 'Cancelled' && c.payoutStatusReferrer !== 'Failed' && (
                                 <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(c.id!, 'referrer')} disabled={isProcessing[c.id!+'referrer']}>
                                     {isProcessing[c.id!+'referrer'] && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Mark Referrer Paid
                                 </Button>
                            )}
                        </TableCell>
                      </TableRow>
                  ))}
                  {filteredCommissions.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          {searchTerm || statusFilter !== 'all' ? 'No payouts match your search/filter.' : 'No pending payouts found.'}
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
