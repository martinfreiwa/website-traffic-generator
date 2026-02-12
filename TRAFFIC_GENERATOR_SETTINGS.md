# Traffic Generator: Feature & Settings Analysis

## 1. Backend Features (Available)
The backend (`main.py`, `enhanced_hit_emulator.py`) supports a rich set of traffic generation features:

*   **Traffic Sources:**
    *   **Direct**
    *   **Organic Search:** Google, Bing, Yahoo, DuckDuckGo.
    *   **Social Media:** Facebook, Twitter, Instagram, LinkedIn, Reddit, Pinterest, TikTok, YouTube.
    *   **Chatbots (New):** ChatGPT, Perplexity, Claude, Gemini, Copilot, MetaAI, Mistral, Groq.
    *   **Messengers (New):** WhatsApp, Telegram, WeChat, Viber, Signal.
    *   **News Aggregators (New):** Google News, Flipboard, Apple News, Feedly, Pocket.
*   **UTM Tagging:** Support for `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.
    *   **Dynamic Variables:** `{{random_keyword}}`, `{{timestamp}}`, `{{device_type}}`.
*   **Geo-Targeting:**
    *   Country-level targeting (ISO codes).
    *   **State & City-level targeting:** Supported in proxy selection logic.
    *   **Language Mapping:** Automatic `Accept-Language` headers based on target country (e.g., `de-DE` for Germany).
*   **Device & Browser Emulation:**
    *   **Device Types:** Desktop, Mobile, Tablet.
    *   **Browser Preferences:** Chrome, Firefox, Safari, Edge.
    *   **Screen Resolutions:** Realistic resolution pools for each device type.
*   **Behavioral Funnels:**
    *   **Custom Subpages:** Sequential path simulation (first hit -> page 1 -> page 2...).
    *   **Crawled URLs:** Random pool of pages to visit after the landing page.
    *   **Bounce Rate:** Configurable probability to leave after the first page.
    *   **Returning Visitors:** Simulation of returning users with consistent CIDs.
    *   **Time on Page:** Gaussian distribution for natural reading time.

## 2. Frontend Settings (Current)
The current `ProjectDetails.tsx` implements:

*   **Basic:**
    *   Project Name.
    *   Traffic Speed (Daily/Total targets implied).
    *   Bounce Rate & Returning Rate.
*   **Device/OS:**
    *   Desktop/Mobile Split (Slider).
    *   Specific OS Selection (Windows, MacOS, Linux, iPhone, Android).
    *   *Missing:* Tablet specific weight, Browser preference (Chrome/Firefox/etc).
*   **URLs:**
    *   Entry URLs, Inner URLs, Exit URLs (Text areas).
    *   *Disconnect:* Frontend saves these as strings (`entryUrls`, `innerUrls`), but Backend emulator looks for `customSubpages` and `crawledUrls` arrays.
*   **Geo:**
    *   Country List (Searchable ISO).
    *   Percentage split per country.
    *   *Missing:* State & City inputs.
*   **Traffic Source:**
    *   List of sources including Organic, Social, and specific Chatbots.
    *   Referrer URLs input.
    *   Keywords input (for Organic).
*   **Tech Support:**
    *   Browser Languages (Multi-select).
    *   Timezone.
    *   Google Analytics ID (with Auto-scan).

## 3. Missing Settings & Implementation Plan

To fully bridge the gap between Frontend UI and Backend capabilities, the following settings need to be added or fixed in `ProjectDetails.tsx`:

### A. UTM Parameter Configuration
**Priority: High**
The backend supports dynamic UTM tags, but the frontend has no interface for them.

*   **Add UI Section:** "Tracking & Attribution"
*   **Fields:**
    *   `utm_source` (Input)
    *   `utm_medium` (Input)
    *   `utm_campaign` (Input)
    *   `utm_term` (Input)
    *   `utm_content` (Input)
*   **Features:** Helper chips to insert `{{random_keyword}}`, `{{timestamp}}`, `{{device_type}}`.

### B. Logical URL Mapping (Fix Disconnect)
**Priority: Critical**
The backend emulator expects `customSubpages` (list) for sequential funnels and `crawledUrls` (list) for random visits. The frontend currently saves loose strings.

*   **Update Save Logic:** In `handleSave`, parse the `innerUrls` textarea:
    *   Split by newline.
    *   Save as `customSubpages` (if the intent is sequential) OR `crawledUrls` (if the intent is random pool).
    *   *Recommendation:* Add a toggle "Visit Order: Sequential vs Random" to decide which backend field to populate.

### C. Advanced Geo-Targeting (State/City)
**Priority: Medium**
Backend proxy logic filters by Country -> State -> City.

*   **Update Geo Table:** Validating/Selecting State and City is complex without a database of all global cities.
*   **Proposed UI:** Allow optional free-text inputs for "State/Region" and "City" next to the Country selection row in the "Advanced Location" section.
*   **Data Structure:** Update `GeoTarget` type to include optional `state?: string` and `city?: string`.

### D. Granular Device & Browser Control
**Priority: Low**
Backend allows detailed weights (`desktop`, `mobile`, `tablet`) and browser preference.

*   **Update UI:**
    *   Add "Tablet" to the Device Split slider (or change to 3 number inputs summing to 100%).
    *   Add "Browser Preference" Dropdown: `Random (Default)`, `Chrome`, `Firefox`, `Safari`, `Edge`.

### E. Proxy Configuration
**Priority: High**
The backend needs proxies to run specific geo-targeting effectively. Use `main.py`'s `ProxyResponse` model data.

*   **Add UI Section:** "Proxy Settings"
*   **Fields:**
    *   "Proxy Mode": `Auto-Rotate by Location` (Default), `Sticky Session`, `Custom List`.
    *   If `Custom List`: Textarea for `ip:port:user:pass`.

### F. Simulation Duration / Schedule
**Priority: Medium**
For Ad-hoc runs, the backend accepts `duration_mins`.

*   **Update UI:** In "Basic Settings" or a new "Schedule" tab.
*   **Fields:**
    *   "Operation Mode": `Continuous (Daily Limits)` vs `Scheduled Burst`.
    *   If `Scheduled Burst`: Date/Time picker and Duration (minutes).
