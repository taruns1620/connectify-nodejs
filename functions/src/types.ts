
import type { Timestamp } from 'firebase-admin/firestore'; // Use admin timestamp

// Base user type
export type BaseUser = {
  uid: string;
  email: string | null; // Can be null, especially for phone auth
  mobileNumber: string;
  role: 'client' | 'vendor' | 'admin';
  createdAt: Timestamp;
  name?: string; // Generic name field
};

// Client specific data
export type ClientUser = BaseUser & {
  role: 'client';
  upiId?: string; // Optional UPI ID for receiving payouts
  upiVerifiedAt?: Timestamp; // Optional timestamp for when UPI ID was verified/added
  // Add client-specific fields: earnings, history etc.
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
};

export type AppUser = ClientUser | VendorUser | BaseUser; // Union type for general use


export type BonusRule = {
    amount: number;
    percent: number;
};

// Vendor registration request data model
export type VendorRegistrationRequest = {
    id?: string; // Firestore document ID (optional on creation)
    userId: string; // UID of the user who submitted
    mobileNumber: string; // From signup
    email: string; // Email provided during registration
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
    category: string; // Main category field for all types
    upiId: string;
    submittedDate: Timestamp;
    status: 'Pending' | 'Approved' | 'Rejected';
    rejectionReason?: string | null; // Can be nullified on approval
    commissionRate?: number | null; // Set by admin on approval
    bonusRules?: BonusRule[] | null; // Set by admin on approval
    approvedAt?: Timestamp; // Add approval timestamp
};

// Category data model
export type Category = {
  id?: string;
  name: string;
  icon?: string; // Optional: Lucide icon name or image URL
  createdAt?: Timestamp; // Optional creation time
  vendorCount?: number; // Denormalized count (optional, update via functions or batch writes)
};

// Project data model
export type Project = {
    id?: string;
    clientId: string; // Client UID
    clientName?: string; // Denormalized
    vendorId: string; // Vendor UID
    vendorName?: string; // Denormalized
    category: string;
    startDate: Timestamp;
    expectedFinishDate: Timestamp;
    status: 'Started' | 'In Progress' | 'Delayed' | 'Completed' | 'On Hold';
    paymentStatus: 'Pending Advance' | 'Advance Paid' | 'Partially Paid' | 'Fully Paid';
    agreementPhotoUrl?: string; // URL from Firebase Storage
    totalAmount: number;
    amountPaid: number;
    createdAt: Timestamp;
};


// Commission/Transaction data model
export type Commission = {
  id?: string; // Auto-generated Firestore ID
  paymentGatewayTransactionId?: string; // ID from payment gateway webhook
  projectId?: string; // Link to project if applicable
  connectionId?: string; // Direct client-vendor connection ID if no formal project
  clientId: string;
  clientName?: string; // Denormalized
  vendorId: string;
  vendorName?: string; // Denormalized
  referrerId?: string | null; // UID of the referrer (client or vendor) if applicable
  referrerType?: 'client' | 'vendor' | null; // Type of referrer
  transactionType: 'Service' | 'Product'; // Or determine based on vendor category
  transactionDate: Timestamp;
  billAmount: number; // The total amount paid by the client to the Hub
  baseCommissionRate: number; // The vendor's commission rate % at time of transaction
  baseCommissionAmount: number; // Calculated: billAmount * (baseCommissionRate / 100)
  referrerPayout: number; // Calculated payout to the referrer (can be 0)
  clientCashback: number; // Calculated cashback to the client (can be 0)
  hubShare: number; // Calculated share for Connectify Hub
  vendorPayout: number; // Calculated: billAmount - baseCommissionAmount
  paymentType: 'Online' | 'Cash'; // How the payment was made
  status: 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Disputed' | 'Cancelled'; // Overall status
  payoutStatusClient?: 'Pending UPI' | 'Processing' | 'Paid' | 'Cancelled' | 'Failed'; // Status for client cashback payout
  payoutStatusReferrer?: 'Pending UPI' | 'Processing' | 'Paid' | 'Cancelled' | 'Failed'; // Status for referrer payout
  payoutExpiryTimestamp?: Timestamp; // Timestamp for when unclaimed rewards expire (e.g., 2 hours after creation if UPI missing)
  disputeReason?: string; // Reason for dispute if status is 'Disputed'
};


// Client Check-in data model
export type ClientCheckin = {
    id?: string;
    clientId: string;
    vendorId: string;
    checkinTime: Timestamp;
    status: 'Pending Transaction' | 'Transaction Completed' | 'Expired'; // Example statuses
};

