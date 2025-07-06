
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsPage() {
    const { user, loading } = useAuth();
    const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
    const [lastUpdatedDate, setLastUpdatedDate] = useState<string>(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));


    useEffect(() => {
        if (!loading && user?.createdAt) {
            const date = user.createdAt.toDate();
            setEffectiveDate(format(date, 'PPP'));
        } else if (!loading && !user) {
            // Use a generic platform launch date or current date if no user
             setEffectiveDate(new Date(2024, 0, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })); // Example: Jan 1, 2024
        }
    }, [user, loading]);

    return (
        <div className="container py-12 md:py-20">
            <Card className="max-w-4xl mx-auto bg-card text-card-foreground shadow-xl rounded-xl">
                <CardHeader className="text-center pb-6">
                    <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-4xl font-bold font-orbitron tracking-tight">Terms and Conditions</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none mx-auto px-6 py-8 text-foreground/90">
                    <p className="text-muted-foreground text-sm">Last Updated: {lastUpdatedDate}</p>
                    <p className="font-semibold">
                        Effective Date: {loading ? <Skeleton className="h-5 w-40 inline-block" /> : (effectiveDate || 'January 1, 2024')}
                    </p>

                    <p>
                        This document outlines the terms and conditions ("Terms") regarding user conduct, payouts,
                        transactions, dispute resolution, and fraud prevention for all users
                        (vendors, clients, and referrers, collectively "Users" or "you") using the Connectify Hub platform
                        ("Platform", "Service", "we", "us", "our"). By accessing or using the Platform, you agree to be bound by these Terms.
                    </p>

                    <h2>1. User Accounts and Registration</h2>
                    <ul>
                        <li>Users must provide accurate and complete information during registration and keep their account information updated.</li>
                        <li>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.</li>
                        <li>Connectify Hub reserves the right to suspend or terminate accounts found to be in violation of these Terms or engaging in fraudulent activities.</li>
                    </ul>


                    <h2>2. Digital Payments and Commissions</h2>
                    <ul>
                        <li>Payments for services/products transacted through the Platform's integrated payment gateway are split in real-time according to the agreed commission structure.</li>
                        <li>The vendor receives their share after deduction of Connectify Hub's commission and any applicable referral payouts or client cashback.</li>
                        <li>Referrer payouts and client cashback amounts are disbursed via UPI, provided a valid UPI ID is linked to the recipient's account.</li>
                        <li>Connectify Hub's commission share is credited to its designated account.</li>
                        <li>Notifications regarding transactions and payouts will be sent to relevant parties (vendor, client, referrer, admin).</li>
                    </ul>

                    <h2>3. UPI ID Requirement for Payouts</h2>
                    <p>
                        If a client or referrer is eligible for a payout (cashback or referral reward) but has not provided a valid UPI ID:
                    </p>
                    <ul>
                        <li>They will be notified and will have a window of two (2) hours from the time the reward is generated to update their UPI ID on the Platform.</li>
                        <li>Reminders may be sent during this period.</li>
                        <li>If a valid UPI ID is not provided within the 2-hour window, the reward amount will be forfeited and will be credited to Connectify Hub.</li>
                        <li>A final notification will inform the user of the forfeiture.</li>
                    </ul>

                    <h2>4. Cash Transactions</h2>
                    <ul>
                        <li>Vendors accepting cash payments from clients checked-in via Connectify Hub must upload a clear photo of the bill or receipt through the Vendor Dashboard.</li>
                        <li>If a client ID was captured during check-in, the client may receive an SMS to validate the transaction amount and occurrence.</li>
                        <li>Admin will review the uploaded receipt and client validation (if applicable). Approval for commission/cashback processing will be granted if:
                            <ul>
                                <li>The client confirms the transaction (if validation was sent and responded to positively).</li>
                                <li>The uploaded receipt is deemed authentic and clear by the admin.</li>
                            </ul>
                        </li>
                        <li>If client validation fails (denial or no response where applicable) or the receipt is invalid/missing:
                            <ul>
                                <li>Associated client cashback and referrer rewards will not be issued.</li>
                                <li>The commission amount that would have been split will be directed to Connectify Hub.</li>
                                <li>Admin will notify relevant parties if a cash transaction verification is rejected.</li>
                            </ul>
                        </li>
                    </ul>

                    <h2>5. Payment Issues and Disputes</h2>
                    <h3>A. Payment Deducted but Not Received by Vendor (Online Transactions)</h3>
                    <p>
                        In rare instances where a client's account is debited for an online payment via the Platform's gateway, but the vendor does not receive confirmation of payment:
                    </p>
                    <ul>
                        <li>Connectify Hub may, at its discretion and after preliminary verification, advance the vendor's share from its reserve funds to ensure business continuity for the vendor.</li>
                        <li>The vendor must obtain a signed Payment Failure Declaration Form from the client detailing the issue.</li>
                        <li>A clear photo of this signed form must be sent immediately via WhatsApp or email to Connectify Hub admin. The physical form must be submitted as per admin instructions.</li>
                        <li>Connectify Hub will investigate the payment gateway transaction. If the payment is eventually reconciled to the Hub, no further action is needed. If the payment ultimately failed or was reversed by the gateway after an advance, the Hub may recover the advanced amount from future vendor payouts.</li>
                        <li>If a client falsely claims non-payment after a successful transaction, Connectify Hub reserves the right to take appropriate action.</li>
                    </ul>
                    <h3>B. Failed Payments</h3>
                    <p>If an online payment attempt fails (e.g., insufficient funds, bank error, gateway decline):</p>
                    <ul>
                        <li>No commission, cashback, or referral payouts will be generated for that attempt.</li>
                        <li>The client will be notified of the payment failure and may be advised to retry or use an alternative method.</li>
                    </ul>
                    <h3>C. Disputed Transactions</h3>
                    <p>If a client disputes a transaction made through the Platform:</p>
                    <ul>
                        <li>Any related vendor payout may be temporarily held pending investigation.</li>
                        <li>Connectify Hub admin will investigate the dispute, potentially requiring evidence from both the client and the vendor.</li>
                        <li>If the dispute is resolved in favor of the client (e.g., service not rendered, product significantly not as described), a full or partial refund may be processed through the payment gateway, or other resolutions agreed upon. Referral rewards and Hub share will be adjusted or reversed accordingly.</li>
                        <li>If the dispute is resolved in favor of the vendor, held payouts will be released.</li>
                        <li>All parties will be notified of the dispute resolution status.</li>
                    </ul>

                    <h2>6. Vendor Account Suspension/Termination</h2>
                    <p>Connectify Hub reserves the right to suspend or terminate a vendor's account for violations of these Terms, fraudulent activity, or consistent negative feedback. In such cases:</p>
                    <ul>
                        <li>All pending payouts to the vendor may be held.</li>
                        <li>Admin will review the circumstances to determine if held payouts should be released, partially released, or forfeited.</li>
                        <li>Impact on client cashback or referrer payouts related to the suspended vendor's transactions will be assessed on a case-by-case basis.</li>
                    </ul>

                    <h2>7. Fraudulent Activity</h2>
                    <p>If any referral, check-in, or transaction is found to be fraudulent or manipulated (e.g., fake referrals, self-referrals for sole benefit, manipulated cash receipts):</p>
                    <ul>
                        <li>Any associated rewards (cashback, referral payout) will be reversed or cancelled.</li>
                        <li>The responsible user(s) may face penalties, account suspension, or permanent termination from the Platform.</li>
                        <li>Connectify Hub may pursue recovery of erroneously paid out funds.</li>
                    </ul>

                    <h2>8. Platform as an Intermediary</h2>
                    <ul>
                        <li>Connectify Hub acts as a digital intermediary platform connecting clients with vendors.</li>
                        <li>We do not endorse, guarantee, or take responsibility for the quality, safety, legality, timeliness, or satisfaction of services or products offered by vendors. Vendor profiles and claims are the responsibility of the vendors themselves.</li>
                        <li>Clients are encouraged to conduct their own due diligence, communicate directly with vendors, and agree upon terms of service/product purchase before engaging.</li>
                        <li>Disputes between clients and vendors regarding service/product quality or fulfillment are primarily to be resolved between the client and vendor. Connectify Hub may offer mediation assistance as described in the "Disputed Transactions" section but is not liable for the outcome of vendor services or products.</li>
                        <li>Vendors are solely responsible for fulfilling their service commitments and product warranties as advertised or agreed with clients.</li>
                    </ul>

                    <h2>9. Limitation of Liability</h2>
                    <ul>
                        <li>Connectify Hub is not responsible for delays, failures, or errors caused by third-party services such as payment gateways, SMS providers, or internet outages.</li>
                        <li>To the fullest extent permitted by law, Connectify Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the Platform; (b) any conduct or content of any third party on the Platform; or (c) unauthorized access, use, or alteration of your transmissions or content.</li>
                    </ul>

                    <h2>10. User Conduct</h2>
                    <ul>
                        <li>Users must not use the Platform for any unlawful, fraudulent, or malicious purposes.</li>
                        <li>Harassment, abuse, or any form of unethical behavior towards other users or Connectify Hub staff is strictly prohibited and may result in account termination.</li>
                        <li>Misuse of platform features, attempts to manipulate referral or commission systems, or any action that compromises the integrity of the Platform is forbidden.</li>
                    </ul>

                    <h2>11. Amendments to Terms</h2>
                    <p>
                        Connectify Hub reserves the right to modify these Terms at any time. We will notify users of significant changes by posting the new Terms on the Platform and updating the "Last Updated" date. Continued use of the Platform after such changes constitutes your acceptance of the new Terms.
                    </p>

                    <h2>12. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any disputes arising out of or relating to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts located in [Your City/Jurisdiction, India].
                    </p>

                    <h2>13. Contact Information</h2>
                    <p>
                        For any questions or concerns regarding these Terms and Conditions, please contact us at <a href="mailto:connectify.hub.india@gmail.com" className="text-primary hover:underline">connectify.hub.india@gmail.com</a> or call us at <a href="tel:9591073419" className="text-primary hover:underline">9591073419</a>.
                    </p>

                    <p className="mt-8">
                        By using the Connectify Hub platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
