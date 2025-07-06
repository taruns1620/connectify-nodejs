
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CalendarRange, TrendingUp } from 'lucide-react'; // Example icons

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Reports</h1>

       <Card>
        <CardHeader>
          <CardTitle>Performance Reports</CardTitle>
          <CardDescription>
             Analyze platform activity, earnings, and category performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
           <div className="text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
             <p className="text-lg font-semibold">Reporting Dashboard Feature</p>
             <p>This section is under development.</p>
             <p className="text-sm mt-2">Generate monthly/quarterly reports, view top-performing categories, track commissions, and more.</p>
           </div>
        </CardContent>
      </Card>
       {/* Future: Add date range selectors, specific report types (commissions, cashback, signups), and charts */}
    </div>
  );
}
