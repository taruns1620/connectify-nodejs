
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react'; // Using RefreshCw for refund/cancellation icon

export default function RefundPage() {
  return (
    <div className="container py-12 md:py-20">
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground shadow-xl rounded-xl">
        <CardHeader className="text-center pb-6">
          <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold font-orbitron tracking-tight">Refund & Cancellation Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none mx-auto px-6 py-8 text-foreground/90 space-y-6">
          <p className="text-muted-foreground text-sm">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>
            Connectify Hub serves as a platform connecting clients with independent vendors who offer various products and services. The refund and cancellation policies for purchases or services engaged through Connectify Hub are primarily determined by the individual vendors.
          </p>

          <h2>1. Vendor Policies Prevail</h2>
          <ul>
            <li>
              Each vendor on the Connectify Hub platform is responsible for establishing and communicating their own refund and cancellation policies to clients.
            </li>
            <li>
              We strongly advise clients to review and understand the specific vendor's refund and cancellation terms before making any payment or committing to a service. This information may be available on the vendor's Connectify Hub profile, their website, or through direct communication.
            </li>
            <li>
              Connectify Hub does not set a universal refund or cancellation policy that applies to all vendor transactions.
            </li>
          </ul>

          <h2>2. Requesting Refunds or Cancellations</h2>
          <ul>
            <li>
              To request a refund or cancel an order/service, clients must contact the vendor directly.
            </li>
            <li>
              The vendor will process the request based on their stated policies and the specific circumstances of the transaction.
            </li>
          </ul>

          <h2>3. Refund Timelines</h2>
          <ul>
            <li>
              If a vendor approves a refund, the timeline for the refund to be processed and reflect in the client's account will depend on the vendor's process and the payment methods involved (e.g., UPI, bank transfer, payment gateway reversal).
            </li>
            <li>
              Connectify Hub is not directly involved in processing refunds between clients and vendors unless the payment was made through a Connectify Hub-managed payment gateway where the Hub facilitates the refund process based on vendor instruction and dispute resolution outcomes.
            </li>
          </ul>

          <h2>4. Connectify Hub's Role in Disputes</h2>
          <ul>
            <li>
              While refund and cancellation policies are vendor-specific, Connectify Hub may offer mediation assistance in the event of a dispute between a client and a vendor, as outlined in our Terms and Conditions.
            </li>
            <li>
              If a payment was processed through a payment gateway integrated with Connectify Hub, and a dispute results in an approved refund, Connectify Hub will facilitate the refund process according to the payment gateway's procedures and the resolution terms.
            </li>
          </ul>

          <h2>5. Cancellations by Vendors</h2>
          <ul>
            <li>
              Vendors may have their own policies regarding order or service cancellations from their end (e.g., due to unavailability, unforeseen circumstances).
            </li>
            <li>
              In such cases, the vendor is responsible for communicating with the client and processing any applicable refunds according to their policy.
            </li>
          </ul>

          <h2>6. Non-Refundable Items/Services</h2>
          <ul>
            <li>
              Some vendors may offer items or services that are explicitly non-refundable or have specific conditions for cancellation. Clients should be aware of such terms before purchase.
            </li>
          </ul>

          <h2>7. Contact for Clarification</h2>
          <p>
            Clients are encouraged to proactively ask vendors about their refund and cancellation policies before engaging in a transaction.
          </p>
          <p>
            If you have unresolved issues after contacting the vendor, or if you have questions about Connectify Hub's role in dispute mediation, please contact our support team:
          </p>
          <p>
            <strong>Connectify Hub Support:</strong> <a href="mailto:connectify.hub.india@gmail.com" className="text-primary hover:underline">connectify.hub.india@gmail.com</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
