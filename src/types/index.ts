
import type { Timestamp } from 'firebase/firestore';

// Base user type
export type BaseUser = {
  uid: string;
  email: string | null; // Can be null, especially for phone auth
  mobileNumber: string;
  role: 'client' | 'vendor' | 'admin';
  createdAt: Timestamp;
};

// Client specific data
export type ClientUser = BaseUser & {
  role: 'client';
  name?: string; // Optional name
  upiId?: string; // Optional UPI ID for receiving payouts
  upiVerifiedAt?: Timestamp; // Optional timestamp for when UPI ID was verified/added
};

// New ID Proof type
export type IDProof = {
  type: 'Aadhaar' | 'PAN' | 'VoterID'; // Example, can be extended
  url: string; // URL to the uploaded ID proof in Firebase Storage
};

// Vendor specific data (after approval)
export type VendorUser = BaseUser & {
  role: 'vendor';
  vendorType: 'shop' | 'service_office' | 'service_freelancer';
  businessName?: string; // For shop or service_office
  shopName?: string; // Alias for businessName if shop
  officeName?: string; // Alias for businessName if service_office
  fullName?: string; // For service_freelancer
  profession?: string; // For service_freelancer
  category: string;
  description?: string;
  servicesOffered?: string[];
  productsOffered?: string[];
  location?: string; // For shop or service_office (address)
  permanentAddress?: string; // For service_freelancer
  areaOfService?: string; // For service_freelancer
  upiId: string;
  website?: string;
  photoUrl?: string; // Shop/Office photo or freelancer profile photo
  idProofUrl?: string; // For service_freelancer
  commissionRate: number;
  bonusRules?: BonusRule[];
  isActive: boolean;
  approvedAt?: Timestamp;
  name?: string; // Generic name, could be businessName or fullName
  // Project tracking fields for service_office
  projects?: Project[]; // Subcollection or array of project IDs/details
};

export type AppUser = ClientUser | VendorUser | BaseUser;

export type BonusRule = {
    amount: number;
    percent: number;
};

// Vendor registration request data model
export type VendorRegistrationRequest = {
    id?: string;
    userId: string;
    mobileNumber: string;
    email: string;
    vendorType: 'shop' | 'service_office' | 'service_freelancer';
    // Shop specific
    shopName?: string;
    shopAddress?: string;
    shopPhotoUrl?: string;
    // Service with Office specific
    officeName?: string;
    officeAddress?: string;
    officePhotoUrl?: string;
    website?: string;
    // Service Freelancer specific
    fullName?: string;
    profession?: string;
    permanentAddress?: string;
    idProofUrl?: string;
    areaOfService?: string;
    photoUrl?: string; // Generic photoUrl for freelancer
    // Common for all
    category: string; // Main category field
    upiId: string;
    submittedDate: Timestamp;
    status: 'Pending' | 'Approved' | 'Rejected';
    rejectionReason?: string | null;
    commissionRate?: number | null;
    bonusRules?: BonusRule[] | null;
    approvedAt?: Timestamp;
};

// Category data model
export type Category = {
  id?: string;
  name: string;
  icon?: string; // Optional: Lucide icon name or image URL
  createdAt?: Timestamp;
  vendorCount?: number;
};

// Project data model
export type Project = {
    id?: string;
    clientId: string;
    clientName?: string;
    vendorId: string; // The service_office vendor
    vendorName?: string;
    category: string; // Project category (might differ from vendor's main category)
    description?: string;
    startDate: Timestamp;
    expectedCompletionDate: Timestamp;
    status: 'Planning' | 'Ongoing' | 'Delayed' | 'Completed' | 'On Hold' | 'Cancelled';
    paymentStatus: 'Pending Advance' | 'Advance Paid' | 'Partially Paid' | 'Fully Paid' | 'Disputed';
    agreementPhotoUrl?: string;
    totalAmount: number;
    advanceReceived?: number;
    amountPaid: number;
    completionPercentage?: number; // 0-100
    createdAt: Timestamp;
    lastUpdatedAt?: Timestamp;
    updates?: ProjectUpdate[]; // Optional: Array of updates or subcollection
};

export type ProjectUpdate = {
    id?: string;
    timestamp: Timestamp;
    notes: string;
    updatedBy: 'vendor' | 'client' | 'admin';
    previousStatus?: Project['status'];
    newStatus?: Project['status'];
    previousCompletionPercentage?: number;
    newCompletionPercentage?: number;
};


