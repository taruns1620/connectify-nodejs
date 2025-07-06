
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type { Commission, VendorUser, AppUser, VendorRegistrationRequest, CashTransaction, ClientReferral, VendorReferral, ClientUser } from "./types"; // Import types

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage(); // Initialize storage if needed for receipts etc.

// --- External Service Configuration (e.g., SMS Gateway) ---
// Store sensitive keys in environment variables!
const SMS_GATEWAY_API_KEY = functions.config().sms?.api_key || "YOUR_FALLBACK_SMS_API_KEY";
const SMS_GATEWAY_SENDER_ID = functions.config().sms?.sender_id || "CONNECTIFY";
const SMS_GATEWAY_URL = "https://api.yourapi.com/send"; // Replace with your SMS gateway URL

// --- Commission Calculation Logic (Updated) ---
function calculateCommissionSplits(
    billAmount: number,
    baseCommissionRate: number, // Vendor's specific rate
    referrerId: string | null
): Omit<Commission, 'id' | 'paymentGatewayTransactionId' | 'projectId' | 'connectionId' | 'clientId' | 'clientName' | 'vendorId' | 'vendorName' | 'referrerType' | 'transactionType' | 'transactionDate' | 'paymentType' | 'status' | 'payoutStatusClient' | 'payoutStatusReferrer' | 'payoutExpiryTimestamp' | 'disputeReason'> {
    const baseCommissionDecimal = baseCommissionRate / 100;
    const baseCommissionAmount = billAmount * baseCommissionDecimal;
    const hasReferrer = !!referrerId;

    let referrerPayoutRate = 0;
    let clientCashbackRate = 0;

    // Determine payout percentages based on bill amount
    if (billAmount <= 30000) {
        if (hasReferrer) {
            referrerPayoutRate = 0.50; // 50% of base commission
            clientCashbackRate = 0.10; // 10% of base commission
        } else {
            clientCashbackRate = 0.20; // 20% of base commission
        }
    } else if (billAmount <= 60000) {
        if (hasReferrer) {
            referrerPayoutRate = 0.40; // 40% of base commission
            clientCashbackRate = 0.10; // 10% of base commission
        } else {
            clientCashbackRate = 0.20; // 20% of base commission
        }
    } else { // billAmount > 60000
        if (hasReferrer) {
            referrerPayoutRate = 0.30; // 30% of base commission
            clientCashbackRate = 0.10; // 10% of base commission
        } else {
            clientCashbackRate = 0.20; // 20% of base commission
        }
    }

    // Calculate actual payout amounts
    const referrerPayout = baseCommissionAmount * referrerPayoutRate;
    const clientCashback = baseCommissionAmount * clientCashbackRate;

    // Calculate Hub Share (remaining commission)
    const hubShare = baseCommissionAmount - referrerPayout - clientCashback;

    // Calculate Vendor Payout (original amount minus total base commission)
    const vendorPayout = billAmount - baseCommissionAmount;

    // Helper to round to 2 decimal places
    const round = (num: number) => Math.round(num * 100) / 100;

    // Ensure no rounding errors cause discrepancies
    const calculatedTotalCommissionSplit = round(referrerPayout) + round(clientCashback) + round(hubShare);
    const roundingDifference = round(round(baseCommissionAmount) - calculatedTotalCommissionSplit);

    return {
        billAmount,
        baseCommissionRate,
        baseCommissionAmount: round(baseCommissionAmount),
        referrerPayout: round(referrerPayout),
        clientCashback: round(clientCashback),
        hubShare: round(hubShare + roundingDifference), // Adjust hub share for rounding
        vendorPayout: round(vendorPayout),
        referrerId, // Keep referrerId in the returned object
    };
}


