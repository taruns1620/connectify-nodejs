
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, User, Users, Store, QrCode, Send, IndianRupee, Camera } from 'lucide-react'; // Import icons

export default function HelpCenterPage() {
  return (
    <div className="container py-12 md:py-20 max-w-4xl mx-auto">
      <Card className="bg-card text-card-foreground shadow-xl">
        <CardHeader className="text-center pb-6">
          <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold font-orbitron tracking-tight">
            Help Center
          </CardTitle>
           <CardDescription className="text-muted-foreground text-lg">
              Find answers to common questions about using Connectify Hub.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Getting Started */}
             <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">
                 <User className="inline h-5 w-5 mr-2 text-primary/80" /> Getting Started as a Client
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert max-w-none pl-8 text-muted-foreground">
                <p>Welcome to Connectify Hub! Here's how to get started:</p>
                <ol>
                  <li><strong>Sign Up:</strong> Create your client account using your mobile number or Google account.</li>
                  <li><strong>Find Vendors:</strong> Use the search bar or browse categories on the 'Browse Vendors' page to find services or products you need.</li>
                  <li><strong>Your QR Code:</strong> Access your unique QR code in your Client Dashboard. Show this code to participating vendors when you visit their shop.</li>
                  <li><strong>Check-in:</strong> The vendor will scan your QR code to check you in. This makes you eligible for cashback on your purchase.</li>
                  <li><strong>Refer Friends:</strong> Know someone who needs a service? Use the 'Refer a Friend' feature in your dashboard. Enter their name, number, and the needed category. If they connect with a vendor through us, you earn rewards!</li>
                  <li><strong>Track Earnings:</strong> Keep an eye on your cashback and referral rewards in your dashboard.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

             {/* Vendor Guide */}
             <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">
                 <Store className="inline h-5 w-5 mr-2 text-primary/80" /> Getting Started as a Vendor
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert max-w-none pl-8 text-muted-foreground">
                 <p>Ready to grow your business with Connectify Hub? Follow these steps:</p>
                 <ol>
                    <li><strong>Sign Up:</strong> Register as a vendor using your mobile number or Google account.</li>
                    <li><strong>Complete Registration:</strong> After initial signup, you'll be prompted to fill out the Vendor Registration form. Provide your business details, category, location, UPI ID, and optionally a shop photo.</li>
                    <li><strong>Wait for Approval:</strong> Our admin team will review your application. You'll see a 'Pending Approval' page until your registration is approved (usually within 24-48 hours).</li>
                    <li><strong>Access Dashboard:</strong> Once approved, log in again to access your Vendor Dashboard.</li>
                    <li><strong>Client Check-in:</strong> Use the 'Client Check-in' scanner in your dashboard to scan client QR codes. This confirms they visited via Connectify Hub and makes them eligible for cashback.</li>
                    <li><strong>Refer Clients:</strong> If a client needs a service you don't offer, use the 'Refer Client' feature. Refer them to another category, and earn commission if they connect.</li>
                    <li><strong>Payment QR Code:</strong> Find your unique Payment QR code in your dashboard. Clients can scan this with their UPI app for payments (auto-split feature coming soon).</li>
                    <li><strong>Track Activity:</strong> Monitor your walk-ins, earnings, and referral performance in your dashboard.</li>
                 </ol>
              </AccordionContent>
            </AccordionItem>

            {/* QR Codes Explained */}
             <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">
                 <QrCode className="inline h-5 w-5 mr-2 text-primary/80" /> Understanding QR Codes
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert max-w-none pl-8 text-muted-foreground">
                <p>Connectify Hub uses two main types of QR codes:</p>
                <ul>
                  <li><strong>Client Check-in QR Code:</strong> Found in the Client Dashboard. Clients show this to vendors. Vendors scan it using the camera feature in their dashboard to log the visit and enable cashback eligibility.</li>
                  <li><strong>Vendor Payment QR Code:</strong> Found in the Vendor Dashboard. Vendors show this to clients for receiving payments via UPI. (Note: Auto-split payment functionality is under development).</li>
                   <li><strong>How to Scan (Vendors):</strong> Go to your Vendor Dashboard, click 'Start Scanner' under 'Client Check-in'. Point your device camera at the client's QR code.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Referrals Explained */}
             <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">
                 <Send className="inline h-5 w-5 mr-2 text-primary/80" /> How Referrals Work
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert max-w-none pl-8 text-muted-foreground">
                <p>Both Clients and Vendors can earn by referring:</p>
                <ul>
                  <li><strong>Client Referral:</strong> In the Client Dashboard, refer a friend by providing their name, mobile number, and the service category they need. If they successfully connect with a vendor via Connectify Hub, you earn a reward.</li>
                  <li><strong>Vendor Referral:</strong> In the Vendor Dashboard, if a walk-in client needs a service you don't provide, refer them to another category using the 'Refer Client' feature. If the client connects with another vendor through the platform, you earn a commission.</li>
                   <li><strong>Tracking:</strong> You can track the status and earnings from your referrals in your respective dashboards.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

             {/* Cash Payment */}
             <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">
                 <IndianRupee className="inline h-5 w-5 mr-2 text-primary/80" /> Handling Cash Payments (Vendors)
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert max-w-none pl-8 text-muted-foreground">
                 <p>If a Connectify Hub client pays in cash after checking in with their QR code:</p>
                 <ol>
                     <li>Ensure you have scanned their Check-in QR code first.</li>
                     <li>Collect the cash payment as usual.</li>
                     <li>Go to your Vendor Dashboard's 'Client Check-in' section.</li>
                     <li>Click the 'Upload receipt for cash payment' link.</li>
                     <li>Upload a photo of the bill or receipt.</li>
                 </ol>
                 <p>Uploading the receipt helps us track the transaction for potential cashback and commission, even though the payment was made offline.</p>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
