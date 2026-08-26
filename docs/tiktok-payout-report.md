# TikTok Payout Report — Sheet Reference

Source: `Sample_TikTok_Payout_Report.xlsx`
Period: 2025/10/01–2025/10/31 · Timezone UTC+7 · Currency THB

---

## 1. Order details (61 columns)

| # | Column Name | Sample Value (Row 1) |
|---|---|---|
| 1 | Order/adjustment ID | 580929570514634000 |
| 2 | Type | Order |
| 3 | วันที่VAT/Order created time | 2025/10/27 |
| 4 | เวลาที่คำสั่งซื้อเสร็จสมบูรณ์/Order settled time | 2025/10/31 |
| 5 | Currency | THB |
| 6 | ยอดรับเงิน/Total settlement amount | 191.18 |
| 7 | ยอดรวมvat/Total Revenue | 229 |
| 8 | Subtotal after seller discounts | 229 |
| 9 | Subtotal before discounts | 718 |
| 10 | Seller discounts | -489 |
| 11 | Refund subtotal after seller discounts | 0 |
| 12 | Refund subtotal before seller discounts | 0 |
| 13 | Refund of seller discounts | 0 |
| 14 | Total Fees | -37.82 |
| 15 | Transaction fee | -7.35 |
| 16 | TikTok Shop commission fee | -14.7 |
| 17 | Credit card installment - Interest rate cost | 0 |
| 18 | Seller shipping fee | 0 |
| 19 | Actual shipping fee | -48 |
| 20 | Platform shipping fee discount | 48 |
| 21 | Customer shipping fee | 0 |
| 22 | Actual return shipping fee | 0 |
| 23 | Refunded customer shipping fee | 0 |
| 24 | Shipping subsidy | 0 |
| 25 | Affiliate Commission | 0 |
| 26 | Affiliate commission before PIT (personal income tax) | 0 |
| 27 | Personal income tax withheld from affiliate commission | 0 |
| 28 | Affiliate partner commission | 0 |
| 29 | Affiliate Shop Ads commission | 0 |
| 30 | Affiliate Shop Ads commission before PIT | 0 |
| 31 | Personal income tax withheld from affiliate Shop Ads commission | 0 |
| 32 | Affiliate commission deposit | 0 |
| 33 | Affiliate commission refund | 0 |
| 34 | Affiliate Partner shop ads commission | 0 |
| 35 | SFP service fee | 0 |
| 36 | Bonus cashback service fee | 0 |
| 37 | LIVE Specials service fee | 0 |
| 38 | Voucher Xtra service fee | 0 |
| 39 | EAMS Program service fee | 0 |
| 40 | Brands Crazy Deals/Flash Sale service fee | 0 |
| 41 | TikTok PayLater program fee | 0 |
| 42 | Commerce growth fee | -14.7 |
| 43 | Infrastructure fee | -1.07 |
| 44 | Campaign resource fee | 0 |
| 45 | Pre-order service fee | 0 |
| 46 | *(blank spacer column)* | |
| 47 | Ajustment amount | 0 |
| 48 | Related order ID | 580929570514634044 |
| 49 | Customer payment | 229 |
| 50 | Customer refund | 0 |
| 51 | Seller co-funded voucher discount | 0 |
| 52 | Refund of seller co-funded voucher discount | 0 |
| 53 | Platform discounts | 0 |
| 54 | Refund of platform discounts | 0 |
| 55 | Platform co-funded voucher discounts | 0 |
| 56 | Refund of platform co-funded voucher discounts | 0 |
| 57 | Seller shipping fee discount | 0 |
| 58 | Estimated package weight (g) | 2000 |
| 59 | Actual package weight (g) | 2000 |
| 60 | Shopping center items | 1732629772161615465 * 1; / 1732102793276524137 * 1; |
| 61 | Customer's bank for payment | *(blank)* |

**Total rows: 2003 data rows (2004 including header)**

---

## 2. Withdrawal records (7 columns)

| # | Column Name | Sample Value (Row 1) |
|---|---|---|
| 1 | Type | Withdrawal |
| 2 | Reference ID | 3522034219317823081 |
| 3 | Request time | 2025/10/31 |
| 4 | Amount | -8206.12 |
| 5 | Status | Transferred |
| 6 | Success time | 2025/10/31 |
| 7 | Bank account | ********2101 |