// --- Cloud Function: Process Payment Webhook (Hub Receives Payment - Updated) ---
export const processPaymentWebhook = functions.https.onRequest(async (req, res) => {
    try {
        console.log("Received payment webhook:", req.body);
        const paymentData = req.body; // Assuming structure from Paytm or similar gateway
        const paymentGatewayTransactionId = paymentData.transaction_id || paymentData.TXNID; // Adapt to your gateway
        const paidAmount = paymentData.amount || paymentData.TXNAMOUNT;
        const paymentStatus = paymentData.status || paymentData.STATUS; // e.g., 'SUCCESS', 'PENDING', 'FAILURE'
        const vendorId = paymentData.metadata?.vendorId || paymentData.ORDERID?.split('_')[1]; // Extract from metadata or order ID
        const clientId = paymentData.metadata?.clientId || paymentData.ORDERID?.split('_')[2];
        const referrerId = paymentData.metadata?.referrerId || null;
        const checkinId = paymentData.metadata?.checkinId || null; // Optional check-in ID link

        if (!paymentGatewayTransactionId || !paidAmount || !vendorId || !clientId) {
            console.error("Missing required data in webhook payload:", paymentData);
            res.status(400).send("Bad Request: Missing required data.");
            return;
        }

        const billAmount = parseFloat(paidAmount);
        if (isNaN(billAmount) || billAmount <= 0) {
            console.error("Invalid amount received in webhook:", paidAmount);
            res.status(400).send("Bad Request: Invalid amount.");
            return;
        }

        if (paymentStatus !== 'SUCCESS' && paymentStatus !== 'TXN_SUCCESS') {
            console.log(`Payment ${paymentGatewayTransactionId} not successful (Status: ${paymentStatus}). No commission record created.`);
            console.log(`NOTIFICATION SIMULATION: Payment Failed for Txn ${paymentGatewayTransactionId} - Notify Client ${clientId} and Vendor ${vendorId}`);
            res.status(200).send({ success: true, message: `Payment status is ${paymentStatus}. No action taken.` });
            return;
        }

        const commissionRef = db.collection('commissions').doc();
        const transactionTimestamp = admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp;

        let clientData: AppUser | null = null;
        let referrerData: AppUser | null = null;
        let vendorData: VendorUser | null = null;
        let referrerType: Commission['referrerType'] = null;

        const clientRef = db.collection('users').doc(clientId);
        const clientSnap = await clientRef.get();
        if (clientSnap.exists()) clientData = clientSnap.data() as AppUser;

        if (referrerId) {
            const referrerRef = db.collection('users').doc(referrerId);
            const referrerSnap = await referrerRef.get();
            if (referrerSnap.exists()) {
                referrerData = referrerSnap.data() as AppUser;
                referrerType = referrerData.role === 'vendor' ? 'vendor' : 'client';
            } else {
                console.warn(`Referrer user document ${referrerId} not found.`);
            }
        }

        const vendorRef = db.collection('users').doc(vendorId);
        const vendorSnap = await vendorRef.get();
        if (!vendorSnap.exists() || vendorSnap.data()?.role !== 'vendor') {
            throw new functions.https.HttpsError('not-found', `Active vendor ${vendorId} not found.`);
        }
        vendorData = vendorSnap.data() as VendorUser;

        const splits = calculateCommissionSplits(billAmount, vendorData.commissionRate, referrerId);

        let payoutStatusClient: Commission['payoutStatusClient'] = 'Processing';
        let payoutStatusReferrer: Commission['payoutStatusReferrer'] = 'Processing';
        let payoutExpiryTimestamp: Commission['payoutExpiryTimestamp'] = undefined;

        const hasClientUpi = !!(clientData && 'upiId' in clientData && clientData.upiId);
        const hasReferrerUpi = !!(referrerData && 'upiId' in referrerData && referrerData.upiId);

        if (splits.clientCashback > 0 && !hasClientUpi) {
            payoutStatusClient = 'Pending UPI';
        }
        if (splits.referrerPayout > 0 && !hasReferrerUpi) {
            payoutStatusReferrer = 'Pending UPI';
        }

        if (payoutStatusClient === 'Pending UPI' || payoutStatusReferrer === 'Pending UPI') {
            const now = Date.now();
            const expiryDate = new Date(now + 2 * 60 * 60 * 1000);
            payoutExpiryTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);
            console.log(`Payout expiry scheduled for commission ${commissionRef.id} at ${expiryDate.toISOString()}`);
        }

        const newCommissionData: Commission = {
            paymentGatewayTransactionId: paymentGatewayTransactionId,
            clientId: clientId,
            clientName: clientData?.name || clientId,
            vendorId: vendorId,
            vendorName: vendorData.businessName || vendorData.name,
            referrerId: referrerId,
            referrerType: referrerType,
            transactionType: 'Service',
            transactionDate: transactionTimestamp,
            billAmount: splits.billAmount,
            baseCommissionRate: splits.baseCommissionRate,
            baseCommissionAmount: splits.baseCommissionAmount,
            referrerPayout: splits.referrerPayout,
            clientCashback: splits.clientCashback,
            hubShare: splits.hubShare,
            vendorPayout: splits.vendorPayout,
            paymentType: 'Online',
            status: 'Processing',
            payoutStatusClient: splits.clientCashback > 0 ? payoutStatusClient : undefined,
            payoutStatusReferrer: splits.referrerPayout > 0 ? payoutStatusReferrer : undefined,
            payoutExpiryTimestamp: payoutExpiryTimestamp,
        };

        await db.runTransaction(async (transaction) => {
            transaction.set(commissionRef, newCommissionData);
            if (checkinId) {
                const checkinRef = db.collection('clientCheckins').doc(checkinId);
                transaction.update(checkinRef, { status: 'Transaction Completed' });
            }
        });

        console.log(`Successfully processed transaction ${paymentGatewayTransactionId}, commission doc created: ${commissionRef.id}`);

        console.log(`NOTIFICATION SIMULATION: Vendor ${vendorId} received payment of ₹${splits.vendorPayout.toFixed(2)} (Txn: ${paymentGatewayTransactionId})`);
        console.log(`NOTIFICATION SIMULATION: Admin - New commission ₹${splits.hubShare.toFixed(2)} generated (Txn: ${paymentGatewayTransactionId})`);
        if (splits.clientCashback > 0) {
            if (payoutStatusClient === 'Pending UPI') {
                console.log(`NOTIFICATION SIMULATION: Client ${clientId} - Add UPI within 2 hours for ₹${splits.clientCashback.toFixed(2)} cashback.`);
            } else {
                console.log(`NOTIFICATION SIMULATION: Client ${clientId} - Cashback of ₹${splits.clientCashback.toFixed(2)} processing.`);
            }
        }
        if (splits.referrerPayout > 0 && referrerId) {
            if (payoutStatusReferrer === 'Pending UPI') {
                console.log(`NOTIFICATION SIMULATION: Referrer ${referrerId} - Add UPI within 2 hours for ₹${splits.referrerPayout.toFixed(2)} reward.`);
            } else {
                console.log(`NOTIFICATION SIMULATION: Referrer ${referrerId} - Reward of ₹${splits.referrerPayout.toFixed(2)} processing.`);
            }
        }

        res.status(200).send({ success: true, commissionId: commissionRef.id });

    } catch (error: any) {
        console.error(`Error processing payment webhook:`, error);
        if (error instanceof functions.https.HttpsError) {
            res.status(mapHttpsErrorToStatusCode(error.code)).send({ success: false, error: error.message });
        } else {
            res.status(500).send({ success: false, error: "Internal Server Error while processing payment webhook." });
        }
    }
});


