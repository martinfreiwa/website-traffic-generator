# Admin Transactions Implementation Plan

**Components**: `AdminTransactions.tsx`, `AdminEditTransaction.tsx`
**Routes**: `/admin/transactions`

## Purpose
Financial auditing and transaction management.

## Features
*   [ ] **Transaction Log**: All inflows/outflows.
*   [ ] **Edit Transaction**: Correct mistakes, refund manually.
*   [ ] **Status Updates**: Mark pending as completed/failed.

## Planned Improvements
*   [ ] **CSV Export**: Download report for accounting/taxes.
*   [ ] **Refund Integration**: Button to trigger Stripe/PayPal refund directly.
*   [ ] **Fraud Detection**: Flag suspicious transaction patterns.
*   [ ] **User Link**: specific link to the user profile from the transaction.
*   [ ] **Revenue Graph**: Mini bar chart of daily revenue at top of page.
*   [ ] **Profit Margin**: Calculator for "Server Cost" vs "Revenue".
*   [ ] **Chargeback Alert**: Highlight refunded/disputed transactions in red.
*   [ ] **Manual Invoice**: Generate PDF invoice for wire transfer clients.
*   [ ] **Comp Transaction**: Create "0 cost" transaction for bonuses.
*   [ ] **Void Transaction**: Cancel a pending transaction.
*   [ ] **Payment Gateway**: Filter by Stripe, PayPal, Crypto.
*   [ ] **Currency conversion**: View original currency amount vs USD settlement.
*   [ ] **Tax Calculation**: View VAT/Sales Tax portion of transaction.
*   [ ] **Download Receipt**: Admin view of user receipt.
*   [ ] **Resend Receipt**: Email receipt to user again.
*   [ ] **Note Field**: Add internal accounting note.
*   [ ] **Category**: Tag as "Subscription", "One-time", "Refund".
*   [ ] **Dispute Evidence**: Upload files related to a chargeback.
*   [ ] **Gateway ID**: Search by Stripe Payment Intent ID.
*   [ ] **User Email Search**: Search transactions by user email.
*   [ ] **Date Range Picker**: Filter custom period.
*   [ ] **Min/Max Amount**: Filter transactions by value.
*   [ ] **Crypto Hash**: Link to blockchain explorer for crypto payments.
*   [ ] **Subscription ID**: Link to recurring subscription object.
*   [ ] **Proration**: Calculate refund amount for partial usage.
*   [ ] **Ledger View**: Double-entry bookkeeping view.
*   [ ] **Reconciliation**: "Mark as reconciled" checkbox.
*   [ ] **Bulk Refund**: Refund multiple transactions (danger).
*   [ ] **Payment Method**: Show "Visa ****4242".
*   [ ] **IP Address**: Show IP where purchase originated.
*   [ ] **Risk Score**: Show payment gateway risk evaluation.
*   [ ] **Country**: Country of card issuer.
*   [ ] **Failure Reason**: Show why card was declined (e.g. "Insufficient Funds").
*   [ ] **Billing Address**: View full billing details.
*   [ ] **Quick User**: Hover user ID to see mini-profile.
*   [ ] **Affiliate Commission**: Show if this transaction generated a commission.
*   [ ] **Coupon Used**: Show which discount code was applied.
*   [ ] **Net Revenue**: Show amount after fees/taxes.