// Client Referral data model (Client referring a friend)
export type ClientReferral = {
    id?: string; // Firestore document ID
    referrerClientId: string; // UID of the client who referred
    referrerClientName?: string; // Denormalized name of referring client
    referredFriendName: string;
    referredFriendMobile: string;
    requestedCategory: string;
    assignedVendorId?: string; // UID of vendor assigned (if any)
    status: 'Pending' | 'Assigned' | 'Completed' | 'Expired' | 'Declined'; // Added Declined status
    rewardAmount?: number; // Potential reward amount for the referrer
    referralDate: Timestamp; // When the referral was submitted
    // Add optional fields for tracking conversion:
    signupLinkId?: string; // Unique ID for tracking sign-up link click
    referredUserCreated?: boolean; // Did the friend sign up?
    firstTransactionCompleted?: boolean; // Did they complete a transaction?
};

// Vendor Referral data model (Vendor referring a client to another vendor)
export type VendorReferral = {
    id?: string; // Firestore document ID
    referrerVendorId: string; // UID of the vendor who referred
    referrerVendorName?: string; // Denormalized name of referring vendor
    referredClientName: string;
    referredClientMobile: string;
    requestedCategory: string;
    assignedVendorId?: string; // UID of vendor assigned by the platform
    status: 'Pending' | 'Assigned' | 'Completed' | 'Expired' | 'Declined'; // Added Declined status
    commissionAmount?: number; // Potential commission for the referring vendor
    referralDate: Timestamp; // When the referral was submitted
    // Add optional fields for tracking conversion:
    connectionEstablished?: boolean; // Did the client connect with the assigned vendor?
    transactionCompleted?: boolean; // Did they complete a transaction?
};


// Generic Message/Notification model
export type PlatformMessage = {
    id?: string;
    recipientType: 'clients' | 'vendors' | 'all' | 'user';
    recipientId?: string; // Specific user UID if recipientType is 'user'
    sender: 'admin' | string; // Admin or specific user UID
    subject: string;
    message: string;
    sentDate: Timestamp;
    read?: boolean; // For tracking read status (optional)
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
  assignedAdmin?: string; // Admin handling the ticket
};

// Platform Settings model (Single document in a 'settings' collection)
export type PlatformSettings = {
  defaultVendorCommission: number;
  adminNotificationsEnabled: boolean;
  updatedAt?: Timestamp; // Track last update time
  // Add other platform-wide settings here
};

// Cash Transaction Verification model
export type CashTransaction = {
    id?: string; // Firestore document ID
    vendorId: string;
    vendorName?: string; // Denormalized
    clientId?: string; // Optional, if scanned/entered
    clientName?: string; // Denormalized
    billAmount: number;
    receiptUrl: string; // URL of uploaded receipt in Firebase Storage
    submittedAt: Timestamp;
    status: 'Pending Verification' | 'Client Verification Pending' | 'Approved' | 'Rejected';
    clientVerified: boolean | null; // null = not asked, false = rejected, true = accepted
    clientVerificationTimestamp?: Timestamp;
    adminVerifierId?: string; // UID of admin who verified/rejected
    verificationTimestamp?: Timestamp;
    rejectionReason?: string;
    commissionDocId?: string; // ID of the created commission document upon approval
};

// Vendor Website Click Tracking model
export type VendorWebsiteClick = {
    id?: string; // Firestore document ID
    vendorId: string;
    vendorName?: string; // Denormalized
    clientId: string; // UID of the client who clicked (or 'anonymous')
    clickedAt: Timestamp;
    targetUrl: string; // The actual URL the user was redirected to
};

// SMS Notification Log model (Optional, for tracking sent SMS)
export type SmsNotificationLog = {
    id?: string;
    recipientMobile: string;
    message: string;
    status: 'Sent' | 'Failed' | 'Pending';
    sentAt: Timestamp;
    triggerEvent: 'clientReferral' | 'vendorReferral' | 'cashbackNotification' | 'commissionNotification' | 'paymentConfirmation' | 'clientCashVerification'; // Added cash verification trigger
    relatedDocId?: string; // Link to the relevant referral/commission/cashTx doc
    errorMessage?: string; // If failed
};

// Appointment type for Freelancers
export type Appointment = {
    id?: string;
    clientId: string;
    clientName?: string;
    vendorId: string; // Freelancer's UID
    serviceType: string;
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
