# Laco Invoice — Marketing Overview & Website Implementation Roadmap

> **Document Status:** Comprehensive Gap Analysis & Action Plan  
> **Source Documents Analyzed:**  
> - `laco-invoice/output/pdf/Laco_Invoice_Marketing_Overview.pdf` (Rendered 6-page sales brochure)  
> - `laco-invoice/docs/MARKETING_PRICING.md` (Marketing & Pricing Guide)  
> - `laco-invoice/tmp/pdfs/build_laco_marketing_pdf.py` (PDF generation script)  
> - `laco-invoice/client/src/features/marketing/` (`marketing-page.tsx`, `marketing-copy.ts`, `marketing-page.css`)  
> - `laco-invoice/client/index.html` & `app-router.tsx`  
> - `laco-invoice/server/` (Backend feature status & database architecture)  
>
> **Target Audience:** Product Management, Marketing, Frontend Engineering, Sales Operations.

---

## 1. Executive Summary

Laco Invoice currently possesses a cohesive marketing narrative ("*Every marketplace order, invoice ready*") and a live trilingual landing page (`en`, `th`, `zh`) integrated into the React application. The pricing model (Starter ฿990, Growth ฿2,490, Scale ฿4,990, Enterprise Custom) is structured around marketplace sellers (TikTok Shop, Shopee, Lazada, Amazon) in Thailand and Southeast Asia.

However, an in-depth audit reveals **significant gaps** between:
1. **The Marketing Overview (PDF/Markdown Guide):** Contains detailed persona pitches, 5-step workflows, add-on pricing, assisted onboarding packages, ERP voucher handoffs, demo scripts, objection handling, and sales qualify questions.
2. **The Marketing Website (`client` frontend):** Presents only a high-level summary with a simplified 3-step workflow, no add-ons table, no interactive pricing calculator, no real screenshots/video, an incomplete Enterprise contact flow (plain `mailto:` link), no lead capture, and missing technical SEO / analytics tags.
3. **Product & Operational Infrastructure:** Subscription billing, usage metering (per-store and per-invoice quota enforcement), and automated self-service onboarding are not yet connected to the marketing funnel.

This document outlines **what needs to be implemented next**, organized into four distinct workstreams:
- **Stream 1: Marketing Website Enhancements (UI/UX & Content)**
- **Stream 2: Marketing Collateral & Sales Enablement (Assets to Create)**
- **Stream 3: Growth, SEO & Conversion Optimization (Technical Marketing)**
- **Stream 4: Commercial & Billing Infrastructure (Product Alignment)**

---

## 2. Stream 1: Marketing Website Enhancements (Frontend UI/UX)

The current marketing page at `/` (`MarketingPage`) is visually polished but leaves out critical elements that exist in the Marketing Overview document.

### 2.1 Add-ons & Volume Overages Section (High Priority)
* **Current State:** The website only lists base monthly prices in the 3 cards. The ฿0.90 overage is buried in FAQ #2, while add-ons are completely absent from the UI.
* **What to Implement:**
  - Create a dedicated **"Optional Add-ons"** section directly underneath the pricing grid.
  - Display the four official add-on tiers from `MARKETING_PRICING.md`:
    1. **Additional Marketplace Store:** ฿390 / store / month
    2. **Additional Invoice Capacity:** ฿0.90 / invoice (with transparent pay-as-you-go explanation)
    3. **Assisted Onboarding Package:** ฿4,900 one-time (guided store link, SKU mapping, document template setup, staff training)
    4. **Dedicated ERP Workflow Workshop:** ฿12,000 one-time (custom mapping from orders to ERP accounting vouchers)
  - Provide copy support in `marketing-copy.ts` for English, Thai, and Chinese.

