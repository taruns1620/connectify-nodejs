
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="container py-12 md:py-20">
      <Card className="max-w-3xl mx-auto bg-card text-card-foreground shadow-xl rounded-xl">
        <CardHeader className="text-center pb-6">
          <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold font-orbitron tracking-tight">Shipping & Delivery Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none mx-auto px-6 py-8 text-foreground/90 space-y-6">
          <p className="text-muted-foreground text-sm">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>
            Connectify Hub is a platform that connects clients with independent vendors offering a variety of products and services. As such, the shipping and delivery of physical products purchased through vendors on our platform are primarily handled by the individual vendors themselves.
          </p>

          <h2>1. Vendor Responsibility</h2>
          <ul>
            <li>
              Each vendor is responsible for defining their own shipping and delivery policies, including timelines, costs, shipping methods, and service areas.
            </li>
            <li>
              We encourage clients to directly communicate with the vendor to understand their specific shipping and delivery terms before making a purchase or engaging a service that involves product delivery.
            </li>
            <li>
              Information regarding a vendor's shipping policy may be available on their Connectify Hub profile (if provided by the vendor) or their own website/communication channels.
            </li>
          </ul>

          <h2>2. Delivery Timelines</h2>
          <ul>
            <li>
              Delivery timelines will vary greatly depending on the vendor, the nature of the product, the client's location, and the shipping carrier used by the vendor.
            </li>
            <li>
              Vendors are expected to provide estimated delivery timelines to clients at the time of purchase or order confirmation.
            </li>
            <li>
              Connectify Hub does not directly manage or guarantee delivery timelines for products sold by vendors.
            </li>
          </ul>

          <h2>3. Shipping Costs</h2>
          <ul>
            <li>
              Shipping costs, if applicable, are determined and charged by the individual vendor.
            </li>
            <li>
              Clients should clarify shipping costs with the vendor before finalizing an order.
            </li>
          </ul>

          <h2>4. Tracking and Communication</h2>
          <ul>
            <li>
              If a vendor provides tracking information for a shipment, they should communicate this directly to the client.
            </li>
            <li>
              All communication regarding the status of an order, shipping, and delivery should primarily occur between the client and the vendor.
            </li>
          </ul>

          <h2>5. Connectify Hub's Role</h2>
          <ul>
            <li>
              Connectify Hub's role is to facilitate the connection between clients and vendors. We are not directly involved in the physical shipping or delivery process of products.
            </li>
            <li>
              In case of disputes related to shipping or delivery, Connectify Hub may offer mediation assistance as outlined in our Terms and Conditions, but the ultimate responsibility for fulfillment lies with the vendor.
            </li>
          </ul>

          <h2>6. Services</h2>
          <p>
            For services that do not involve physical product shipping (e.g., freelance services, on-site services), the "delivery" of the service is as per the agreement made directly between the client and the service provider.
          </p>

          <h2>7. Contact</h2>
          <p>
            If you have general questions about how shipping and delivery work on the Connectify Hub platform, you can contact us. However, for specific inquiries about an order, please contact the vendor directly.
          </p>
          <p>
            <strong>Connectify Hub Support:</strong> <a href="mailto:connectify.hub.india@gmail.com" className="text-primary hover:underline">connectify.hub.india@gmail.com</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