export const approveVendorRegistration = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth?.token.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Must be an admin to approve vendors.');
        }
        const { registrationId, commissionRate, bonusRules, userId } = data;
        if (!registrationId || typeof commissionRate !== 'number' || !userId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required data: registrationId, commissionRate, userId.');
        }
        if (commissionRate < 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Commission rate cannot be negative.');
        }

        const requestRef = db.collection("vendorRegistrations").doc(registrationId);
        const userRef = db.collection("users").doc(userId);

        await db.runTransaction(async (transaction) => {
            const requestSnap = await transaction.get(requestRef);
            if (!requestSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Registration request not found.');
            }
            const requestData = requestSnap.data() as VendorRegistrationRequest;
            if (requestData.status !== 'Pending') {
                throw new functions.https.HttpsError('failed-precondition', 'Registration request is not pending.');
            }
            if (requestData.userId !== userId) {
                throw new functions.https.HttpsError('invalid-argument', 'User ID mismatch.');
            }

            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists) {
                throw new functions.https.HttpsError('not-found', `User ${userId} not found.`);
            }

            // 1. Update the registration document itself to 'Approved'
            transaction.update(requestRef, {
                status: 'Approved',
                commissionRate: commissionRate,
                bonusRules: bonusRules || [],
                rejectionReason: admin.firestore.FieldValue.delete(),
                approvedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 2. Prepare a COMPREHENSIVE update for the main 'users' document (denormalization)
            const vendorProfileData: Partial<VendorUser> = {
                role: 'vendor',
                isActive: true,
                approvedAt: admin.firestore.FieldValue.serverTimestamp(),
                vendorType: requestData.vendorType,
                category: requestData.category,
                upiId: requestData.upiId,
                commissionRate: commissionRate,
                bonusRules: bonusRules || [],
                email: requestData.email,
            };
            
            // Add optional fields only if they exist in the request
            if (requestData.website) vendorProfileData.website = requestData.website;

            // Handle type-specific fields. This is the crucial part for denormalization.
            // It ensures the correct name, location, and photo are copied to the main user profile.
            if (requestData.vendorType === 'shop') {
                vendorProfileData.name = requestData.shopName;
                vendorProfileData.businessName = requestData.shopName;
                vendorProfileData.shopName = requestData.shopName;
                vendorProfileData.location = requestData.shopAddress;
                vendorProfileData.photoUrl = requestData.shopPhotoUrl;
            } else if (requestData.vendorType === 'service_office') {
                vendorProfileData.name = requestData.officeName;
                vendorProfileData.businessName = requestData.officeName;
                vendorProfileData.officeName = requestData.officeName;
                vendorProfileData.location = requestData.officeAddress;
                vendorProfileData.photoUrl = requestData.officePhotoUrl;
            } else if (requestData.vendorType === 'service_freelancer') {
                vendorProfileData.name = requestData.fullName;
                vendorProfileData.fullName = requestData.fullName;
                vendorProfileData.profession = requestData.profession;
                vendorProfileData.permanentAddress = requestData.permanentAddress;
                vendorProfileData.areaOfService = requestData.areaOfService;
                vendorProfileData.idProofUrl = requestData.idProofUrl;
                vendorProfileData.photoUrl = requestData.photoUrl;
            }

            // Clean up the object to remove any keys with undefined values before setting
            // This is a safety measure to prevent Firestore errors.
            Object.keys(vendorProfileData).forEach(key => vendorProfileData[key as keyof typeof vendorProfileData] === undefined && delete vendorProfileData[key as keyof typeof vendorProfileData]);

            // 3. Use set with merge: true to safely update the user's document
            transaction.set(userRef, vendorProfileData, { merge: true });
        });
        
        console.log(`Vendor registration ${registrationId} approved successfully for user ${userId}.`);
        console.log(`NOTIFICATION SIMULATION: Vendor ${userId} registration approved.`);
        return { success: true, message: "Vendor approved." };

    } catch (error: any) {
        console.error(`Error approving vendor registration ${data.registrationId}:`, error);
        if (error instanceof functions.https.HttpsError) {
           throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to approve vendor.', error);
    }
});


