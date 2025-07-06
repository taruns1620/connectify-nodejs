
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config'; // Assuming db is your initialized Firestore instance
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { VendorUser } from '@/types'; // Import your user type if needed

// GET /api/visit/{vendorId}?clientId=...
export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const vendorId = params.vendorId;
    const searchParams = request.nextUrl.searchParams;
    // TODO: Implement a secure way to get the logged-in client's ID
    // For now, using a placeholder or query param (less secure)
    const clientId = searchParams.get('clientId') || 'anonymous'; // Example: get from query or session

    if (!vendorId) {
      console.error("Vendor ID is required in API route /api/visit");
      return new NextResponse("Vendor ID is required", { status: 400 });
    }

    const vendorRef = doc(db, 'users', vendorId);
    const vendorSnap = await getDoc(vendorRef);

    if (!vendorSnap.exists()) {
      console.warn(`Vendor document not found for ID: ${vendorId} in API route /api/visit`);
      return NextResponse.redirect(new URL('/providers?error=vendor_not_found', request.url));
    }

    const vendorData = vendorSnap.data() as VendorUser;

    if (vendorData.role !== 'vendor') {
       console.warn(`User is not a vendor: ${vendorId} in API route /api/visit`);
       return NextResponse.redirect(new URL('/providers?error=not_a_vendor', request.url));
    }

    const websiteUrl = vendorData.website;

    if (!websiteUrl) {
      console.warn(`Vendor ${vendorId} does not have a website URL in API route /api/visit.`);
       return NextResponse.redirect(new URL(`/providers/${vendorId}?error=no_website`, request.url));
    }

    const finalWebsiteUrl = websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://')
      ? websiteUrl
      : `https://${websiteUrl}`;

    addDoc(collection(db, "vendorWebsiteClicks"), {
      vendorId: vendorId,
      vendorName: vendorData.businessName || vendorData.name || vendorId,
      clientId: clientId,
      clickedAt: serverTimestamp(),
      targetUrl: finalWebsiteUrl,
    }).catch(logError => {
        console.error("Error logging vendor website click in API route /api/visit:", logError);
    });

    return NextResponse.redirect(finalWebsiteUrl);

  } catch (error: any) {
    console.error(`Critical Error in /api/visit/${params.vendorId} route:`, error);
    // Redirect to a generic error page or home page in case of unexpected errors
    return new NextResponse("An internal server error occurred.", { status: 500 });
  }
}
