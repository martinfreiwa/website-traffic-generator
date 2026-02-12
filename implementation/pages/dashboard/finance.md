# Finance & Billing Implementation Plan

**Components**: `Billing.tsx`, `Balance.tsx`, `BuyCredits.tsx`
**Routes**: `/dashboard/billing`, `/dashboard/buy-credits`

## Purpose
Manages user funds, transaction history, and credit purchasing.

## Features
*   [ ] **Balance Display**: Current available credits.
*   [ ] **Transaction History**: List of all deposits and expenditures.
*   [ ] **Buy Credits**: Integration with payment gateway (Stripe/PayPal/Crypto).
*   [ ] **Invoices**: Downloadable PDF invoices.

## Planned Improvements
*   [ ] **Auto-Recharge**: Automatically buy credits when balance drops below threshold.
*   [ ] **Spending Graph**: Visual breakdown of credit usage over time.
*   [ ] **Coupon Wallet**: Interface to manage and apply active discount codes.
*   [ ] **Crypto Payment Support**: Direct wallet connection (Metamask).
*   [ ] **Low Balance Alert**: Email trigger when credits drop below X.
*   [ ] **VAT Toggle**: Mechanism to handle EU VAT numbers/exemptions.
*   [ ] **Predictive Runout**: "At current rate, your credits will expire in X days."
*   [ ] **Spending Limits**: Set a daily max credit usage cap.
*   [ ] **Currency Toggle**: View prices in USD/EUR/GBP.
*   [ ] **Tax Certificate**: Generate a year-end tax statement.
*   [ ] **Payment Methods**: "Save card for future use" checkbox.
*   [ ] **Refund Request**: Button to request refund on a specific transaction (creates ticket).
*   [ ] **Credit Transfer**: Allow transferring credits to another user email.
*   [ ] **Promo Box**: "Enter code" field prominently displayed.
*   [ ] **Plan Upgrade**: "Upgrade to Pro for 20% cheaper credits" upsell.
*   [ ] **Receipt Email**: "Send receipt to [email]" input for every purchase.
*   [ ] **Transaction Filter**: Filter history by "Deposit", "Spend", "Refund".
*   [ ] **Export CSV**: Download full transaction history.
*   [ ] **Cost Per Day**: "You spend average $5.40/day".
*   [ ] **Credit Calculator**: "How many credits do I need for 10k hits?" tool.
*   [ ] **Subscription Toggle**: Switch between "Pay as you go" and "Monthly Plan".
*   [ ] **Failed Payment Log**: Show list of declined attempts with reason.
*   [ ] **Billing Address**: Manage separate billing address for invoices.
*   [ ] **Purchase Order**: Upload PO functionality for enterprise.
*   [ ] **Sponsorship**: "Gift credits to a friend" flow.
*   [ ] **Apple Pay / Google Pay**: One-touch checkout integration.
*   [ ] **Credit Expiry**: "Credits expire on [Date]" warning (if applicable).
*   [ ] **Bulk Discount**: Visual table showing "Buy more, save more" tiers.
*   [ ] **Auto-Invoice Email**: "Email me invoices automatically" toggle.
*   [ ] **Custom Amount**: Allow typing exact credit amount to buy.
*   [ ] **Price Alert**: Notify me if credit price changes.
*   [ ] **Transaction Notes**: User can add memo to transaction (e.g., "Client X project").
*   [ ] **Pending Status**: Show crypto payments waiting for block confirmation.
*   [ ] **Retry Payment**: One-click retry on failed card charge.
*   [ ] **Wire Instructions**: Show bank details for large manual transfers.
*   [ ] **Balance History**: Line chart of wallet balance over time.
*   [ ] **Top Up Reminder**: "Add to calendar" for monthly manual payments.
*   [ ] **Expiring Card**: "Your card expires next month" banner.
*   [ ] **Currency Display**: "Show roughly in BTC" toggle.
*   [ ] **Terms Link**: Link to "Refund Policy" near buy button.
*   [ ] **Max Purchase**: Limit single transaction size (fraud prevention).
*   [ ] **Guest Checkout**: Allow buying credits without full login (email only).
*   [ ] **Donation**: "Donate 1% to charity" checkbox (CSR).
*   [ ] **Refund Status**: Tracker for refund processing stages ("Approved -> Sent").
*   [ ] **Billing Contacts**: Add multiple emails to receive invoices.
*   [ ] **Cost Center**: Tag expenses to a department (Enterprise).
*   [ ] **Spend Alerts**: "Notify if spend > $1000/month".
*   [ ] **Tier Progress**: "Spend $50 more to reach Gold status".
*   [ ] **API Credits**: Separate display for API-specific quota.
*   [ ] **Legacy Credits**: Support for old credit system if migrating.