### 2.2 Complete Feature Comparison Matrix (High Priority)
* **Current State:** The 3 pricing cards only show 4–5 bullet points each. Prospects cannot easily compare technical limits across tiers.
* **What to Implement:**
  - An expandable or full-width **"Compare All Plans"** table detailing:
    | Feature / Capability | Starter (฿990) | Growth (฿2,490) | Scale (฿4,990) | Enterprise (Custom) |
    | :--- | :---: | :---: | :---: | :---: |
    | **Connected Stores** | 1 | 3 | 10 | Unlimited / Custom |
    | **Monthly Invoices Included** | 300 | 1,500 | 5,000 | Custom volume |
    | **Additional Invoices** | ฿0.90 / doc | ฿0.90 / doc | ฿0.90 / doc | Volume discounts |
    | **Order Synchronization** | Manual / On-demand | Scheduled / Auto | Real-time / High freq | Dedicated workers |
    | **Supported Channels** | TikTok, Shopee, Lazada, Amazon | Same | Same | + Custom / ERP channels |
    | **VAT & Tax Documents** | 7% VAT Tax Invoice & Receipt | Same | Same | Custom tax rules / e-Tax |
    | **Sequential Document No.** | Yes (`INV-yyyyMM-######`) | Yes | Yes | Custom prefix & sequence |
    | **Export Capabilities** | Single PDF download | Bulk PDF ZIP Export | Advanced batch workflows | SFTP / Cloud / API push |
    | **ERP Voucher Workflow** | — | CSV / Excel ready | Advanced voucher prep | Automated ERP sync |
    | **User Seats** | 1 user | 3 users | 10 users (RBAC) | Unlimited / Custom roles |
    | **Support Level** | Standard email | Priority email | Priority email + phone | Dedicated success manager |

### 2.3 Align Workflow Steps (5-Step Lifecycle vs. 3-Step)
* **Current State:** The website displays 3 steps (*Connect store*, *Keep orders current*, *Issue and export*). The marketing overview PDF features a more compelling 5-step journey that explicitly solves the finance bottleneck.
* **What to Implement:** Update the `how-it-works` section to reflect the complete 5 steps:
  1. **Connect your store** (Instant marketplace API authorization)
  2. **Keep orders current** (Automated synchronization & unified order dashboard)
  3. **Issue the document** (Generate compliant 7% VAT tax invoices and receipts)
  4. **Share or archive** (Bulk ZIP packaging for auditors, customers, or tax filing)
  5. **Keep finance moving** (ERP voucher preparation without ERP latency)

### 2.4 Dedicated Persona / "Who It Is For" Section
* **Current State:** The website hero copy is generic. The overview PDF highlights 3 distinct stakeholder value propositions.
* **What to Implement:** Add a tabbed or 3-column audience card section:
  - **For Marketplace Operations Teams:** Stop toggling between TikTok Shop, Shopee, and Lazada seller portals. Search, filter, and track order fulfillment in one unified inbox.
  - **For Finance & Accounting Teams:** Accurate 7% VAT calculation, sequential numbering, zero manual copy-pasting into spreadsheets, and ready-to-import voucher data.
  - **For Business Owners & Directors:** Clear audit trail, scalable plan capacity, no per-user lockouts, and rapid month-end financial closing.

### 2.5 Spotlight on the "ERP Voucher Workflow" (Unique Value Proposition)
* **Current State:** The website mentions "ERP voucher workflow support" only as a bullet item in the Growth plan.
* **What to Implement:**
  - Build a visual feature spotlight explaining **how Laco Invoice decouples invoicing from ERP slowness**:
    - Step A: Synchronize ERP master data (SKUs, chart of accounts, customers) via Excel/CSV or API into Laco Invoice.
    - Step B: Operations issues invoices instantly using cached local master data.
    - Step C: Finance exports or pushes voucher packages to SAP, Express, Odoo, or Dynamics at month-end without blocking daily operations.

### 2.6 Interactive Pricing & ROI Savings Calculator
* **Current State:** Static pricing cards.
* **What to Implement:**
  - Add interactive sliders:
    - **Slider 1:** Number of marketplace storefronts (1 to 25+)
    - **Slider 2:** Average monthly orders/invoices (100 to 20,000+)
  - **Dynamic Output:**
    - Automatically highlights the recommended plan (e.g., Growth + 1 extra store).
    - Calculates estimated monthly cost (both monthly and 15% discounted annual).
    - Computes **Estimated Hours Saved** (e.g., based on average 3 minutes per manual invoice in Excel = X hours/month saved).