export const verifyCashPayment = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth?.token.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Must be an admin to verify payments.');
        }
        const { cashTransactionId } = data;
        if (!cashTransactionId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required data: cashTransactionId.');
        }

        const cashTxRef = db.collection('cashTransactions').doc(cashTransactionId);
        const commissionRef = db.collection('commissions').doc();

        let finalStatus: CashTransaction['status'] = 'Rejected';
        let rejectionReason = "Verification failed.";
        let commissionCreated = false;

        await db.runTransaction(async (transaction) => {
            const cashTxSnap = await transaction.get(cashTxRef);
            if (!cashTxSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Cash transaction record not found.');
            }
            const cashTxData = cashTxSnap.data() as CashTransaction;

            if (cashTxData.status !== 'Pending Verification' && cashTxData.status !== 'Client Verification Pending') {
                throw new functions.https.HttpsError('failed-precondition', `Transaction status is already '${cashTxData.status}'. No action taken.`);
            }

            if (cashTxData.clientId && cashTxData.clientVerified === false) {
                finalStatus = 'Rejected';
                rejectionReason = 'Client denied the transaction.';
            } else if (cashTxData.clientId && cashTxData.clientVerified === null) {
                finalStatus = 'Rejected';
                rejectionReason = 'Client did not verify the transaction.';
            } else {
                finalStatus = 'Approved';
            }

            if (finalStatus === 'Approved') {
                const vendorRef = db.collection('users').doc(cashTxData.vendorId);
                const vendorSnap = await transaction.get(vendorRef);
                if (!vendorSnap.exists() || vendorSnap.data()?.role !== 'vendor') {
                    throw new functions.https.HttpsError('not-found', `Active vendor ${cashTxData.vendorId} not found for cash transaction.`);
                }
                const vendorData = vendorSnap.data() as VendorUser;

                let clientData: ClientUser | null = null;
                let referrerId: string | null = null;
                let referrerType: Commission['referrerType'] = null;

                if (cashTxData.clientId) {
                    const clientRef = db.collection('users').doc(cashTxData.clientId);
                    const clientDocSnap = await transaction.get(clientRef);
                    if (clientDocSnap.exists()) clientData = clientDocSnap.data() as ClientUser;
                }

                const splits = calculateCommissionSplits(cashTxData.billAmount, vendorData.commissionRate, referrerId);
                let payoutStatusClient: Commission['payoutStatusClient'] = 'Processing';
                let payoutStatusReferrer: Commission['payoutStatusReferrer'] = 'Processing';
                let payoutExpiryTimestamp: Commission['payoutExpiryTimestamp'] = undefined;
                const hasClientUpi = !!(clientData && clientData.upiId);

                if (splits.clientCashback > 0 && !hasClientUpi) {
                    payoutStatusClient = 'Pending UPI';
                }
                if (payoutStatusClient === 'Pending UPI') {
                    const now = Date.now();
                    const expiryDate = new Date(now + 2 * 60 * 60 * 1000);
                    payoutExpiryTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);
                }

                const newCommissionData: Commission = {
                    paymentGatewayTransactionId: `CASH_${cashTransactionId}`,
                    clientId: cashTxData.clientId || 'UNKNOWN_CASH_CLIENT',
                    clientName: clientData?.name || cashTxData.clientId || 'Unknown',
                    vendorId: cashTxData.vendorId,
                    vendorName: vendorData.businessName || vendorData.fullName || vendorData.name,
                    referrerId: referrerId,
                    referrerType: referrerType,
                    transactionType: 'Service',
                    transactionDate: cashTxData.submittedAt,
                    billAmount: splits.billAmount,
                    baseCommissionRate: splits.baseCommissionRate,
                    baseCommissionAmount: splits.baseCommissionAmount,
                    referrerPayout: splits.referrerPayout,
                    clientCashback: splits.clientCashback,
                    hubShare: splits.hubShare,
                    vendorPayout: splits.vendorPayout,
                    paymentType: 'Cash',
                    status: 'Processing',
                    payoutStatusClient: splits.clientCashback > 0 ? payoutStatusClient : undefined,
                    payoutStatusReferrer: splits.referrerPayout > 0 ? payoutStatusReferrer : undefined,
                    payoutExpiryTimestamp: payoutExpiryTimestamp,
                };
                transaction.set(commissionRef, newCommissionData);
                commissionCreated = true;

                transaction.update(cashTxRef, {
                    status: 'Approved',
                    adminVerifierId: context.auth?.uid,
                    verificationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    commissionDocId: commissionRef.id,
                    rejectionReason: admin.firestore.FieldValue.delete()
                });
                console.log(`Cash transaction ${cashTransactionId} approved by admin ${context.auth?.uid}. Commission ${commissionRef.id} created.`);
                if (splits.clientCashback > 0) {
                    if (payoutStatusClient === 'Pending UPI') {
                        console.log(`NOTIFICATION SIMULATION: Client ${cashTxData.clientId} - Add UPI within 2 hours for ₹${splits.clientCashback.toFixed(2)} cashback (Cash Txn).`);
                    } else {
                        console.log(`NOTIFICATION SIMULATION: Client ${cashTxData.clientId} - Cashback of ₹${splits.clientCashback.toFixed(2)} processing (Cash Txn).`);
                    }
                }
                if (splits.referrerPayout > 0 && referrerId) {
                    console.log(`NOTIFICATION SIMULATION: Referrer ${referrerId} - Reward of ₹${splits.referrerPayout.toFixed(2)} processing (Cash Txn).`);
                }
            } else {
                transaction.update(cashTxRef, {
                    status: 'Rejected',
                    adminVerifierId: context.auth?.uid,
                    verificationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    rejectionReason: rejectionReason,
                    commissionDocId: admin.firestore.FieldValue.delete()
                });
                console.log(`Cash transaction ${cashTransactionId} rejected by admin ${context.auth?.uid}. Reason: ${rejectionReason}`);
                console.log(`NOTIFICATION SIMULATION: Vendor ${cashTxData.vendorId} - Cash Txn ${cashTransactionId} rejected. Reason: ${rejectionReason}`);
                if (cashTxData.clientId) {
                    console.log(`NOTIFICATION SIMULATION: Client ${cashTxData.clientId} - Cash Txn ${cashTransactionId} rejected. Reason: ${rejectionReason}`);
                }
            }
        });
        return { success: true, status: finalStatus, commissionCreated: commissionCreated, message: `Cash transaction ${finalStatus}.` };
    } catch (error: any) {
        console.error(`Error verifying cash transaction ${data.cashTransactionId}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to process cash transaction verification.', error);
    }
});


export const onClientReferralCreate = functions.firestore
    .document('clientReferrals/{referralId}')
    .onCreate(async (snap, context) => {
        try {
            const referralData = snap.data() as ClientReferral;
            const referralId = context.params.referralId;
            console.log(`New client referral created: ${referralId}`, referralData);

            const { referredFriendName, referredFriendMobile, referrerClientName, requestedCategory } = referralData;
            const signupLink = `https://connectifyhub.in/signup?ref=${referralId}&type=client`;
            const message = `Hi ${referredFriendName}, ${referrerClientName || 'a friend'} referred you for ${requestedCategory} services via Connectify Hub. Create an account to connect with verified vendors and earn rewards: ${signupLink}`;

            await sendSms(referredFriendMobile, message, 'clientReferral', referralId);
            console.log(`SMS sent successfully for referral ${referralId} to ${referredFriendMobile}`);
        } catch (error) {
            console.error(`Failed to process client referral ${context.params.referralId}:`, error);
            // Optionally, update the referral document with an error status
        }
        return null;
    });


