
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container py-12 md:py-20">
      <Card className="max-w-4xl mx-auto bg-card text-card-foreground shadow-xl rounded-xl">
        <CardHeader className="text-center pb-6">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold font-orbitron tracking-tight">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none mx-auto px-6 py-8 text-foreground/90">
          <p className="text-muted-foreground text-sm">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>CONNECTIFY HUB ("we", "us", "our") is committed to protecting the privacy and personal data of our users, including vendors and clients ("you"). This Privacy Policy outlines how we collect, use, share, and protect your information when you access or use our mobile application, website, or services (collectively, the "Platform").</p>

          <h2>1. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <h3>A. Personal Information:</h3>
          <ul>
              <li><strong>Identity Data:</strong> Name, phone number, email address.</li>
              <li><strong>Vendor Specific Data:</strong> Business name, business details (type, category, address), UPI ID, website, photos of shop/office, ID proof documents (for freelancers).</li>
              <li><strong>Contact Data:</strong> Addresses, service area.</li>
          </ul>
          <h3>B. Usage Data:</h3>
          <ul>
              <li>Login timestamps, IP addresses, device information.</li>
              <li>QR code scan interactions and client check-ins.</li>
              <li>Referral activity and interactions with platform features.</li>
              <li>Pages visited, features used, and other engagement metrics.</li>
          </ul>
          <h3>C. Device and Technical Data:</h3>
          <ul>
              <li>Device type, operating system, browser type and version.</li>
              <li>Log files, error reports, and app usage statistics.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use collected data for the following purposes:</p>
          <ul>
              <li>To register, onboard, and manage user accounts (Clients, Vendors, Admins).</li>
              <li>To facilitate connections between vendors and clients.</li>
              <li>To process transactions, calculate commissions, and manage payouts.</li>
              <li>To generate and track QR codes for check-ins and payments.</li>
              <li>To communicate platform updates, service changes, support messages, or promotional offers (with consent where required).</li>
              <li>To analyze platform performance, identify trends, and improve user experience.</li>
              <li>To prevent fraud, ensure security, and maintain the integrity of our Platform.</li>
              <li>To comply with legal obligations, resolve disputes, and enforce our agreements.</li>
          </ul>

          <h2>3. Data Sharing and Disclosure</h2>
          <p>
            Connectify Hub does not sell or rent your personal information to third parties for their marketing purposes. We may share information in the following limited circumstances:
          </p>
          <ul>
              <li><strong>With Other Users:</strong> Necessary information is shared between clients and vendors to facilitate service engagement (e.g., vendor profile details are visible to clients; client check-in data may be visible to the respective vendor).</li>
              <li><strong>Service Providers:</strong> With authorized third-party service providers who perform services on our behalf (e.g., cloud hosting, payment processing, SMS gateway, analytics). These providers are obligated to protect your data and use it only for the services they provide to us.</li>
              <li><strong>Legal Requirements:</strong> If required by law, legal process, or governmental request (e.g., to respond to a subpoena or court order).</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction.</li>
              <li><strong>To Protect Rights:</strong> To protect the rights, property, or safety of Connectify Hub, our users, or others. This includes exchanging information for fraud protection and credit risk reduction.</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We implement reasonable administrative, technical, and physical security measures designed to protect your data from unauthorized access, use, alteration, or destruction. These include:
          </p>
          <ul>
              <li>Encryption of sensitive data (e.g., passwords, ID proofs during transit and at rest where feasible).</li>
              <li>Secure cloud infrastructure (Firebase) with its inherent security features.</li>
              <li>Access controls and authentication mechanisms to limit access to personal data.</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or method of electronic storage is 100% secure. Therefore, while we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
          </p>

          <h2>5. User Rights and Choices</h2>
          <p>
            Subject to applicable law, you may have certain rights regarding your personal information. This includes the right to:
          </p>
          <ul>
            <li><strong>Access Your Information:</strong> You can typically review and update your profile information through your account settings or dashboard.</li>
            <li><strong>Data Correction:</strong> Request correction of inaccurate or incomplete personal data we hold about you.</li>
            <li><strong>Data Deletion:</strong> Request deletion of your personal data, subject to certain exceptions (e.g., legal obligations, ongoing disputes).</li>
            <li><strong>Restrict Processing:</strong> Request restriction of processing of your personal data in certain circumstances.</li>
          </ul>
          <p>
            For requests regarding access to personal data in the event of a legal dispute or formal action, please contact us through official channels. Such access will be granted for legal clarity, evidence, or compliance.
            To exercise these rights, please contact us at <a href="mailto:connectify.hub.india@gmail.com" className="text-primary hover:underline">connectify.hub.india@gmail.com</a>. We will respond to your request within a reasonable timeframe.
          </p>

          <h2>6. Cookies and Tracking Technologies</h2>
          <p>Our Platform may use cookies, web beacons, and similar tracking technologies to:</p>
          <ul>
              <li>Maintain user sessions and remember preferences.</li>
              <li>Analyze platform traffic, usage patterns, and user engagement.</li>
              <li>Enhance functionality and personalize your experience.</li>
          </ul>
          <p>
            You can usually manage your cookie preferences through your browser or device settings. Please note that disabling cookies may affect the functionality of certain parts of our Platform.
          </p>

          <h2>7. Children’s Privacy</h2>
          <p>
            Connectify Hub is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children under 18. If we become aware that we have inadvertently collected such information, we will take steps to delete it promptly.
          </p>

          <h2>8. Policy Updates</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on our Platform and updating the "Last Updated" date. Your continued use of the Platform after such changes constitutes your acceptance of the revised policy.
          </p>

          <h2>9. Contact Us</h2>
          <p>If you have any questions, feedback, or concerns regarding this Privacy Policy or our data practices, please contact us at:</p>
          <ul>
              <li><strong>Email:</strong> <a href="mailto:connectify.hub.india@gmail.com" className="text-primary hover:underline">connectify.hub.india@gmail.com</a></li>
              <li><strong>Phone:</strong> <a href="tel:9591073419" className="text-primary hover:underline">9591073419</a></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