### 2.7 Interactive Lead Capture Modal for Enterprise & Inquiries
* **Current State:** "Talk to sales" opens a native `mailto:sales@laconic.co.th` link, leading to high drop-off rates on mobile and webmail users.
* **What to Implement:**
  - Modal form triggered by "Talk to sales" and "Custom terms":
    - Fields: Full Name, Company / Store Name, Work Email, Phone / LINE ID, Current Marketplaces (checkboxes), Estimated Monthly Volume.
    - Submission feeds into backend contact API or CRM webhook (Slack / email notification).
    - Instant confirmation dialog with a calendar link (e.g., Google Meet / Cal.com) for a 15-minute product demonstration.

### 2.8 Rich Product Media: Real UI Screenshots & Interactive Tabs
* **Current State:** The hero shows a simplified CSS mockup of a dashboard.
* **What to Implement:**
  - Replace or enhance the CSS mockup with **interactive product tabs**:
    - **Tab 1: Unified Orders Inbox** (show live filtering across TikTok Shop, Shopee, Lazada)
    - **Tab 2: Tax Invoice & Receipt Generator** (show clean Thai VAT 7% preview with QR/barcode)
    - **Tab 3: Bulk ZIP Export & History** (show one-click download for 500+ documents)
    - **Tab 4: ERP Voucher Review** (show mapped accounts ready for export)
  - Add a lightweight video or animated GIF walkthrough demonstrating the 5-minute flow.

### 2.9 Expanded Header & Footer Navigation
* **Current State:** Footer only has brand logo, slogan, and copyright. Header has only section anchor links.
* **What to Implement:**
  - **Header:** Add "Integrations" (linking to TikTok, Shopee, Lazada logos), "Pricing", and "Contact".
  - **Multi-Column Footer:**
    - **Product:** Features, Integrations, Pricing, ERP Vouchers, Bulk Export, Changelog.
    - **Solutions:** TikTok Shop Sellers, Shopee & Lazada Stores, Accounting & Finance Teams.
    - **Resources:** Documentation, Marketing Overview PDF (direct download link!), API Docs, Help Center.
    - **Company & Legal:** About Laconic, Contact Us, Privacy Policy, Terms of Service, PDPA Compliance statement.
    - **Localization & Contact:** LINE Official Account (@laconic), Office Address, Phone.

---

## 3. Stream 2: Marketing Collateral & Sales Enablement

Beyond the live web page, the sales team and partners require downloadables, one-pagers, and presentation decks to close deals.

### 3.1 1-Page Executive Sales Sheet (One-Pager Leave-Behind)
* **Goal:** A single-page PDF that an account executive can leave behind or email to a prospect's CFO or Operations Manager.
* **Contents:**
  - Top: Logo, headline ("*Every marketplace order, invoice ready*"), and 3 core value props.
  - Middle: High-level screenshot + 4-column pricing summary.
  - Bottom: Supported marketplaces, ERP compatibility notes, contact details, and QR code to book a demo.
* **Action:** Create a script `laco-invoice/tmp/pdfs/build_laco_sales_one_pager.py` using ReportLab to generate `Laco_Invoice_Sales_One_Pager.pdf`.

### 3.2 Marketplace-Specific Solution Sheets
* Create targeted 2-page brochures or landing sub-routes for individual marketplaces:
  - **TikTok Shop Invoicing Guide:** Explaining settlement report reconciliation, handling TikTok platform discounts vs seller discounts, and issuing official tax invoices for live-stream orders.
  - **Shopee & Lazada Invoicing Sheet:** Explaining withholding tax (WHT) deductions, shipping fee reconciliations, and marketplace commission voucher formatting.

