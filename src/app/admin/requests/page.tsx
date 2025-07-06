
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Percent, Mail, Phone, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { db, app } from '@/lib/firebase/config';
import { collection, query, onSnapshot, Timestamp, orderBy, doc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { VendorRegistrationRequest, BonusRule } from '@/types';

const MOCK_VENDOR_REQUESTS: VendorRegistrationRequest[] = [
    { id: 'MOCK_REQ_1', userId: 'user1', mobileNumber: '9876543210', shopName: 'Mock Design Studio', category: 'Design', shopAddress: '123 Mock St, City', upiId: 'mockdesign@upi', email: 'mock@design.com', submittedDate: Timestamp.fromDate(new Date(2024, 6, 20)), status: 'Pending', vendorType: 'shop', shopPhotoUrl: 'https://placehold.co/100x100.png' },
    { id: 'MOCK_REQ_2', userId: 'user2', mobileNumber: '8765432109', officeName: 'Mock Plumbing Services', category: 'Plumbing', officeAddress: '456 Mock Ave, Town', upiId: 'mockplumb@upi', email: 'mock@plumbing.com', submittedDate: Timestamp.fromDate(new Date(2024, 6, 22)), status: 'Pending', vendorType: 'service_office', officePhotoUrl: 'https://placehold.co/100x100.png' },
    { id: 'MOCK_REQ_3', userId: 'user3', mobileNumber: '7654321098', fullName: 'Mock Freelancer', profession: 'Writer', category: 'Writing', permanentAddress: '789 Mock Ln, Village', upiId: 'mockfree@upi', email: 'mock@freelance.com', submittedDate: Timestamp.fromDate(new Date(2024, 6, 15)), status: 'Approved', vendorType: 'service_freelancer', areaOfService: "Remote", idProofUrl: 'https://placehold.co/150x100.png', commissionRate: 10, approvedAt: Timestamp.fromDate(new Date(2024,6,16)), shopPhotoUrl: 'https://placehold.co/100x100.png' },
    { id: 'MOCK_REQ_4', userId: 'user4', mobileNumber: '6543210987', shopName: 'Tech Gadgets World', category: 'Electronics', shopAddress: '321 Tech Rd, Metro', upiId: 'tech@upi', email: 'contact@techworld.com', submittedDate: Timestamp.fromDate(new Date(2024, 5, 10)), status: 'Rejected', vendorType: 'shop', rejectionReason: 'Incomplete address details provided.', shopPhotoUrl: 'https://placehold.co/100x100.png' },
];

const functions = getFunctions(app);

export default function VendorRequestsPage() {
  const [requests, setRequests] = useState<VendorRegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VendorRegistrationRequest | null>(null);
  const [commission, setCommission] = useState<number>(5);
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([{ amount: 0, percent: 0 }]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "vendorRegistrations"), orderBy("submittedDate", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedRequests: VendorRegistrationRequest[] = [];
      querySnapshot.forEach((docSnap) => {
         const data = docSnap.data();
         let isValid = false;
         if (data.vendorType === 'shop' && data.shopName && data.shopAddress) isValid = true;
         else if (data.vendorType === 'service_office' && data.officeName && data.officeAddress) isValid = true;
         else if (data.vendorType === 'service_freelancer' && data.fullName && data.permanentAddress && data.profession && data.idProofUrl) isValid = true;

         if (data.userId && data.category && data.submittedDate && data.vendorType && data.upiId && isValid) {
            const requestData = {
                 id: docSnap.id,
                 ...data,
                 submittedDate: data.submittedDate instanceof Timestamp ? data.submittedDate : Timestamp.now()
             } as VendorRegistrationRequest;
             fetchedRequests.push(requestData);
         } else {
             console.warn("Skipping incomplete vendor request:", docSnap.id, data);
         }
      });
      if(fetchedRequests.length === 0){
        console.log("No live vendor requests found, using mock data.");
        setRequests(MOCK_VENDOR_REQUESTS);
      } else {
        setRequests(fetchedRequests);
      }
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching vendor requests:", error);
        toast.error('Error: Could not fetch vendor requests. Displaying mock data.');
        setRequests(MOCK_VENDOR_REQUESTS);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewDetails = (request: VendorRegistrationRequest) => {
    setSelectedRequest(request);
    setCommission(request.commissionRate ?? 5);
    setBonusRules(request.bonusRules && request.bonusRules.length > 0 ? request.bonusRules : [{ amount: 0, percent: 0 }]);
    setRejectionReason(request.rejectionReason || '');
    setIsModalOpen(true);
  };

  const handleAddBonusRule = () => {
    setBonusRules([...bonusRules, { amount: 0, percent: 0 }]);
  };

  const handleRemoveBonusRule = (index: number) => {
    if (bonusRules.length > 1) {
      setBonusRules(bonusRules.filter((_, i) => i !== index));
    } else {
       setBonusRules([{ amount: 0, percent: 0 }]);
    }
  };

  const handleBonusRuleChange = (index: number, field: keyof BonusRule, value: string) => {
    const newRules = [...bonusRules];
    const numValue = parseFloat(value);
    newRules[index] = {
      ...newRules[index],
      [field]: isNaN(numValue) ? 0 : numValue,
    };
    setBonusRules(newRules);
  };

  const handleApprove = async () => {
    if (!selectedRequest || isProcessing) return;
    setIsProcessing(true);

    const approveVendorFunction = httpsCallable(functions, 'approveVendorRegistration');
    const validBonusRules = bonusRules.filter(r => r.amount > 0 && r.percent > 0);
    const finalCommission = Math.max(0, commission);

    try {
      await approveVendorFunction({
        registrationId: selectedRequest.id!,
        commissionRate: finalCommission,
        bonusRules: validBonusRules,
        userId: selectedRequest.userId
      });
      toast.success(`Vendor Approved: ${selectedRequest.shopName || selectedRequest.officeName || selectedRequest.fullName} approved with ${finalCommission}% commission.`);
      setIsModalOpen(false);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error("Error approving vendor:", error);
      toast.error(`Approval Failed: ${error.message || 'Could not approve the vendor. Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim() || isProcessing) {
         if (!rejectionReason.trim()) {
             toast.error('Missing Reason: Please provide a reason for rejection.');
         }
        return;
    }
    setIsProcessing(true);
    
    try {
        const requestRef = doc(db, "vendorRegistrations", selectedRequest.id!);
        await updateDoc(requestRef, {
            status: 'Rejected',
            rejectionReason: rejectionReason.trim(),
            commissionRate: null,
            bonusRules: [],
            approvedAt: null
        });
        toast.error(`Vendor Rejected: ${selectedRequest.shopName || selectedRequest.officeName || selectedRequest.fullName} rejected.`);
        setIsModalOpen(false);
        setSelectedRequest(null);
     } catch (error: any) {
        console.error("Error rejecting vendor:", error);
        toast.error(`Rejection Failed: ${error.message || 'Could not reject the vendor. Please try again.'}`);
     } finally {
         setIsProcessing(false);
     }
  };

  const getStatusVariant = (status: VendorRegistrationRequest['status']) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Approved': return 'default';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) {
      return requests;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return requests.filter(req =>
      (req.shopName || req.officeName || req.fullName || '').toLowerCase().includes(lowerCaseSearchTerm) ||
      req.category.toLowerCase().includes(lowerCaseSearchTerm) ||
      (req.email && req.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
      req.mobileNumber.includes(searchTerm) ||
      req.status.toLowerCase() === lowerCaseSearchTerm
    );
  }, [requests, searchTerm]);

  const getDisplayName = (request: VendorRegistrationRequest) => {
    return request.shopName || request.officeName || request.fullName || 'N/A';
  }

  const getLocation = (request: VendorRegistrationRequest) => {
    return request.shopAddress || request.officeAddress || request.permanentAddress || 'N/A';
  }

  const getPhotoUrl = (request: VendorRegistrationRequest) => {
    if (request.vendorType === 'shop') return request.shopPhotoUrl;
    if (request.vendorType === 'service_office') return request.officePhotoUrl;
    if (request.vendorType === 'service_freelancer') return request.shopPhotoUrl;
    return '';
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Vendor Registration Requests</h1>
      <Card>
        <CardHeader>
          <CardTitle>Review Applications</CardTitle>
          <CardDescription>
            Manage vendor applications. Search by name, category, email, mobile, or status (Pending, Approved, Rejected).
          </CardDescription>
          <div className="pt-4">
             <div className="relative">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
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
                      <TableHead>Business/Provider Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                      <TableCell>{getDisplayName(request)}</TableCell>
                      <TableCell className="capitalize">{request.vendorType?.replace('_', ' ') || 'N/A'}</TableCell>
                      <TableCell>{request.category}</TableCell>
                      <TableCell>{request.mobileNumber}</TableCell>
                      <TableCell>{request.email || 'N/A'}</TableCell>
                      <TableCell>{request.submittedDate ? format(request.submittedDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                      <TableCell className="text-center">
                          <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(request)} aria-label={`View details for ${getDisplayName(request)}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                          </Button>
                      </TableCell>
                      </TableRow>
                  ))}
                  {filteredRequests.length === 0 && !isLoading && (
                      <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                          {searchTerm ? 'No requests match your search.' : 'No requests found.'}
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
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                <DialogTitle>Vendor Details: {selectedRequest ? getDisplayName(selectedRequest) : ''}</DialogTitle>
                <DialogDescription>Review the vendor's application and set commission/status.</DialogDescription>
                </DialogHeader>
                {selectedRequest && (
                    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Type</Label>
                                <p className="font-medium capitalize">{selectedRequest.vendorType?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Category</Label>
                                <p className="font-medium">{selectedRequest.category}</p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label className="text-muted-foreground">Name</Label>
                                <p className="font-medium">{getDisplayName(selectedRequest)}</p>
                            </div>
                            {selectedRequest.vendorType === 'service_freelancer' && selectedRequest.profession && (
                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-muted-foreground">Profession</Label>
                                    <p className="font-medium">{selectedRequest.profession}</p>
                                </div>
                            )}
                            <div className="space-y-1 sm:col-span-2">
                                <Label className="text-muted-foreground">Location / Address</Label>
                                <p className="font-medium">{getLocation(selectedRequest)}</p>
                            </div>
                            {selectedRequest.vendorType === 'service_freelancer' && selectedRequest.areaOfService && (
                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-muted-foreground">Area of Service</Label>
                                    <p className="font-medium">{selectedRequest.areaOfService}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Mobile Number</Label>
                                <a href={`tel:${selectedRequest.mobileNumber}`} className="font-medium flex items-center gap-1 text-primary hover:underline">
                                    <Phone className="h-3 w-3" /> {selectedRequest.mobileNumber}
                                </a>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Email</Label>
                                <a href={`mailto:${selectedRequest.email}`} className="font-medium flex items-center gap-1 text-primary hover:underline break-all">
                                    <Mail className="h-3 w-3" /> {selectedRequest.email || 'N/A'}
                                </a>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">UPI ID</Label>
                                <p className="font-mono font-medium">{selectedRequest.upiId}</p>
                            </div>
                            {selectedRequest.website && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Website</Label>
                                    <a href={selectedRequest.website.startsWith('http') ? selectedRequest.website : `https://${selectedRequest.website}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline break-all">{selectedRequest.website}</a>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(selectedRequest.vendorType === 'shop' || selectedRequest.vendorType === 'service_office' || (selectedRequest.vendorType === 'service_freelancer' && selectedRequest.shopPhotoUrl)) && getPhotoUrl(selectedRequest) && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{selectedRequest.vendorType === 'service_freelancer' ? 'Profile Photo' : 'Shop/Office Photo'}</Label>
                                    <a href={getPhotoUrl(selectedRequest)} target="_blank" rel="noopener noreferrer">
                                        <img src={getPhotoUrl(selectedRequest)} alt="Vendor Photo" className="h-24 w-24 rounded-md object-cover border bg-muted" data-ai-hint="store person" />
                                    </a>
                                </div>
                            )}
                            {selectedRequest.vendorType === 'service_freelancer' && selectedRequest.idProofUrl && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">ID Proof</Label>
                                    <a href={selectedRequest.idProofUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={selectedRequest.idProofUrl} alt="ID Proof" className="h-24 w-auto max-w-full rounded-md object-contain border bg-muted" data-ai-hint="identification document" />
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Current Status</Label>
                            <div><Badge variant={getStatusVariant(selectedRequest.status)}>{selectedRequest.status}</Badge></div>
                        </div>
                        {selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason && (
                            <div className="space-y-1">
                                <Label className="text-destructive">Rejection Reason</Label>
                                <p className="text-sm text-destructive">{selectedRequest.rejectionReason}</p>
                            </div>
                        )}
                        {selectedRequest.status === 'Approved' && selectedRequest.commissionRate !== undefined && (
                             <div className="space-y-1">
                                 <Label className="text-muted-foreground">Approved Commission</Label>
                                 <p className="text-sm font-semibold">{selectedRequest.commissionRate}%</p>
                             </div>
                        )}

                        {selectedRequest.status === 'Pending' && (
                             <div className="space-y-6 pt-6 border-t">
                                 <h3 className="text-lg font-semibold">Admin Actions</h3>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="commission">Base Commission (%)</Label>
                                        <Input
                                            id="commission" type="number" min="0" value={commission}
                                            onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
                                            disabled={isProcessing}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Bonus Rules</Label>
                                    <div className="space-y-3">
                                        {bonusRules.map((rule, index) => (
                                            <div key={index} className="flex flex-wrap gap-2 items-center">
                                                <span className="text-sm text-muted-foreground">If bill &gt;</span>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                                    <Input
                                                        type="number" placeholder="Amount" min="0" value={rule.amount || ''}
                                                        onChange={(e) => handleBonusRuleChange(index, 'amount', e.target.value)}
                                                        className="w-28 h-8 pl-6 pr-2" disabled={isProcessing}
                                                    />
                                                </div>
                                                <span className="text-sm text-muted-foreground">, bonus =</span>
                                                <div className="relative">
                                                    <Input
                                                        type="number" placeholder="%" min="0" value={rule.percent || ''}
                                                        onChange={(e) => handleBonusRuleChange(index, 'percent', e.target.value)}
                                                        className="w-20 h-8 pl-2 pr-5" disabled={isProcessing}
                                                    />
                                                    <Percent className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemoveBonusRule(index)} aria-label="Remove bonus rule" disabled={isProcessing}>
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddBonusRule} className="mt-1" disabled={isProcessing}>
                                            Add Bonus Rule
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                                    <Textarea
                                        id="rejectionReason" value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Provide a clear reason for rejecting the application..."
                                        rows={3}
                                        disabled={isProcessing}
                                    />
                                </div>
                             </div>
                        )}
                    </div>
                )}
                <DialogFooter className="pt-4 border-t">
                 <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isProcessing}>Close</Button>
                 {selectedRequest?.status === 'Pending' && (
                     <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                         <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Reject
                         </Button>
                         <Button variant="default" onClick={handleApprove} disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Approve
                         </Button>
                    </div>
                 )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
