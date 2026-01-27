# 🚀 Traffic Nexus: Strategic Roadmap
*Precision Traffic Generation & Behavioral Analytics Emulation*

This roadmap outlines the evolution of Traffic Nexus from a core emulator to a full-scale, premium traffic management platform.

---

## 🛠 Tech Stack (Target)
- **Frontend**: React.js (Vite) + TailwindCSS for sleek, modern UI.
- **Backend**: FastAPI (Python) for high-performance async processing.
- **Database**: PostgreSQL for robust project and user management.
- **Task Queue**: Redis + Celery for managing concurrent visitor simulations at scale.
- **Infrastructure**: Proxy rotation engine for residential/mobile IP integrity.

---

## 📍 Phase 1: Core Foundation & Project Management
*Goal: Move from hard-coded scripts to a manageable multi-project system.*

- [x] **Multi-Project Architecture**: Create, edit, and delete projects with unique targets.
- [x] **Advanced Scheduling Controls**:
    - [x] Set **Start & End Dates** for projects.
    - [x] **Recurring Schedule**: Set specific hours of operation (e.g., Active only 9 AM - 5 PM).
    - [x] Pause/Resume logic with state persistence.
- [x] **Demo Mode Activation**: 
    - [x] Auto-provision 2,000 free visitors for new accounts.
    - [x] Sandbox environment to test "Dry Runs" without GA tracking.
- [x] **Tiered Logic**: Implement Professional vs. Economy feature gating.
- [x] **Basic API Integration**: (Current) FastAPI endpoints for start/stop control.

## 🕵️ Phase 2: Stealth & Infrastructure
*Goal: Ensure 0% detection rate by analytics platforms and firewalls.*

- [x] **Proxy Management System**:
    - [x] Support for **Residential & Mobile Proxies** (essential for high-tier realism).
    - [x] Geo-aware proxy selection (match IP location to traffic settings).
- [x] **Deep Fingerprinting**:
    - [x] **HTTP Headset**: Randomized User-Agents, `Accept-Language`, and `Sec-CH-UA` headers.
    - [x] **Client-Side Simulation**: Emulate screen resolutions, color depths, and hardware concurrency variables.
    - [ ] **Canvas/WebGL Masking**: Add subtle noise to bypass advanced bot detection.

## 🎯 Phase 3: Surgical Targeting & Sources
*Goal: Provide users with granular control over traffic origins.*

- [x] **Global Geo-Targeting**:
    - [x] Selectable countries list - *Added to Proxy & Project settings.*
    - [x] **City-level precision** (Professional Tier): Target specific metropolitan areas using residential proxy filters.
- [x] **Traffic Source Presets**:
    - [x] **Organic Search**: Keyword-based simulation (Google, Bing, Yahoo).
    - [x] **Social Media**: Referral spoofing (Facebook, Twitter/X, Instagram, LinkedIn, Reddit).
    - [x] **UTM Tag Builder**:
        - [x] Automated UTM injection (`utm_source`, `utm_medium`, `utm_campaign`).
        - [x] **Dynamic Variable Injection**: Support for `{{random_keyword}}`, `{{timestamp}}`, or `{{device_type}}` in UTM fields.
    - [x] **Direct/Referral**: Custom URL spoofing for specific backlink verification.
- [x] **Device Distribution**: Set percentages for Desktop vs. Mobile vs. Tablet traffic.

## 🧠 Phase 4: Behavioral Intelligence
*Goal: Mimic human browsing patterns to perfection.*

- [x] **Variable Session Duration**: 
    - [x] Use Gaussian distribution for "natural" randomization.
- [x] **Deep Navigation (Multi-Page)**:
    - [x] Automatically discover internal links and "click" through them.
    - [x] Configure 1-5 page views per unique session.
- [x] **Event Emulation**:
    - [x] Simulate scrolls, mouse movements, and idle time.
    - [x] Custom GA4 event triggers (e.g., `user_engagement`, `scroll`).
- [x] **Idle/Active State Transitions**: Emulate tab switching or backgrounding behavior to break continuous engagement patterns.

## 📈 Phase 5: Volume & Circadian Scheduling
*Goal: Automate traffic flow to match real-world usage patterns.*

- [x] **Smart Scheduling**:
    - [x] **Circadian Rhythms**: Automated volume curves (e.g., peak at 2 PM, low at 3 AM).
    - [x] **Weekly Cycles**: Lower traffic on weekends (50% reduction).
- [x] **Volume Capping**: Hard daily limits to prevent budget overages or sudden spikes.
- [x] **Interval Jitter**: Micro-randomization of arrival times to break any detectable "heartbeat" patterns.

## 🖥 Phase 6: Premium Dashboard (The "WOW" Factor)
*Goal: A world-class interface that feels premium and powerful.*

- [x] **Real-Time Visualization**:
    - [x] Live SVG maps showing active visitor origins - *Integrated Global Monitor.*
    - [x] High-fidelity charts (Recharts/Chart.js) for hit success rates.
- [x] **Live Activity Feed**: A scrolling log of "Current Visitors" (simulated for UI).
- [x] **Status Monitoring**: Health-check for target URLs and GA4 Tag detection.
- [ ] **Project Performance Reports**: Exportable PDF/CSV summaries of traffic delivery.
- [x] **White-Label API**: Comprehensive documentation for enterprise integrations.

## ⚡ Phase 7: Advanced Conversion & Interaction (NEW)
*Goal: Move beyond page views to full interactive engagement.*

- [ ] **Form Fill Simulation**: Emulate inputs, focus/blur events, and form submissions to trigger lead conversion signals.
- [ ] **Dynamic Path Discovery**: Intelligent crawler that identifies conversion paths and mimics user journeys toward "Goal" pages.
- [ ] **Custom Event Sequences**: Define specific chains of events (e.g., Click 'Add to Cart' -> Wait 5s -> Click 'Checkout').

## 🌎 Phase 8: Global Expansion & Enterprise (NEW)
*Goal: Scale to support business-critical operations and teams.*

- [ ] **Multi-User Collaboration**: Role-based access control for teams to manage shared projects.
- [ ] **Advanced Proxy Intelligence**: Intelligent routing based on latency and success history.
- [ ] **Webhook Notifications**: Real-time alerts to external systems for project completion or issues.

---

### Legend
- [x] Completed
- [/] In Progress
- [ ] To Do
- [!] High Priority / Security Critical