### 3.3 Sales Pitch Deck (10–12 Slides)
* Create a polished presentation deck (PowerPoint / PDF) for enterprise sales meetings based on the 5-minute demo structure in `MARKETING_PRICING.md`:
  - Slide 1: Title & Vision
  - Slide 2: The Multi-Channel Reality (The Pain: 4 portals, messy Excel files, delayed VAT filing)
  - Slide 3: Introducing Laco Invoice
  - Slide 4: Centralized Order Hub (TikTok Shop, Shopee, Lazada, Amazon)
  - Slide 5: Automatic 7% VAT Tax Invoices & Abbreviated Receipts
  - Slide 6: Bulk Operations (ZIP packaging in seconds)
  - Slide 7: The ERP & Voucher Handoff (Decoupled & reliable)
  - Slide 8: Architecture & Security (Role-based access, data privacy)
  - Slide 9: Customer Stories / Pilot Results
  - Slide 10: Clear & Predictable Pricing (Starter to Scale)
  - Slide 11: Implementation Roadmap & Assisted Onboarding
  - Slide 12: Next Steps & Q&A

### 3.4 Regulatory & Tax Compliance Whitepaper (Thailand Focus)
* Documenting exact compliance with the **Thai Revenue Department (RD)** guidelines:
  - Full Tax Invoice requirements (Section 86/4 of the Thai Revenue Code).
  - Abbreviated Tax Invoice requirements (Section 86/6).
  - Roadmap/clarification on **e-Tax Invoice by Email / e-Tax Invoice by Time Stamp & Digital Signature** vs. PDF tax invoices.

---

## 4. Stream 3: Technical Marketing, SEO & Conversion Tracking

The current website lacks essential technical marketing infrastructure to capture search traffic and measure conversion rates.

### 4.1 Search Engine Optimization (SEO) & Structured Data
* **Current State:** `index.html` has only `<title>Laco Invoice</title>` and `<meta name="viewport">`.
* **What to Implement:**
  - **Meta Tags:**
    ```html
    <title>Laco Invoice — Marketplace Invoicing & Tax Invoice Software for Thailand</title>
    <meta name="description" content="Turn TikTok Shop, Shopee, Lazada, and Amazon orders into compliant 7% VAT tax invoices, receipts, and ERP vouchers in seconds. Explore plans starting from ฿990/month." />
    <meta name="keywords" content="marketplace invoice, tax invoice thailand, tiktok shop tax invoice, shopee tax invoice, lazada receipt, erp voucher, vat 7%" />
    <link rel="canonical" href="https://invoice.laconic.co.th/" />
    ```
  - **Open Graph & Twitter Cards:**
    ```html
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Laco Invoice — Every marketplace order, invoice ready" />
    <meta property="og:description" content="One connected workspace for marketplace orders, 7% VAT tax documents, and ERP voucher handoffs." />
    <meta property="og:image" content="https://invoice.laconic.co.th/og-preview.png" />
    <meta name="twitter:card" content="summary_large_image" />
    ```
  - **JSON-LD Schema Markup:**
    - Add `SoftwareApplication` and `FAQPage` schema to the landing page to enable Google rich snippets for the FAQ accordion and software rating.

### 4.2 Analytics & Conversion Event Tracking
* **What to Implement:**
  - Integrate **Google Tag Manager (GTM)** or **Google Analytics 4 (GA4)**.
  - Implement custom event triggers:
    - `event: 'click_cta'`, `label: 'start_free_hero'`
    - `event: 'click_cta'`, `label: 'start_free_pricing'`, `plan: 'growth'`, `billing: 'annual'`
    - `event: 'toggle_billing'`, `mode: 'annual' | 'monthly'`
    - `event: 'change_language'`, `locale: 'th' | 'en' | 'zh'`
    - `event: 'open_faq'`, `question: string`
    - `event: 'contact_sales_opened'`

### 4.3 URL State & Onboarding Funnel Presets
* **Current State:** Clicking "Start free" on any pricing card navigates directly to `/register` with no state.
* **What to Implement:**
  - Pass the selected plan and billing frequency in the query parameters:
    `/register?plan=growth&billing=annual`
  - On `/register`, read query params to display:
    *"You've selected the Growth plan (Annual) — 14-day free trial, no credit card required."*

---

## 5. Stream 4: Commercial & Billing Infrastructure (Product Alignment)

