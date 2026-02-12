# Admin Affiliate Program Implementation Plan

**Components**: `AdminAffiliates.tsx`, `AdminPayouts.tsx`
**Routes**: `/admin/affiliates`, `/admin/payouts`

## Purpose
Manage the affiliate marketing program, track referrals, and process payouts.

## Features
*   [ ] **Affiliate List**: List of all users with affiliate activity.
*   [ ] **Payout Requests**: Queue of users requesting withdrawal.
*   [ ] **Commission Config**: Global settings for referral % and cookie tracking.

## Planned Improvements
*   [ ] **Payout Approval**: One-click approve/reject for payout requests.
*   [ ] **Fraud Detection**: Flag self-referrals (same IP/Fingerprint).
*   [ ] **Top Affiliates**: Leaderboard of highest performing partners.
*   [ ] **Custom Rates**: Set specific commission % for VIP affiliates.
*   [ ] **Marketing Assets**: Upload banners/zips for affiliates to use.
*   [ ] **Referral Tree**: Visual graph of who referred whom (multi-level).
*   [ ] **Manual Attribution**: Manually assign a user to an affiliate.
*   [ ] **Commission Override**: Manually add specific commission amount.
*   [ ] **Bulk Payout**: Export "Mass Pay" CSV for PayPal/Wise.
*   [ ] **Clawtback**: Reverse commission if referred payment is refunded.
*   [ ] **Notification System**: Alert affiliates "You got a sale!".
*   [ ] **Landing Page A/B**: Track which affiliate links convert best.
*   [ ] **Coupon Tracking**: Attribute sales via coupon code, not just link.
*   [ ] **Payout History**: Audit log of all past payouts.
*   [ ] **Minimum Threshold**: Enforce "Must earn $50 before payout".
*   [ ] **Tax Documents**: Track if W-9/W-8BEN is on file.
*   [ ] **Pending Balance**: Total liability (how much we owe overall).
*   [ ] **Conversion Rate**: Graph of click-to-signup ratio per affiliate.
*   [ ] **Link Generator**: Create deep links for specific affiliates.
*   [ ] **Terms of Service**: Editor for Affiliate Agreement.
*   [ ] **Block Affiliate**: Ban user from program without banning account.
*   [ ] **Auto-Approve**: Toggle to auto-pay trusted affiliates.
*   [ ] **Payment Methods**: Manage supported payout types (Crypto, Bank, etc.).
*   [ ] **Tier Management**: Configure "Gold/Silver" tier thresholds.
*   [ ] **Lifetime vs One-time**: Toggle recurring vs single commission.
*   [ ] **Hold Period**: "Commissions pending for 30 days" (refund buffer).
*   [ ] **Sub-Affiliate**: View 2nd tier earnings (if enabled).
*   [ ] **Traffic Source**: View referrer headers of affiliate clicks.
*   [ ] **Notes**: Internal comments on specific affiliates.
*   [ ] **Email Blast**: Message all affiliates separately from users.
*   [ ] **Dormant Accounts**: List affiliates with 0 clicks in 6 months.
*   [ ] **Registration**: Toggle "Open to Public" vs "Invite Only".
*   [ ] **Bonus System**: "Give $50 bonus" button.
*   [ ] **Contract Status**: Signed/Unsigned status indicator.
*   [ ] **API Access**: Toggle API capability for super-affiliates.
*   [ ] **Pixel Tracking**: Allow affiliates to place pixels (danger: strict validation).
*   [ ] **Campaign ID**: Filter stats by affiliate's sub-campaigns.
*   [ ] **Geo Report**: Map of where affiliate traffic comes from.
*   [ ] **Device Report**: Mobile/Desktop breakdown for referrals.
*   [ ] **Link Rotator**: System to rotate destination URL for affiliates.
*   [ ] **Vanity URL**: Approve/Reject custom slug requests.
*   [ ] **Creative Performance**: Stats on which banner image works best.
*   [ ] **Whitelabel Portal**: Host affiliate dash on `partners.domain.com`.

