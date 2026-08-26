# Order Input Run — ERD & Data Model

> **Status:** Implemented (create → upload 2 Excels → Run files)  
> **Goal:** One titled container holds **Order Detail** (OrderSKUList) + **Total Withdraw** (TikTok Payout Report). Each file has its own run state. **Run files** processes both.

## Naming

| Layer | Name |
|-------|------|
| UI | Order input |
| Table | `order_input_runs` |
| User field | `title` |

`order_import_files` remains the committed Order Detail audit after a successful order-detail run.

## States

**Per file:** `MISSING` | `READY` | `RUNNING` | `SUCCEEDED` | `FAILED` | `PARTIAL`

**Overall:** `DRAFT` | `RUNNING` | `COMPLETED` | `PARTIAL` | `FAILED`

## Tables

- `order_input_runs` — title, store, marketplace, two file BLOBs + statuses, links to batch/import file
- `order_withdraw_import_rows` — one row per TikTok Payout **Order details** Excel row; **each Excel column is a typed DB column** (no `raw_json`)

## Withdraw Excel → DB columns

Primary sheet: **Order details** (see [tiktok-payout-report.md](./tiktok-payout-report.md)). Blank spacer column is skipped.

| Excel column | DB column |
|---|---|
| Order/adjustment ID | `external_order_id` (+ match key) |
| Type | `payout_type` |
| วันที่VAT/Order created time | `order_created_time` |
| เวลาที่คำสั่งซื้อเสร็จสมบูรณ์/Order settled time | `order_settled_time`, `withdraw_at` |
| Currency | `currency` |
| ยอดรับเงิน/Total settlement amount | `total_settlement_amount`, `withdraw_amount` |
| ยอดรวมvat/Total Revenue | `total_revenue` |
| Subtotal after seller discounts | `subtotal_after_seller_disc` |
| Subtotal before discounts | `subtotal_before_discounts` |
| Seller discounts | `seller_discounts` |
| Refund subtotal after seller discounts | `refund_subtotal_after_seller` |
| Refund subtotal before seller discounts | `refund_subtotal_before_seller` |
| Refund of seller discounts | `refund_of_seller_discounts` |
| Total Fees | `total_fees` |
| Transaction fee | `transaction_fee` |
| TikTok Shop commission fee | `tiktok_shop_commission_fee` |
| Credit card installment - Interest rate cost | `cc_installment_interest` |
| Seller shipping fee | `seller_shipping_fee` |
| Actual shipping fee | `actual_shipping_fee` |
| Platform shipping fee discount | `platform_shipping_fee_disc` |
| Customer shipping fee | `customer_shipping_fee` |
| Actual return shipping fee | `actual_return_shipping_fee` |
| Refunded customer shipping fee | `refunded_customer_ship_fee` |
| Shipping subsidy | `shipping_subsidy` |
| Affiliate Commission | `affiliate_commission` |
| Affiliate commission before PIT… | `affiliate_comm_before_pit` |
| Personal income tax withheld from affiliate commission | `pit_withheld_affiliate_comm` |
| Affiliate partner commission | `affiliate_partner_commission` |
| Affiliate Shop Ads commission | `affiliate_shop_ads_comm` |
| Affiliate Shop Ads commission before PIT | `aff_shop_ads_comm_before_pit` |
| Personal income tax withheld from affiliate Shop Ads commission | `pit_withheld_aff_shop_ads` |
| Affiliate commission deposit | `affiliate_commission_deposit` |
| Affiliate commission refund | `affiliate_commission_refund` |
| Affiliate Partner shop ads commission | `aff_partner_shop_ads_comm` |
| SFP service fee | `sfp_service_fee` |
| Bonus cashback service fee | `bonus_cashback_service_fee` |
| LIVE Specials service fee | `live_specials_service_fee` |
| Voucher Xtra service fee | `voucher_xtra_service_fee` |
| EAMS Program service fee | `eams_program_service_fee` |
| Brands Crazy Deals/Flash Sale service fee | `brands_crazy_deals_svc_fee` |
| TikTok PayLater program fee | `tiktok_paylater_program_fee` |
| Commerce growth fee | `commerce_growth_fee` |
| Infrastructure fee | `infrastructure_fee` |
| Campaign resource fee | `campaign_resource_fee` |
| Pre-order service fee | `pre_order_service_fee` |
| Ajustment amount | `adjustment_amount` |
| Related order ID | `related_order_id` |
| Customer payment | `customer_payment` |
| Customer refund | `customer_refund` |
| Seller co-funded voucher discount | `seller_cofunded_voucher_disc` |
| Refund of seller co-funded voucher discount | `refund_seller_cofunded_voucher` |
| Platform discounts | `platform_discounts` |
| Refund of platform discounts | `refund_of_platform_discounts` |
| Platform co-funded voucher discounts | `platform_cofunded_voucher_disc` |
| Refund of platform co-funded voucher discounts | `refund_plat_cofunded_voucher` |
| Seller shipping fee discount | `seller_shipping_fee_discount` |
| Estimated package weight (g) | `estimated_package_weight_g` |
| Actual package weight (g) | `actual_package_weight_g` |
| Shopping center items | `shopping_center_items` |
| Customer's bank for payment | `customer_bank_for_payment` |

Also: `excel_row_index`, `order_id` (FK match), `match_status`, `apply_status`, `error_message`, audit columns.

If an older DB still has `RAW_JSON`, drop it after restart with `ddl-auto: update` (or manually):

```sql
ALTER TABLE order_withdraw_import_rows DROP COLUMN raw_json;
```

## API

Base: `/api/v1/order-input-runs`

- `POST /pageable` — list
- `POST` — create `{ title, storeId, marketplaceCode }`
- `GET /{id}` — detail
- `POST /{id}/files/order-detail` — multipart
- `POST /{id}/files/withdraw` — multipart
- `POST /{id}/run` — run both
- `GET /{id}/withdraw-rows` — pageable results (typed columns in DTO)