// Commission/Transaction data model
export type Commission = {
  id?: string;
  paymentGatewayTransactionId?: string;
  projectId?: string;
  connectionId?: string;
  clientId: string;
  clientName?: string;
  vendorId: string;
  vendorName?: string;
  referrerId?: string | null;
  referrerType?: 'client' | 'vendor' | null;
  transactionType: 'Service' | 'Product';
  transactionDate: Timestamp;
  billAmount: number;
  baseCommissionRate: number;
  baseCommissionAmount: number;
  referrerPayout: number;
  clientCashback: number;
  hubShare: number;
  vendorPayout: number;
  paymentType: 'Online' | 'Cash';
  status: 'Pending' | 'Paid' | 'Processing' | 'Failed' | 'Disputed' | 'Cancelled';
  payoutStatusClient?: 'Pending UPI' | 'Processing' | 'Paid' | 'Cancelled' | 'Failed';
  payoutStatusReferrer?: 'Pending UPI' | 'Processing' | 'Paid' | 'Cancelled' | 'Failed';
  payoutExpiryTimestamp?: Timestamp;
  disputeReason?: string;
};


// Client Check-in data model
export type ClientCheckin = {
    id?: string;
    clientId: string;
    vendorId: string;
    checkinTime: Timestamp;
    status: 'Pending Transaction' | 'Transaction Completed' | 'Expired';
};

// Client Referral data model
export type ClientReferral = {
    id?: string;
    referrerClientId: string;
    referrerClientName?: string;
    referredFriendName: string;
    referredFriendMobile: string;
    requestedCategory: string;
    assignedVendorId?: string;
    status: 'Pending' | 'Assigned' | 'Completed' | 'Expired' | 'Declined';
    rewardAmount?: number;
    referralDate: Timestamp;
    signupLinkId?: string;
    referredUserCreated?: boolean;
    firstTransactionCompleted?: boolean;
};

// Vendor Referral data model
export type VendorReferral = {
    id?: string;
    referrerVendorId: string;
    referrerVendorName?: string;
    referredClientName: string;
    referredClientMobile: string;
    requestedCategory: string;
    assignedVendorId?: string;
    status: 'Pending' | 'Assigned' | 'Completed' | 'Expired' | 'Declined';
    commissionAmount?: number;
    referralDate: Timestamp;
    connectionEstablished?: boolean;
    transactionCompleted?: boolean;
};


// Generic Message/Notification model
export type PlatformMessage = {
    id?: string;
    recipientType: 'clients' | 'vendors' | 'all' | 'user';
    recipientId?: string;
    sender: 'admin' | string;
    subject: string;
    message: string;
    sentDate: Timestamp;
    read?: boolean;
};

// Support Ticket / Email model
export type SupportTicket = {
  id?: string;
  senderUid: string;
  senderRole: 'client' | 'vendor' | 'guest';
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  submittedDate: Timestamp;
  lastReplyDate?: Timestamp;
  assignedAdmin?: string;
};

// Platform Settings model
export type PlatformSettings = {
  defaultVendorCommission: number;
  adminNotificationsEnabled: boolean;
  updatedAt?: Timestamp;
};

// Cash Transaction Verification model
export type CashTransaction = {
    id?: string;
    vendorId: string;
    vendorName?: string;
    clientId?: string;
    clientName?: string;
    billAmount: number;
    receiptUrl: string;
    submittedAt: Timestamp;
    status: 'Pending Verification' | 'Client Verification Pending' | 'Approved' | 'Rejected';
    clientVerified: boolean | null;
    clientVerificationTimestamp?: Timestamp;
    adminVerifierId?: string;
    verificationTimestamp?: Timestamp;
    rejectionReason?: string;
    commissionDocId?: string;
    bookingId?: string; // For freelancer cash payments via authorized shop
};

// Vendor Website Click Tracking model
export type VendorWebsiteClick = {
    id?: string;
    vendorId: string;
    vendorName?: string;
    clientId: string;
    clickedAt: Timestamp;
    targetUrl: string;
};

// SMS Notification Log model
export type SmsNotificationLog = {
    id?: string;
    recipientMobile: string;
    message: string;
    status: 'Sent' | 'Failed' | 'Pending';
    sentAt: Timestamp;
    triggerEvent: 'clientReferral' | 'vendorReferral' | 'cashbackNotification' | 'commissionNotification' | 'paymentConfirmation' | 'clientCashVerification';
    relatedDocId?: string;
    errorMessage?: string;
};

// Appointment type for Freelancers
export type Appointment = {
    id?: string;
    clientId: string;
    clientName?: string;
    vendorId: string; // Freelancer's UID
    serviceType: string; // e.g., profession
    appointmentTime: Timestamp;
    status: 'Pending Request' | 'Accepted' | 'Rejected' | 'Ongoing' | 'Completed' | 'Cancelled';
    notes?: string;
    createdAt: Timestamp;
};

// OTP store type
export type OtpStore = {
    mobileNumber: string;
    otp: string;
    expiresAt: Timestamp;
    createdAt: Timestamp;
};
