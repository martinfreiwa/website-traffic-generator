# Admin Pricing & Plans Implementation Plan

**Component**: `AdminPricing.tsx`
**Route**: `/admin/pricing`

## Purpose
Centralized control over credit packages, subscription tiers, and dynamic pricing rules.

## Features
*   [ ] **Package Manager**: CRUD interface for credit bundles (e.g., "Seed", "Growth", "Scale").
*   [x] **Base Rate Config**: Set the global cost-per-credit (CPC).
*   [x] **Subscription Tiers**: Define monthly recurring plans (features + credits).

## Planned Improvements
*   [ ] **Dynamic Pricing**: "Surge pricing" multiplier during high load.
*   [ ] **Volume Discounts**: Auto-calculate bulk discount tiers (e.g., >10k credits = 10% off).
*   [ ] **Country Adjustments (PPP)**: Set purchasing power parity discounts (e.g., -40% for India).
*   [ ] **Promo Overlay**: Add "LIMITED TIME" badges to specific packages.
*   [ ] **Currency Support**: Manual exchange rates for non-USD billing.
*   [ ] **Trial Config**: Define default free trial credit amount.
*   [ ] **Add-on Pricing**: Set costs for premium features (e.g., Residential Proxies = 2x credits).
*   [ ] **Custom Plan Builder**: Calculator to generate custom enterprise quotes.
*   [ ] **Price Testing**: A/B test different price points for specific cohorts.
*   [ ] **Legacy Plans**: Manage grandfathered pricing for older users.
*   [ ] **Tax Rules**: Toggle VAT/GST added on top or inclusive.
*   [ ] **Minimum Deposit**: Set the floor for custom credit purchases.
*   [ ] **Refund Policy Text**: Edit the pricing page disclaimer.
*   [ ] **Competitor Compare**: Update the "Us vs Them" comparison table data.
*   [ ] **Stripe Product Sync**: Button to push local pricing config to Stripe.
*   [ ] **Hidden Tiers**: Create secret plans accessible only via direct link.