export const onVendorReferralCreate = functions.firestore
    .document('vendorReferrals/{referralId}')
    .onCreate(async (snap, context) => {
        try {
            const referralData = snap.data() as VendorReferral;
            const referralId = context.params.referralId;
            console.log(`New vendor referral created: ${referralId}`, referralData);
            const { referredClientName, referredClientMobile, referrerVendorName, requestedCategory } = referralData;
            const signupLink = `https://connectifyhub.in/signup?ref=${referralId}&type=vendorRef`;
            const message = `Hi ${referredClientName}, ${referrerVendorName || 'a vendor'} at Connectify Hub has referred you for ${requestedCategory} services. Our team will connect you with a suitable vendor shortly. Learn more and sign up: ${signupLink}`;
            await sendSms(referredClientMobile, message, 'vendorReferral', referralId);
            console.log(`SMS sent successfully for vendor referral ${referralId} to ${referredClientMobile}`);
        } catch (error) {
            console.error(`Failed to process vendor referral ${context.params.referralId}:`, error);
        }
        return null;
    });


export const onCashTransactionCreate = functions.firestore
    .document('cashTransactions/{transactionId}')
    .onCreate(async (snap, context) => {
        try {
            const cashTxData = snap.data() as CashTransaction;
            const transactionId = context.params.transactionId;

            if (cashTxData.clientId && cashTxData.status === 'Pending Verification') {
                console.log(`New cash transaction ${transactionId} requires client verification for client ${cashTxData.clientId}.`);
                const verificationYesLink = `https://connectifyhub.in/verify/cash/${transactionId}?action=yes&token=UNIQUE_YES_TOKEN`;
                const verificationNoLink = `https://connectifyhub.in/verify/cash/${transactionId}?action=no&token=UNIQUE_NO_TOKEN`;
                const message = `Hi ${cashTxData.clientName || 'Customer'}, please verify a cash payment of ₹${cashTxData.billAmount.toFixed(2)} at ${cashTxData.vendorName || 'Vendor'}. Was this correct? Yes: ${verificationYesLink} No: ${verificationNoLink}`;

                let clientMobileNumber = cashTxData.clientId;
                if (!clientMobileNumber.startsWith('+') && clientMobileNumber.length > 10) {
                    const clientUserRef = db.collection('users').doc(cashTxData.clientId);
                    const clientUserSnap = await clientUserRef.get();
                    if (clientUserSnap.exists()) {
                        clientMobileNumber = (clientUserSnap.data() as AppUser).mobileNumber;
                    } else {
                        throw new Error(`Client user document not found for UID: ${cashTxData.clientId}`);
                    }
                }

                await sendSms(clientMobileNumber, message, 'clientCashVerification', transactionId);
                console.log(`Verification SMS sent for cash transaction ${transactionId} to client ${clientMobileNumber}`);
                await snap.ref.update({ status: 'Client Verification Pending' });
            } else {
                console.log(`Cash transaction ${transactionId} created without client ID or not requiring client verification.`);
            }
        } catch (error) {
            console.error(`Failed to process cash transaction creation for ${context.params.transactionId}:`, error);
        }
        return null;
    });


