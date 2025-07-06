
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, CreditCard, Wallet, Loader2, Gift, Handshake, Users, Store, BarChartHorizontalBig, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, Timestamp, limit, getDocs, where, getCountFromServer } from 'firebase/firestore';
import type { Commission } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// Initial state for stats, representing the loading state.
const initialStats = {
    totalUsers: 0,
    totalClients: 0,
    totalVendors: 0,
    activeVendors: 0,
    totalTransactions: 0,
    monthlyEarnings: 0,
    totalHubShare: 0,
    pendingPayouts: 0,
    pendingVendorRequests: 0,
    pendingCashVerifications: 0,
};

// Generates chart data for the last 6 months from a list of commissions.
const generateMonthlyChartData = (commissions: Commission[]) => {
    const dataByMonth: { [key: string]: { name: string; earnings: number; transactions: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5); // Go back 5 months to get 6 months total including current

    // Seed the last 6 months to ensure they appear even with 0 data
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthName = format(date, 'MMM yy');
        if (!dataByMonth[monthName]) {
            dataByMonth[monthName] = { name: monthName, earnings: 0, transactions: 0 };
        }
    }

    commissions.forEach(c => {
        if (c.transactionDate.toDate() >= startOfMonth(sixMonthsAgo)) {
            const monthName = format(c.transactionDate.toDate(), 'MMM yy');
            // Ensure month exists in case of timezone/edge case issues
            if (dataByMonth[monthName]) {
                dataByMonth[monthName].earnings += c.hubShare || 0;
                dataByMonth[monthName].transactions += 1;
            }
        }
    });

    return Object.values(dataByMonth).sort((a,b) => new Date(`01 ${a.name}`).getTime() - new Date(`01 ${b.name}`).getTime());
};


