# Pricing Strategy & Implementation Plan

**Goal**: Maximize Revenue Per Visitor (RPV) and Conversion Rate (CR).
**Current Status**: Basic tiered model.
**Objective**: Implement one of the following high-performance layouts.

## 🧠 SaaS Pricing Psychology
To drive sales, we must move beyond simple lists. We will implement **3 distinct layout variations** to test and optimize:

### 🚀 Layout 1: The "Decoy" Grid (Best for Subscription Conversion)
*   **Concept**: Uses the "Decoy Effect" to push users toward the middle tier.
*   **Structure**: 3 Vertical Cards.
    *   **Tier 1 (Anchor Low)**: "Starter" - deliberately limited, makes Tier 2 look like massive value.
    *   **Tier 2 (Hero)**: "Pro" - **Highlighted**, taller card, "Most Popular" ribbon, vibrant CTA. The value/price ratio is mathematically the best here.
    *   **Tier 3 (Anchor High)**: "Agency" - High price establishes premium value, making Tier 2 feel "safe".
*   **Key Feature**: "Savings" badge when toggling Annual billing (e.g., "Save €180").
*   **Why it sells**: Reduces decision paralysis by clearly indicating the "correct" choice.

### 🎚️ Layout 2: The "Volume" Slider (Best for Impulse/Specific Needs)
*   **Concept**: Puts the user in control, reducing the fear of overpaying.
*   **Structure**: Large horizontal slider for "Monthly Visitors".
    *   **Dynamic Pricing**: As the slider moves right, the price updates instantly.
    *   **Feature Reveal**: Higher traffic volumes unlock "hidden" features (e.g., sliding past 50k visitors unlocks "Residential Proxies").
*   **Why it sells**: Gamification. Users enjoy interacting with the pricing. It feels tailored (Custom vs Cookie-cutter).

### 👥 Layout 3: The "Persona" Toggle (Best for B2B High Ticket)
*   **Concept**: Segment users immediately to show relevant high-value propositions.
*   **Structure**: Top-level Segment Toggle: "For Individuals" vs "For Agencies".
    *   **Individuals View**: Shows "Pay-As-You-Go" credit packs. Focus on speed and ease.
    *   **Agencies View**: Shows "Monthly Subscriptions". Focus on API, white-label, and bulk stability.
*   **Why it sells**: Relevance. Agencies don't want to see $29 plans; they want scale. Individuals don't want contracts.

---

## ✅ Recommended Implementation: "The Hybrid"
We will combine **Layout 1 (Grid)** and **Layout 2 (Slider)** for maximum effect.

1.  **Top Section**: A simplified **3-Card Grid** (Layout 1) for standard users who just want to pick and go.
2.  **Middle Section**: An **"Enterprise Calculator"** (Layout 2) for power users who need >1M hits.
3.  **Bottom Section**: Feature Comparison Table (Trust builder).

## 🛠️ Feature Matrix & Upsells
*   **The "Scarcity" Timer**: Sticky banner for "20% Off - Offer ends in 4h" (Cookie-based).
*   **The "Reassurance" Guarantee**: "30-Day Money-Back" badge near every Buy button.
*   **The "Social Proof" Injector**: "5 people purchased this plan in the last hour" toast notifications.
