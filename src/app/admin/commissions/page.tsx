
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee, Search, Filter, Loader2, Percent, CreditCard, Wallet, Users, Store, Gift, Handshake } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { Commission } from '@/types';
import toast from 'react-hot-toast';

const MOCK_COMMISSIONS: Commission[] = [
    { id: 'COMM001', paymentGatewayTransactionId: 'PAY_ONLINE_001', clientId: 'client001', clientName: 'Alice Wonderland', vendorId: 'vendor001', vendorName: "Bob's Constructions", referrerId: 'client002', referrerType: 'client', transactionType: 'Service', transactionDate: Timestamp.fromDate(new Date(2024, 6, 25, 10, 30)), billAmount: 25000, baseCommissionRate: 10, baseCommissionAmount: 2500, referrerPayout: 1250, clientCashback: 250, hubShare: 1000, vendorPayout: 22500, paymentType: 'Online', status: 'Paid', payoutStatusClient: 'Paid', payoutStatusReferrer: 'Paid' },
    { id: 'COMM002', paymentGatewayTransactionId: 'CASH_TXN001', clientId: 'client002', clientName: 'David Copperfield', vendorId: 'vendor002', vendorName: "Captain's Crafts", transactionType: 'Product', transactionDate: Timestamp.fromDate(new Date(2024, 6, 26, 14, 0)), billAmount: 3000, baseCommissionRate: 8, baseCommissionAmount: 240, referrerPayout: 0, clientCashback: 48, hubShare: 192, vendorPayout: 2760, paymentType: 'Cash', status: 'Processing', payoutStatusClient: 'Pending UPI', payoutExpiryTimestamp: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)) },
    { id: 'COMM003', paymentGatewayTransactionId: 'PAY_ONLINE_002', clientId: 'client001', clientName: 'Alice Wonderland', vendorId: 'vendor002', vendorName: "Captain's Crafts", transactionType: 'Product', transactionDate: Timestamp.fromDate(new Date(2024, 5, 12, 9, 15)), billAmount: 70000, baseCommissionRate: 8, baseCommissionAmount: 5600, referrerPayout: 1680, clientCashback: 560, hubShare: 3360, vendorPayout: 64400, paymentType: 'Online', status: 'Paid', payoutStatusClient: 'Paid', payoutStatusReferrer: 'Paid' },
    { id: 'COMM004', paymentGatewayTransactionId: 'PAY_ONLINE_003', clientId: 'client002', clientName: 'David Copperfield', vendorId: 'vendor001', vendorName: "Bob's Constructions", transactionType: 'Service', transactionDate: Timestamp.fromDate(new Date(2024, 4, 5, 11, 45)), billAmount: 1500, baseCommissionRate: 12, baseCommissionAmount: 180, referrerPayout: 0, clientCashback: 36, hubShare: 144, vendorPayout: 1320, paymentType: 'Online', status: 'Failed' },
];

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Commission['status'] | 'all'>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'Online' | 'Cash'>('all');


  useEffect(() => {
    setIsLoading(true);
    let q = query(collection(db, "commissions"), orderBy("transactionDate", "desc"));

    // Note: Firestore doesn't support multiple inequality filters or OR queries on different fields easily without composite indexes.
    // For more complex filtering, you might fetch a broader set and filter client-side, or use multiple queries.
    // For this example, status and paymentType are equality filters if not 'all'.

    const conditions = [];
    if (statusFilter !== 'all') {
      conditions.push(where("status", "==", statusFilter));
    }
    if (paymentTypeFilter !== 'all') {
      conditions.push(where("paymentType", "==", paymentTypeFilter));
    }
    if (conditions.length > 0) {
        q = query(collection(db, "commissions"), orderBy("transactionDate", "desc"), ...conditions);
    }


    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedCommissions: Commission[] = [];
        querySnapshot.forEach((doc) => {
            fetchedCommissions.push({ id: doc.id, ...doc.data() } as Commission);
        });
        if(fetchedCommissions.length === 0 && (statusFilter === 'all' && paymentTypeFilter === 'all')) {
             console.log("No live commissions found, using mock data.");
             setCommissions(MOCK_COMMISSIONS);
        } else if (fetchedCommissions.length === 0 && (statusFilter !== 'all' || paymentTypeFilter !== 'all')) {
             setCommissions([]); // If filters applied and no results, show empty
        }
        else {
            setCommissions(fetchedCommissions);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching commissions:", error);
        toast.error('Error: Could not fetch commission records. Displaying mock data.');
        setCommissions(MOCK_COMMISSIONS); // Fallback to mock data on error
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [statusFilter, paymentTypeFilter]);

  const filteredCommissions = useMemo(() => {
    if (!searchTerm.trim()) {
      return commissions;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return commissions.filter(c =>
      c.id?.toLowerCase().includes(lowerSearch) ||
      c.paymentGatewayTransactionId?.toLowerCase().includes(lowerSearch) ||
      c.clientName?.toLowerCase().includes(lowerSearch) ||
      c.clientId.toLowerCase().includes(lowerSearch) ||
      c.vendorName?.toLowerCase().includes(lowerSearch) ||
      c.vendorId.toLowerCase().includes(lowerSearch) ||
      (c.referrerId && c.referrerId.toLowerCase().includes(lowerSearch))
    );
  }, [commissions, searchTerm]);

  const getStatusVariant = (status: Commission['status']) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Processing': return 'secondary';
      case 'Pending':
      case 'Failed':
      case 'Disputed':
      case 'Cancelled':
        return 'destructive';
      default: return 'outline';
    }
  };

  const commissionStatuses: Commission['status'][] = ['Pending', 'Processing', 'Paid', 'Failed', 'Disputed', 'Cancelled'];
  const paymentTypes: Commission['paymentType'][] = ['Online', 'Cash'];


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Commission Records</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Transaction Commissions</CardTitle>
          <CardDescription>
            Detailed view of all recorded commissions, including splits and statuses.
          </CardDescription>
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
             <div className="relative sm:col-span-1">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  placeholder="Search by ID, Client, Vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {commissionStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={paymentTypeFilter} onValueChange={(value) => setPaymentTypeFilter(value as typeof paymentTypeFilter)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Payment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Types</SelectItem>
                    {paymentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
                      <TableHead className="min-w-[120px]">Txn ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Bill Amt.</TableHead>
                      <TableHead className="text-right">Base Comm (%)</TableHead>
                      <TableHead className="text-right">Total Comm.</TableHead>
                      <TableHead className="text-right">Client Cashback</TableHead>
                      <TableHead className="text-right">Referrer Payout</TableHead>
                      <TableHead className="text-right">Vendor Payout</TableHead>
                      <TableHead className="text-right font-semibold">Hub Share</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {filteredCommissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium truncate max-w-[120px]">{c.paymentGatewayTransactionId || c.id}</TableCell>
                        <TableCell>{c.transactionDate instanceof Timestamp ? format(c.transactionDate.toDate(), 'PP p') : 'N/A'}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{c.clientName || c.clientId}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{c.vendorName || c.vendorId}</TableCell>
                        <TableCell>
                             <Badge variant={c.paymentType === 'Online' ? 'secondary' : 'outline'} className="gap-1">
                                {c.paymentType === 'Online' ? <CreditCard className="h-3 w-3"/> : <Wallet className="h-3 w-3"/>}
                                {c.paymentType}
                             </Badge>
                        </TableCell>
                        <TableCell className="text-right"><IndianRupee className="inline h-3 w-3 mr-0.5"/>{c.billAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{c.baseCommissionRate.toFixed(1)}<Percent className="inline h-3 w-3 ml-0.5"/></TableCell>
                        <TableCell className="text-right"><IndianRupee className="inline h-3 w-3 mr-0.5"/>{c.baseCommissionAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            {c.clientCashback > 0 ? <><Gift className="inline h-3 w-3 mr-0.5 text-blue-500"/><IndianRupee className="inline h-3 w-3 mr-0.5"/>{c.clientCashback.toFixed(2)}</> : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                            {c.referrerPayout > 0 ? <><Handshake className="inline h-3 w-3 mr-0.5 text-green-500"/><IndianRupee className="inline h-3 w-3 mr-0.5"/>{c.referrerPayout.toFixed(2)}</> : '-'}
                        </TableCell>
                         <TableCell className="text-right"><IndianRupee className="inline h-3 w-3 mr-0.5"/>{c.vendorPayout.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold"><IndianRupee className="inline h-3 w-3 mr-0.5"/>{c.hubShare.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                        </TableCell>
                      </TableRow>
                  ))}
                  {filteredCommissions.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                          {searchTerm || statusFilter !== 'all' || paymentTypeFilter !== 'all' ? 'No commissions match your search/filters.' : 'No commission records found.'}
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

    