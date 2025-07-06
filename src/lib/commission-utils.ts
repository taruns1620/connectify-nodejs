
// src/lib/commission-utils.ts
import type { Commission } from '@/types'; // Adjust path as necessary

/**
 * Calculates commission splits based on the bill amount, vendor's base commission rate,
 * and whether a referrer is involved.
 *
 * @param billAmount The total amount of the transaction.
 * @param baseCommissionRate The vendor's specific commission rate (e.g., 10 for 10%).
 * @param referrerId The ID of the referrer, or null if no referrer.
 * @returns An object containing all calculated commission splits.
 */
export function calculateCommissionSplits(
    billAmount: number,
    baseCommissionRate: number,
    referrerId: string | null
): Omit<Commission, 'id' | 'paymentGatewayTransactionId' | 'projectId' | 'connectionId' | 'clientId' | 'clientName' | 'vendorId' | 'vendorName' | 'referrerType' | 'transactionType' | 'transactionDate' | 'paymentType' | 'status' | 'payoutStatusClient' | 'payoutStatusReferrer' | 'payoutExpiryTimestamp' | 'disputeReason'> {
    const baseCommissionDecimal = baseCommissionRate / 100;
    const baseCommissionAmount = billAmount * baseCommissionDecimal;
    const hasReferrer = !!referrerId;

    let referrerPayoutRate = 0;
    let clientCashbackRate = 0;

    // Determine payout percentages of the BASE COMMISSION AMOUNT
    if (billAmount <= 30000) {
        if (hasReferrer) {
            referrerPayoutRate = 0.50; // 50% of baseCommissionAmount
            clientCashbackRate = 0.10; // 10% of baseCommissionAmount
        } else {
            clientCashbackRate = 0.20; // 20% of baseCommissionAmount
        }
    } else if (billAmount <= 60000) {
        if (hasReferrer) {
            referrerPayoutRate = 0.40; // 40% of baseCommissionAmount
            clientCashbackRate = 0.10; // 10% of baseCommissionAmount
        } else {
            clientCashbackRate = 0.20; // 20% of baseCommissionAmount
        }
    } else { // billAmount > 60000
        if (hasReferrer) {
            referrerPayoutRate = 0.30; // 30% of baseCommissionAmount
            clientCashbackRate = 0.10; // 10% of baseCommissionAmount
        } else {
            clientCashbackRate = 0.20; // 20% of baseCommissionAmount
        }
    }

    // Calculate actual payout amounts
    const referrerPayout = baseCommissionAmount * referrerPayoutRate;
    const clientCashback = baseCommissionAmount * clientCashbackRate;

    // Calculate Hub Share (remaining of the baseCommissionAmount)
    const hubShare = baseCommissionAmount - referrerPayout - clientCashback;

    // Calculate Vendor Payout (original bill amount minus total base commission amount paid to hub/referrer/client)
    // Vendor always gets their agreed-upon share of the bill minus the *total* commission taken by the platform.
    const vendorPayout = billAmount - baseCommissionAmount;

    // Helper to round to 2 decimal places
    const round = (num: number) => Math.round(num * 100) / 100;

    // Ensure no rounding errors cause discrepancies, adjust hubShare if needed
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
        // referrerId is not directly part of the Commission type Omit,
        // but it's useful for the calling function to know.
        // The calling function will map this to referrerId in the Commission object.
    };
}
