
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast'; // Import react-hot-toast
import { Eye, Search, Filter, IndianRupee, Loader2, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import { db, app } from '@/lib/firebase/config'; 
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import type { CashTransaction } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MOCK_CASH_TRANSACTIONS: CashTransaction[] = [
    { id: 'CT001', vendorId: 'V001', vendorName: 'Tech Gadgets', clientId: 'C123', clientName: 'Rohan Sharma', billAmount: 5000, receiptUrl: 'https://placehold.co/300x200.png', submittedAt: Timestamp.fromDate(new Date(2024, 6, 25, 10, 30)), status: 'Pending Verification', clientVerified: null },
    { id: 'CT002', vendorId: 'V002', vendorName: 'Creative Designs', clientId: 'C456', clientName: 'Priya Singh', billAmount: 15000, receiptUrl: 'https://placehold.co/300x200.png', submittedAt: Timestamp.fromDate(new Date(2024, 6, 26, 14, 0)), status: 'Client Verification Pending', clientVerified: null },
    { id: 'CT003', vendorId: 'V001', vendorName: 'Tech Gadgets', clientId: 'C789', clientName: 'Amit Patel', billAmount: 2000, receiptUrl: 'https://placehold.co/300x200.png', submittedAt: Timestamp.fromDate(new Date(2024, 6, 27, 9, 15)), status: 'Approved', clientVerified: true, verificationTimestamp: Timestamp.now() },
    { id: 'CT004', vendorId: 'V003', vendorName: 'Home Services Ltd.', clientId: 'C101', clientName: 'Sneha Reddy', billAmount: 8000, receiptUrl: 'https://placehold.co/300x200.png', submittedAt: Timestamp.fromDate(new Date(2024, 6, 28, 16, 45)), status: 'Rejected', clientVerified: false, rejectionReason: 'Client denied transaction', verificationTimestamp: Timestamp.now() },
];

const functions = getFunctions(app); 

export default function AdminCashPaymentsPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "cashTransactions"), orderBy("submittedAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedTransactions: CashTransaction[] = [];
        querySnapshot.forEach((doc) => {
            fetchedTransactions.push({ id: doc.id, ...doc.data() } as CashTransaction);
        });
        setTransactions(fetchedTransactions);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching cash transactions:", error);
        toast.error('Error: Could not fetch cash transactions. Displaying mock data.');
        setTransactions(MOCK_CASH_TRANSACTIONS);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewDetails = (transaction: CashTransaction) => {
    setSelectedTransaction(transaction);
    setRejectionReason(transaction.rejectionReason || '');
    setIsModalOpen(true);
  };

  const getStatusVariant = (status: CashTransaction['status']) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending Verification': return 'secondary';
      case 'Client Verification Pending': return 'outline';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const handleVerifyTransaction = async (action: 'approve' | 'reject') => {
    if (!selectedTransaction || isProcessing) return;
    if (action === 'reject' && !rejectionReason.trim()) {
        toast.error('Missing Reason: Please provide a reason for rejection.');
        return;
    }

    setIsProcessing(true);
    const verifyCashPaymentFunction = httpsCallable(functions, 'verifyCashPayment');

    try {
        const result: any = await verifyCashPaymentFunction({
            cashTransactionId: selectedTransaction.id!,
        });

        toast.success(`Transaction ${result.data.status}: Cash transaction ID: ${selectedTransaction.id}. ${result.data.message}`);
        setIsModalOpen(false);

    } catch (error: any) {
        console.error("Error verifying cash transaction:", error);
        toast.error(`Verification Failed: ${error.message || 'Could not update transaction status.'}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) {
      return transactions;
    }
    const lower = searchTerm.toLowerCase();
    return transactions.filter(tx =>
      tx.id?.toLowerCase().includes(lower) ||
      tx.vendorName?.toLowerCase().includes(lower) ||
      tx.clientName?.toLowerCase().includes(lower) ||
      tx.vendorId.toLowerCase().includes(lower) ||
      (tx.clientId && tx.clientId.toLowerCase().includes(lower)) ||
      tx.status.toLowerCase().includes(lower)
    );
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Cash Payment Verification</h1>
      <Card>
        <CardHeader>
          <CardTitle>Submitted Cash Transactions</CardTitle>
          <CardDescription>
            Review and verify cash payments submitted by vendors. Search by ID, Vendor, Client, or Status.
          </CardDescription>
          <div className="pt-4 flex flex-col sm:flex-row gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
               <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Filter
               </Button>
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
                      <TableHead>Vendor</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium truncate max-w-[100px]">{tx.id}</TableCell>
                        <TableCell>{tx.vendorName || tx.vendorId}</TableCell>
                        <TableCell>{tx.clientName || tx.clientId || 'N/A'}</TableCell>
                        <TableCell><IndianRupee className="inline h-3.5 w-3.5 mr-1"/>{tx.billAmount.toFixed(2)}</TableCell>
                        <TableCell>{tx.submittedAt instanceof Timestamp ? format(tx.submittedAt.toDate(), 'PPp') : 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(tx)} aria-label="View details">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          {searchTerm ? 'No transactions match your search.' : 'No cash transactions found.'}
                        </TableCell>
                      </TableRow>
                  )}
                  </TableBody>
                </Table>
               </div>
           )}
        </CardContent>
      </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                <DialogTitle>Verify Cash Transaction: {selectedTransaction?.id}</DialogTitle>
                <DialogDescription>Review details and approve or reject this cash payment.</DialogDescription>
                </DialogHeader>
                {selectedTransaction && (
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-6 text-sm">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                        <Label className="font-semibold col-span-1">Vendor:</Label>
                        <span className="col-span-2">{selectedTransaction.vendorName || selectedTransaction.vendorId}</span>

                        <Label className="font-semibold col-span-1">Client:</Label>
                        <span className="col-span-2">{selectedTransaction.clientName || selectedTransaction.clientId || 'N/A'}</span>

                        <Label className="font-semibold col-span-1">Amount:</Label>
                        <span className="col-span-2"><IndianRupee className="inline h-3.5 w-3.5 mr-1"/>{selectedTransaction.billAmount.toFixed(2)}</span>

                        <Label className="font-semibold col-span-1">Submitted At:</Label>
                        <span className="col-span-2">{selectedTransaction.submittedAt instanceof Timestamp ? format(selectedTransaction.submittedAt.toDate(), 'PPP p') : 'N/A'}</span>

                        <Label className="font-semibold col-span-1">Client Verified:</Label>
                        <span className="col-span-2">
                            {selectedTransaction.clientVerified === true && <CheckCircle className="inline h-4 w-4 text-green-600 mr-1" />}
                            {selectedTransaction.clientVerified === false && <XCircle className="inline h-4 w-4 text-destructive mr-1" />}
                            {selectedTransaction.clientVerified === null && <Hourglass className="inline h-4 w-4 text-yellow-600 mr-1" />}
                            {selectedTransaction.clientVerified === true ? 'Yes' : selectedTransaction.clientVerified === false ? 'No' : 'Pending/Not Applicable'}
                        </span>
                         {selectedTransaction.clientVerificationTimestamp && (
                            <>
                                <Label className="font-semibold col-span-1">Client Verified At:</Label>
                                <span className="col-span-2">{selectedTransaction.clientVerificationTimestamp instanceof Timestamp ? format(selectedTransaction.clientVerificationTimestamp.toDate(), 'PPP p') : 'N/A'}</span>
                            </>
                         )}
                    </div>

                    <div className="mt-4">
                        <Label className="font-semibold mb-2 block">Receipt:</Label>
                        <a href={selectedTransaction.receiptUrl} target="_blank" rel="noopener noreferrer" className="block border rounded-md overflow-hidden hover:opacity-80 transition-opacity">
                            <img src={selectedTransaction.receiptUrl} alt="Receipt" className="w-full h-auto max-h-60 object-contain bg-muted" data-ai-hint="receipt document" />
                        </a>
                    </div>

                    {selectedTransaction.status !== 'Approved' && selectedTransaction.status !== 'Rejected' && (
                        <div className="mt-6 pt-4 border-t">
                            <Label htmlFor="rejectionReason" className="font-semibold">Rejection Reason (if rejecting through admin panel):</Label>
                            <Textarea
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Provide a reason if directly rejecting from admin panel..."
                                rows={3}
                                className="mt-1"
                                disabled={isProcessing}
                            />
                        </div>
                    )}
                     {selectedTransaction.status === 'Rejected' && selectedTransaction.rejectionReason && (
                        <div className="mt-4">
                            <Label className="font-semibold text-destructive">Previous Rejection Reason:</Label>
                            <p className="text-sm text-destructive">{selectedTransaction.rejectionReason}</p>
                        </div>
                     )}
                </div>
                )}
                <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isProcessing}>Close</Button>
                    {selectedTransaction?.status !== 'Approved' && selectedTransaction?.status !== 'Rejected' && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => handleVerifyTransaction('reject')}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Process Rejection
                            </Button>
                            <Button
                                onClick={() => handleVerifyTransaction('approve')}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Process Approval
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
