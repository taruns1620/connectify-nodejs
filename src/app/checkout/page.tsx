
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  return (
    <div className="container py-12 md:py-20">
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground shadow-xl rounded-xl">
        <CardHeader className="text-center pb-6">
          <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold font-orbitron tracking-tight">Checkout & Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none mx-auto px-6 py-8 text-foreground/90 space-y-6">
          <p className="text-muted-foreground text-sm">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>
            At Connectify Hub, we aim to provide a secure and transparent environment for transactions between clients and vendors. This page outlines general information about the checkout and payment processes on our platform.
          </p>

          <h2>1. Payment Methods</h2>
          <ul>
            <li>
              <strong>Direct UPI to Vendor:</strong> Many vendors provide their UPI QR codes for direct payments. When you scan a vendor's QR code using your UPI app, the payment goes directly from your account to the vendor's account. Connectify Hub does not process these payments but may track check-ins for cashback eligibility if the client QR code was scanned.
            </li>
            <li>
              <strong>Platform Integrated Payments (if applicable):</strong> For vendors opted into platform-managed payment collection, Connectify Hub may use secure third-party payment gateways (e.g., Paytm, Razorpay) to process online payments. When you pay through such a gateway via our platform:
              <ul>
                <li>Your payment details are handled securely by the payment gateway. Connectify Hub does not store your full card numbers or sensitive payment credentials.</li>
                <li>The payment is then subject to commission splitting as per our Terms & Conditions, with shares distributed to the vendor, referrer (if any), client (cashback, if any), and Connectify Hub.</li>
              </ul>
            </li>
            <li>
              <strong>Cash Payments:</strong> Clients may pay vendors in cash. Vendors are encouraged to upload cash transaction receipts via their dashboard for record-keeping and to enable potential cashback for clients (subject to verification).
            </li>
          </ul>

          <h2>2. Security</h2>
          <ul>
            <li>
              When online payments are processed through integrated gateways on Connectify Hub, we rely on the security measures implemented by these reputable payment processors, which typically include PCI-DSS compliance and data encryption.
            </li>
            <li>
              We advise users to ensure they are on a secure connection (HTTPS) when entering any payment information.
            </li>
            <li>
              Never share your OTPs, passwords, or full card details with anyone, including individuals claiming to be from Connectify Hub support, via unsolicited calls or messages. Official communication will be through designated channels.
            </li>
          </ul>

          <h2>3. Order Confirmation</h2>
          <ul>
            <li>
              Upon successful payment (for online transactions) or agreement with a vendor, you should receive a confirmation from the vendor regarding your order or service.
            </li>
            <li>
              Connectify Hub may also send notifications related to transactions processed through its system, especially concerning commission splits or cashback.
            </li>
          </ul>

          <h2>4. No Direct Checkout on Connectify Hub for All Transactions</h2>
          <p>
            It's important to understand that Connectify Hub is primarily a discovery and connection platform. While we may facilitate payments through integrated gateways for some transactions, many transactions (especially direct UPI or cash) occur directly between the client and the vendor.
          </p>
          <p>
            This "Checkout Information" page serves to inform you about the general payment landscape within our ecosystem, rather than being a specific checkout cart like in a traditional e-commerce store for all listed vendors.
          </p>

          <h2>5. Questions or Concerns</h2>
          <p>
            If you have any questions about a specific payment or the checkout process with a particular vendor, please contact the vendor directly first.
          </p>
          <p>
            For concerns about payment security on the Connectify Hub platform or issues with payments processed through our integrated gateways, please contact our support team:
          </p>
          <p>
            <strong>Connectify Hub Support:</strong> <a href="mailto:connectify.hub.india@gmail.com" className="text-primary hover:underline">connectify.hub.india@gmail.com</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
