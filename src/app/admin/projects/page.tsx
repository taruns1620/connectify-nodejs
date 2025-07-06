
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import toast from 'react-hot-toast';
import { Eye, Search, Filter, IndianRupee, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Project } from '@/types';

const MOCK_PROJECTS: Project[] = [
    { id: 'PROJ001', clientId: 'client001', clientName: 'Alice Wonderland', vendorId: 'vendor001', vendorName: "Bob's Constructions", category: 'Home Renovation', startDate: Timestamp.fromDate(new Date(2024, 5, 1)), expectedCompletionDate: Timestamp.fromDate(new Date(2024, 8, 30)), status: 'Ongoing', paymentStatus: 'Advance Paid', totalAmount: 500000, amountPaid: 100000, agreementPhotoUrl: 'https://placehold.co/600x400.png', createdAt: Timestamp.fromDate(new Date(2024, 4, 25)), completionPercentage: 30 },
    { id: 'PROJ002', clientId: 'client002', clientName: 'David Copperfield', vendorId: 'vendor001', vendorName: "Bob's Constructions", category: 'Office Build-out', startDate: Timestamp.fromDate(new Date(2024, 6, 15)), expectedCompletionDate: Timestamp.fromDate(new Date(2024, 11, 15)), status: 'Planning', paymentStatus: 'Pending Advance', totalAmount: 1200000, amountPaid: 0, createdAt: Timestamp.fromDate(new Date(2024, 6, 1)), completionPercentage: 0 },
    { id: 'PROJ003', clientId: 'client001', clientName: 'Alice Wonderland', vendorId: 'vendor002', vendorName: "Captain's Crafts", category: 'Custom Furniture', startDate: Timestamp.fromDate(new Date(2024, 3, 10)), expectedCompletionDate: Timestamp.fromDate(new Date(2024, 4, 10)), status: 'Completed', paymentStatus: 'Fully Paid', totalAmount: 75000, amountPaid: 75000, agreementPhotoUrl: 'https://placehold.co/600x400.png', createdAt: Timestamp.fromDate(new Date(2024, 3, 1)), completionPercentage: 100 },
];