export default function AdminDashboardPage() {
    const [recentCommissions, setRecentCommissions] = useState<Commission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(initialStats);
    const [chartData, setChartData] = useState(generateMonthlyChartData([]));

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Define all queries
                const usersColl = collection(db, "users");
                const commissionsColl = collection(db, "commissions");
                const vendorRegColl = collection(db, "vendorRegistrations");
                const cashTxColl = collection(db, "cashTransactions");

                const clientsQuery = query(usersColl, where("role", "==", "client"));
                const vendorsQuery = query(usersColl, where("role", "==", "vendor"));
                const activeVendorsQuery = query(vendorsQuery, where("isActive", "==", true));
                const pendingVendorReqQuery = query(vendorRegColl, where("status", "==", "Pending"));
                const pendingCashVerifQuery = query(cashTxColl, where("status", "in", ["Pending Verification", "Client Verification Pending"]));

                // Fetch all data in parallel
                const [
                    totalUsersSnap,
                    totalClientsSnap,
                    totalVendorsSnap,
                    activeVendorsSnap,
                    allCommissionsSnap, // Fetch all commissions for calculations
                    pendingVendorReqSnap,
                    pendingCashVerifSnap
                ] = await Promise.all([
                    getCountFromServer(usersColl),
                    getCountFromServer(clientsQuery),
                    getCountFromServer(vendorsQuery),
                    getCountFromServer(activeVendorsQuery),
                    getDocs(commissionsColl),
                    getCountFromServer(pendingVendorReqQuery),
                    getCountFromServer(pendingCashVerifQuery),
                ]);

                // Process all fetched commissions
                let currentMonthEarnings = 0;
                let totalHubShareAllTime = 0;
                let pendingPayoutsTotal = 0;
                const now = new Date();
                const monthStart = startOfMonth(now);
                const monthEnd = endOfMonth(now);

                const allCommissions = allCommissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));

                allCommissions.forEach(commission => {
                    totalHubShareAllTime += commission.hubShare || 0;
                    if (commission.transactionDate && isWithinInterval(commission.transactionDate.toDate(), { start: monthStart, end: monthEnd })) {
                        currentMonthEarnings += commission.hubShare || 0;
                    }
                    if (commission.payoutStatusClient && commission.payoutStatusClient !== 'Paid') {
                        pendingPayoutsTotal += commission.clientCashback || 0;
                    }
                    if (commission.payoutStatusReferrer && commission.payoutStatusReferrer !== 'Paid') {
                        pendingPayoutsTotal += commission.referrerPayout || 0;
                    }
                });

                // Set all state at once
                setStats({
                    totalUsers: totalUsersSnap.data().count,
                    totalClients: totalClientsSnap.data().count,
                    totalVendors: totalVendorsSnap.data().count,
                    activeVendors: activeVendorsSnap.data().count,
                    totalTransactions: allCommissionsSnap.size,
                    monthlyEarnings: currentMonthEarnings,
                    totalHubShare: totalHubShareAllTime,
                    pendingPayouts: pendingPayoutsTotal,
                    pendingVendorRequests: pendingVendorReqSnap.data().count,
                    pendingCashVerifications: pendingCashVerifSnap.data().count,
                });

                setChartData(generateMonthlyChartData(allCommissions));
                // Set recent commissions from the already fetched data
                setRecentCommissions(allCommissions.sort((a, b) => b.transactionDate.toMillis() - a.transactionDate.toMillis()).slice(0, 10));

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                toast.error("Could not fetch dashboard data. Please check your connection and Firestore rules.");
                // Optionally, could set stats to a 'failed' state or leave as initial
                setStats(initialStats);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();

        // Optional: Set up a real-time listener ONLY for the recent commissions table for live updates
        const qRecentCommissions = query(collection(db, "commissions"), orderBy("transactionDate", "desc"), limit(10));
        const unsubscribeRecent = onSnapshot(qRecentCommissions, (snapshot) => {
            const fetchedCommissions: Commission[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
            setRecentCommissions(fetchedCommissions);
        }, (error) => {
             console.error("Error listening to recent commissions:", error);
             toast.error("Could not get real-time updates for recent transactions.");
        });


        return () => {
            unsubscribeRecent();
        };
    }, []);


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{stats.totalUsers}</div>}
            <p className="text-xs text-muted-foreground">{stats.totalClients} Clients, {stats.totalVendors} Vendors</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
             <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{stats.activeVendors}</div>}
             <p className="text-xs text-muted-foreground">Out of {stats.totalVendors} total vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
             <BarChartHorizontalBig className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalTransactions}</div>}
             <p className="text-xs text-muted-foreground">Commission records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings (Hub)</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">₹{stats.monthlyEarnings.toFixed(2)}</div>}
            <p className="text-xs text-muted-foreground">This month's hub share</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hub Share Earned</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">₹{stats.totalHubShare.toFixed(2)}</div>}
            <p className="text-xs text-muted-foreground">All-time earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
             <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">₹{stats.pendingPayouts.toFixed(2)}</div>}
             <p className="text-xs text-muted-foreground">Referral + Cashback</p>
          </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Vendor Requests</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pendingVendorRequests}</div>}
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Cash Verifications</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pendingCashVerifications}</div>}
                <p className="text-xs text-muted-foreground">Awaiting client/admin check</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Payment Trends</CardTitle>
            <CardDescription>Monthly earnings and transaction volume over the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2 h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="hsl(var(--primary))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend iconType="circle" />
                <Bar yAxisId="left" dataKey="earnings" fill="hsl(var(--primary))" name="Earnings (₹)" radius={[4, 4, 0, 0]} key="earnings" />
                <Bar yAxisId="right" dataKey="transactions" fill="hsl(var(--accent))" name="Transactions" radius={[4, 4, 0, 0]} key="transactions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions (Commissions)</CardTitle>
          <CardDescription>
            Overview of the latest 10 transactions and commission splits.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && recentCommissions.length === 0 ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            ) : (
               <div className="overflow-x-auto">
                   <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Bill Amt</TableHead>
                            <TableHead className="text-right">Hub Share</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {recentCommissions.map((commission) => (
                            <TableRow key={commission.id}>
                                <TableCell className="font-medium truncate max-w-[80px]">{commission.paymentGatewayTransactionId || commission.id}</TableCell>
                                <TableCell>{commission.clientName || commission.clientId}</TableCell>
                                <TableCell>{commission.vendorName || commission.vendorId}</TableCell>
                                <TableCell>{commission.transactionDate instanceof Timestamp ? format(commission.transactionDate.toDate(), 'PPp') : 'N/A'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        {commission.paymentType === 'Online' ? <CreditCard className="h-4 w-4 text-muted-foreground" /> : <Wallet className="h-4 w-4 text-muted-foreground" />}
                                        {commission.paymentType}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">₹{commission.billAmount?.toFixed(2) ?? 'N/A'}</TableCell>
                                <TableCell className="text-right font-semibold">₹{commission.hubShare?.toFixed(2) ?? 'N/A'}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={commission.status === 'Paid' ? 'default' : (commission.status === 'Processing' ? 'secondary' : 'outline')}>
                                        {commission.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {recentCommissions.length === 0 && !isLoading && (
                            <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-6">No commissions recorded yet.</TableCell>
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