**Total rows: 60 data rows (61 including header)**

Note: this sheet interleaves two `Type` values — `Withdrawal` (money moved out to bank, negative amount) and `Earnings` (settlement moved into balance, positive amount).

---

## 3. Fees explanation (reference table, not transactional data)

This sheet is a **glossary**: a `Name` → `Explanation` lookup for every field/fee/adjustment type that can appear in "Order details" and "Reports". It has 94 entries. Key groups:

**Core order fields:** Order/adjustment ID, Type, Order created/settled time, Total settlement amount, Subtotal (before/after discounts), Seller discounts, Refund subtotals.

**Fees:** Transaction fee `(customer payment − refund) × rate%`, TikTok Shop commission fee, Credit card installment interest cost, Seller/Actual/Customer shipping fee, Shipping subsidy, Commerce growth fee (capped at 199 THB/item), Infrastructure fee, Campaign resource fee, Pre-order service fee.

**Affiliate fees:** Affiliate Commission, Affiliate partner commission, Affiliate Shop Ads commission (+ PIT withholding variants), Affiliate commission deposit/refund.

**Service program fees:** SFP, Bonus cashback, LIVE Specials, Voucher Xtra, EAMS, Brands Crazy Deals/Flash Sale, TikTok PayLater.

**Adjustment types** (under `Related order ID` / `Ajustment amount`): Shipping fee adjustment/compensation, Chargeback, Customer service compensation, Promotion adjustment, Platform compensation/penalty, Sample shipping fee, Logistics reimbursement, Platform reimbursement, Deductions incurred by seller, Shipping fee rebate, Warehouse service fee, Platform commission adjustment/compensation, Transaction fee adjustment, Campaign Package (+Additional), GMV Payment for Ads/Promote, Stamp Duty (THB 30, per Thai tax law), Other adjustment.

**Additional supporting info:** Customer payment/refund, Seller/Platform co-funded voucher discounts (+refunds), Platform discounts (+refunds), Seller shipping fee discount, Estimated/Actual package weight, Customer's bank for payment, Bill payment/Sales proceed/Bill deduction (negative balance).

*(Full name→explanation pairs preserved in the sheet — ask if you want the complete verbatim list rather than this summary.)*

---

## 4. Reports (period summary — key/value, not a row-based table)

This sheet is a single summary block for the period 2025/10/01–2025/10/31, not a per-record table, so "row 1" doesn't apply here — it's one aggregate snapshot:

| Metric | Value (THB) |
|---|---|
| **Total settlement amount** | 373,876.29 |
| Total Revenue | 446,098.55 |
| Subtotal after seller discounts | 452,277 |
| Subtotal before discounts | 868,121 |
| Seller discounts | -415,844 |
| Refund subtotal after seller discounts | -6,178.45 |
| Refund subtotal before seller discounts | -11,748 |
| Refund of seller discounts | 5,569.55 |
| **Total Fees** | -72,992.26 |
| — Transaction fee | -14,220.53 |
| — TikTok Shop commission fee | -27,880.16 |
| — Credit card installment interest cost | 0 |
| — Seller shipping fee | -294 |
| — Actual shipping fee | -77,543 |
| — Platform shipping fee discount | 75,255 |
| — Customer shipping fee | 2,137 |
| — Actual return shipping fee | -114 |
| — Refunded customer shipping fee | -29 |
| — Shipping subsidy | 0 |
| — Affiliate Commission (+PIT variants) | 0 |
| — SFP service fee | -4,600.47 |
| — Commerce growth fee | -24,240.16 |
| — Infrastructure fee | -1,756.94 |
| — Campaign/Pre-order service fees | 0 |
| **Total adjustments** | 770 |
| — Logistics reimbursement | 518 |
| — Platform reimbursement | 252 |
| — (all other adjustment types) | 0 |

This is effectively the aggregated total of every "Order details" row plus "Withdrawal records" adjustments for the period — useful as a reconciliation check for an import job (sum of imported Order details rows should tie back to these totals).