To monetize the marketing page effectively, the underlying software needs to support the commercial promises made in the copy.

### 5.1 Tier Quota & Usage Metering Service
* **Marketing Claim:** Starter = 300 invoices/month, 1 store; Growth = 1,500 invoices/month, 3 stores; Scale = 5,000 invoices/month, 10 stores. Extra invoices at ฿0.90 each.
* **Backend Requirement:**
  - Add subscription/plan tracking to `Company` or `Tenant` entity:
    `plan_type` (`STARTER`, `GROWTH`, `SCALE`, `ENTERPRISE`), `billing_cycle` (`MONTHLY`, `ANNUAL`), `cycle_start_date`, `invoices_used_count`.
  - Guard logic in `POST /api/v1/orders/{orderId}/invoices` and bulk generation:
    - If `invoices_used_count >= plan_limit`: Alert user or record overage counter (`overage_invoice_count * 0.90 THB`).
  - Store connection guard:
    - If active stores >= plan limit, prompt upgrade to connect another store.

### 5.2 Self-Service Billing & Payment Gateway Integration
* **Requirement:**
  - Integrate a Thai payment gateway (e.g., Omise, 2C2P, or Stripe Thailand) supporting:
    1. Credit / Debit Card recurring subscriptions.
    2. PromptPay QR code for upfront annual/monthly payments.
    3. Bank transfer with tax invoice / withholding tax certificate (WHT 3%) upload for corporate B2B clients.

### 5.3 14-Day Free Trial Mode
* **Marketing Claim:** *"Start free • No credit card required • Set up in minutes"*
* **Requirement:**
  - When new users register, assign them a 14-day full-featured trial of the **Growth Plan** (up to 100 trial documents).
  - Display a clean countdown banner in the dashboard header: *"12 days left in your free trial — Upgrade to keep your marketplace stores synced."*

---

## 6. Implementation Prioritization & Roadmap

```
+---------------------------------------------------------------------------------------+
| PHASE 1: IMMEDIATE WINS (1 - 2 Weeks)                                                |
| - Add "Optional Add-ons" table to marketing page (฿390 store, ฿0.90 doc, onboarding)  |
| - Expand Workflow to 5 complete steps (restoring ERP & Bulk ZIP steps)               |
| - Replace mailto: with an Interactive Lead Capture Modal                              |
| - Implement SEO meta tags, OpenGraph images, and canonical URLs                      |
| - Pass query params to /register (?plan=growth&billing=annual)                        |
| - Generate 1-Page Sales PDF Leave-Behind                                              |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 2: CONVERSION & CONTENT DEPTH (3 - 4 Weeks)                                    |
| - Build Expandable Feature Comparison Table (Starter vs Growth vs Scale vs Ent)       |
| - Add Target Personas Section (Operations, Finance, Business Owners)                  |
| - Build Interactive Pricing & ROI Savings Calculator                                  |
| - Create real screenshot tabs / video demo embed                                      |
| - Implement GA4 / GTM event tracking across all CTAs                                  |
| - Publish 10-12 slide Sales Pitch Deck                                                |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 3: PRODUCT & COMMERCIAL AUTOMATION (5 - 8 Weeks)                                |
| - Implement Subscription Plan Entity & Usage Metering in backend                      |
| - Add 14-day Free Trial onboarding guard and trial dashboard banner                  |
| - Payment gateway integration (PromptPay QR & Credit Card recurring)                  |
| - Self-service plan upgrade & add-on purchasing portal in App Settings                |
| - Thai e-Tax Invoice integration roadmap & compliance whitepaper                      |
+---------------------------------------------------------------------------------------+
```

---

## 7. Next Recommended Steps

1. **Review and approve** this roadmap against your current business priorities.
2. **Phase 1 Frontend Sprint:** Update `marketing-page.tsx`, `marketing-copy.ts`, and `marketing-page.css` to add the Add-ons section, 5-step flow, and interactive contact modal.
3. **Run script for One-Pager:** Generate the companion 1-page sales executive sheet in `output/pdf/`.