export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure Timestamps are converted
            const projectData: Project = {
                id: doc.id,
                ...data,
                startDate: data.startDate instanceof Timestamp ? data.startDate : Timestamp.fromDate(new Date(data.startDate)),
                expectedCompletionDate: data.expectedCompletionDate instanceof Timestamp ? data.expectedCompletionDate : Timestamp.fromDate(new Date(data.expectedCompletionDate)),
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt)),
                lastUpdatedAt: data.lastUpdatedAt instanceof Timestamp ? data.lastUpdatedAt : undefined,
            } as Project;
             fetchedProjects.push(projectData);
        });
         if(fetchedProjects.length === 0){
            console.log("No live projects found, using mock data.");
            setProjects(MOCK_PROJECTS.map(p => ({
                ...p,
                startDate: p.startDate instanceof Timestamp ? p.startDate.toDate() : p.startDate,
                expectedCompletionDate: p.expectedCompletionDate instanceof Timestamp ? p.expectedCompletionDate.toDate() : p.expectedCompletionDate,
                createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate() : p.createdAt,
            }) as any)); // Convert Timestamps to Dates for initial state if using MOCK
        } else {
             setProjects(fetchedProjects.map(p => ({
                ...p,
                startDate: p.startDate instanceof Timestamp ? p.startDate.toDate() : p.startDate,
                expectedCompletionDate: p.expectedCompletionDate instanceof Timestamp ? p.expectedCompletionDate.toDate() : p.expectedCompletionDate,
                createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate() : p.createdAt,
            }) as any));
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching projects:", error);
        toast.error('Error: Could not fetch projects. Displaying mock data.');
        setProjects(MOCK_PROJECTS.map(p => ({
            ...p,
            startDate: p.startDate instanceof Timestamp ? p.startDate.toDate() : p.startDate,
            expectedCompletionDate: p.expectedCompletionDate instanceof Timestamp ? p.expectedCompletionDate.toDate() : p.expectedCompletionDate,
            createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate() : p.createdAt,
        }) as any));
        setIsLoading(false);
    });

    return () => unsubscribe();
}, []);


  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const getStatusVariant = (status: Project['status']) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Ongoing': return 'secondary';
      case 'Planning': return 'outline';
      case 'Delayed': return 'destructive';
      case 'On Hold': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };

   const getPaymentStatusVariant = (status: Project['paymentStatus']) => {
    switch (status) {
      case 'Fully Paid': return 'default';
      case 'Advance Paid': return 'secondary';
      case 'Partially Paid': return 'secondary';
      case 'Pending Advance': return 'destructive';
      case 'Disputed': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return projects;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return projects.filter(proj =>
      proj.clientName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      proj.vendorName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      proj.category.toLowerCase().includes(lowerCaseSearchTerm) ||
      proj.id?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [projects, searchTerm]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Project Tracking</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ongoing and Completed Projects</CardTitle>
          <CardDescription>
            Monitor project progress, timelines, and payment status.
          </CardDescription>
          <div className="pt-4 flex flex-col sm:flex-row gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                  placeholder="Search by Client, Vendor, Category, or ID..."
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
                      <TableHead>Project ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Expected End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                      <TableCell className="font-medium truncate max-w-[100px]">{project.id}</TableCell>
                      <TableCell>{project.clientName || 'N/A'}</TableCell>
                      <TableCell>{project.vendorName || 'N/A'}</TableCell>
                      <TableCell>{project.category}</TableCell>
                      <TableCell>{project.startDate ? format(project.startDate as Date, 'PP') : 'N/A'}</TableCell>
                      <TableCell>{project.expectedCompletionDate ? format(project.expectedCompletionDate as Date, 'PP') : 'N/A'}</TableCell>
                      <TableCell>
                          <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                      </TableCell>
                      <TableCell>
                          <Badge variant={getPaymentStatusVariant(project.paymentStatus)}>{project.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(project)} aria-label={`View details for ${project.id}`}>
                              <Eye className="h-4 w-4" />
                          </Button>
                      </TableCell>
                      </TableRow>
                  ))}
                  {filteredProjects.length === 0 && !isLoading && (
                      <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                          {searchTerm ? 'No projects match your search.' : 'No projects found.'}
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
            <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                <DialogTitle>Project Details: {selectedProject?.id}</DialogTitle>
                <DialogDescription>Client: {selectedProject?.clientName || 'N/A'} | Vendor: {selectedProject?.vendorName || 'N/A'}</DialogDescription>
                </DialogHeader>
                {selectedProject && (
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-6 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                        <div><span className="font-semibold">Category:</span> {selectedProject.category}</div>
                        <div><span className="font-semibold">Start Date:</span> {selectedProject.startDate ? format(selectedProject.startDate as Date, 'PPP') : 'N/A'}</div>
                        <div><span className="font-semibold">Expected Finish:</span> {selectedProject.expectedCompletionDate ? format(selectedProject.expectedCompletionDate as Date, 'PPP') : 'N/A'}</div>
                        <div><span className="font-semibold">Current Status:</span> <Badge variant={getStatusVariant(selectedProject.status)} className="ml-1">{selectedProject.status}</Badge></div>
                        <div><span className="font-semibold">Payment Status:</span> <Badge variant={getPaymentStatusVariant(selectedProject.paymentStatus)} className="ml-1">{selectedProject.paymentStatus}</Badge></div>
                        <div><span className="font-semibold">Total Amount:</span> <IndianRupee className="inline h-3.5 w-3.5 mb-0.5"/>{selectedProject.totalAmount?.toLocaleString() ?? 'N/A'}</div>
                        <div><span className="font-semibold">Amount Paid:</span> <IndianRupee className="inline h-3.5 w-3.5 mb-0.5"/>{selectedProject.amountPaid?.toLocaleString() ?? 'N/A'}</div>
                        <div><span className="font-semibold">Amount Pending:</span> <IndianRupee className="inline h-3.5 w-3.5 mb-0.5"/>{(selectedProject.totalAmount - selectedProject.amountPaid)?.toLocaleString() ?? 'N/A'}</div>
                         <div><span className="font-semibold">Completion:</span> {selectedProject.completionPercentage ?? 0}%</div>
                    </div>

                    {selectedProject.agreementPhotoUrl && (
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Agreement Document/Photo:</h4>
                             <a href={selectedProject.agreementPhotoUrl} target="_blank" rel="noopener noreferrer" className="block border rounded-md overflow-hidden hover:opacity-80 transition-opacity">
                                <img src={selectedProject.agreementPhotoUrl} alt="Agreement Document" className="w-full h-auto max-h-60 object-contain bg-muted" data-ai-hint="agreement document" />
                             </a>
                        </div>
                    )}
                     {!selectedProject.agreementPhotoUrl && (
                         <p className="mt-4 text-muted-foreground italic">No agreement photo uploaded.</p>
                     )}

                      <div className="mt-6 pt-4 border-t">
                          <h4 className="font-semibold mb-3">Project Updates & Timeline (Placeholder)</h4>
                          <p className="text-muted-foreground">This section will display a timeline of project milestones, updates, and communication between client and vendor.</p>
                           <div className="flex items-start space-x-3 mt-3">
                              <div className="flex-shrink-0 h-3 w-3 rounded-full bg-primary mt-1.5"></div>
                              <div>
                                  <p className="font-medium">{selectedProject.lastUpdatedAt ? format(selectedProject.lastUpdatedAt as Date, 'PP') : format(new Date(), 'PP')}: <span className="text-muted-foreground">Update added by Vendor</span></p>
                                  <p className="text-muted-foreground text-xs">"Phase 1 completed ahead of schedule."</p>
                              </div>
                          </div>
                      </div>

                </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}

    