async function sendSms(mobileNumber: string, message: string, triggerEvent: string, relatedDocId?: string): Promise<void> {
    let formattedNumber = mobileNumber;
    if (!mobileNumber.startsWith('+')) {
        if (mobileNumber.length === 10) {
            formattedNumber = `+91${mobileNumber}`;
        } else if (mobileNumber.length > 10 && mobileNumber.startsWith('91')) {
            formattedNumber = `+${mobileNumber}`;
        } else {
            console.warn(`Invalid mobile number format for SMS: ${mobileNumber}`);
            throw new Error(`Invalid mobile number format: ${mobileNumber}`);
        }
    }

    const payload = {
        api_key: SMS_GATEWAY_API_KEY,
        sender_id: SMS_GATEWAY_SENDER_ID,
        to: formattedNumber,
        message: message,
    };

    let status: 'Sent' | 'Failed' | 'Pending' = 'Pending';
    let errorMessage: string | undefined;
    let gatewayResponseData: any = null;

    try {
        const fetch = require('node-fetch');
        const response = await fetch(SMS_GATEWAY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            timeout: 10000,
        });

        gatewayResponseData = await response.json();
        if (!response.ok) {
            const errorBodyText = typeof gatewayResponseData === 'string' ? gatewayResponseData : JSON.stringify(gatewayResponseData);
            console.error(`SMS Gateway Error (${response.status}) for ${formattedNumber}: ${errorBodyText}`);
            throw new Error(`SMS Gateway failed with status ${response.status}. Response: ${errorBodyText}`);
        }
        console.log("SMS Gateway Response:", gatewayResponseData);
        status = 'Sent';
    } catch (error: any) {
        console.error(`Error sending SMS to ${formattedNumber}:`, error);
        status = 'Failed';
        errorMessage = error.message || 'Unknown error';
        // Do NOT re-throw here if you want the calling Firestore trigger to complete successfully even if SMS fails.
        // If SMS failure should halt the trigger, then re-throw.
        // For now, logging the error and the log document is sufficient.
    } finally {
        try {
            await db.collection('smsNotificationLogs').add({
                recipientMobile: formattedNumber,
                messageLength: message.length,
                status: status,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                triggerEvent: triggerEvent,
                relatedDocId: relatedDocId || null,
                errorMessage: errorMessage || null,
                gatewayResponse: gatewayResponseData ? JSON.stringify(gatewayResponseData) : null,
            });
        } catch (logError) {
            console.error("Failed to log SMS notification:", logError);
        }
    }
}


function mapHttpsErrorToStatusCode(code: functions.https.FunctionsErrorCode): number {
    switch (code) {
        case 'ok': return 200;
        case 'cancelled': return 499;
        case 'unknown': return 500;
        case 'invalid-argument': return 400;
        case 'deadline-exceeded': return 504;
        case 'not-found': return 404;
        case 'already-exists': return 409;
        case 'permission-denied': return 403;
        case 'resource-exhausted': return 429;
        case 'failed-precondition': return 400;
        case 'aborted': return 409;
        case 'out-of-range': return 400;
        case 'unimplemented': return 501;
        case 'internal': return 500;
        case 'unavailable': return 503;
        case 'data-loss': return 500;
        case 'unauthenticated': return 401;
        default: return 500;
    }
}
