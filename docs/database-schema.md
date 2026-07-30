# LACO_INVOICE Database Schema

Generated from the live Oracle database (`application-dev.yml` defaults).

| Property | Value |
|----------|-------|
| Host | `113.53.62.172:1200` |
| Service | `LACONIC` |
| Schema | `LACO_INVOICE` |
| Tables | 15 |

## Table index

1. [CUSTOMERS_INFO](#customers-info)
2. [ERP_ITEMS](#erp-items)
3. [INVOICES](#invoices)
4. [LCO_ORDERS](#lco-orders)
5. [MARKETPLACES](#marketplaces)
6. [MARKETPLACE_PRODUCT_SYNC_RUNS](#marketplace-product-sync-runs)
7. [ORDER_ITEMS](#order-items)
8. [PRODUCTS](#products)
9. [PRODUCT_ERP_MAPPING](#product-erp-mapping)
10. [PURCHASE_ORDERS](#purchase-orders)
11. [PURCHASE_ORDER_ITEMS](#purchase-order-items)
12. [STORES](#stores)
13. [STORE_MARKETPLACE_CONNECTIONS](#store-marketplace-connections)
14. [TIKTOK_SELLER_SESSIONS](#tiktok-seller-sessions)
15. [USERS](#users)

## CUSTOMERS_INFO

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190764".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `ADDRESS` | `CLOB` | YES |  |  |  |
| 8 | `GENDER` | `VARCHAR2(28)` | YES |  |  |  |
| 9 | `PHONE` | `VARCHAR2(400)` | YES |  |  |  |
| 10 | `EMAIL` | `VARCHAR2(1020)` | YES |  |  |  |
| 11 | `NAME` | `VARCHAR2(1020)` | YES |  |  |  |
| 12 | `STORE_ID` | `NUMBER(19)` | YES |  |  |  |
| 13 | `EXTERNAL_CUSTOMER_ID` | `VARCHAR2(256)` | YES |  |  |  |
| 14 | `MARKETPLACE_ID` | `NUMBER(19)` | YES |  |  |  |

- **Primary key:** `SYS_C00136630` (`ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136630` | UNIQUE | `ID` |

## ERP_ITEMS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190769".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `DESCRIPTION` | `CLOB` | YES |  |  |  |
| 8 | `ERP_CODE` | `VARCHAR2(400)` | YES |  |  |  |
| 9 | `NAME` | `VARCHAR2(1020)` | YES |  |  |  |

- **Primary key:** `SYS_C00136636` (`ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136636` | UNIQUE | `ID` |

## INVOICES

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190774".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `GRAND_TOTAL` | `NUMBER(18,2)` | YES |  |  |  |
| 8 | `INVOICE_NO` | `VARCHAR2(200)` | NO |  |  |  |
| 9 | `ISSUED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | YES |  |  |  |
| 10 | `PDF_URL` | `VARCHAR2(2000)` | YES |  |  |  |
| 11 | `STATUS` | `NUMBER(10)` | NO |  |  |  |
| 12 | `SUBTOTAL` | `NUMBER(18,2)` | YES |  |  |  |
| 13 | `VAT_AMOUNT` | `NUMBER(18,2)` | YES |  |  |  |
| 14 | `VAT_PERCENTAGE` | `NUMBER(10)` | YES |  |  |  |
| 15 | `ORDER_ID` | `NUMBER(19)` | NO |  |  |  |

- **Primary key:** `SYS_C00136646` (`ID`)
- **Unique:** `UK465KFG5I8GAM6KC8FNB96FQCE` (`INVOICE_NO`)
- **Unique:** `UKE718Q5KLX5PEMPY28P2NX88A6` (`ORDER_ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136646` | UNIQUE | `ID` |
| `UK465KFG5I8GAM6KC8FNB96FQCE` | UNIQUE | `INVOICE_NO` |
| `UKE718Q5KLX5PEMPY28P2NX88A6` | UNIQUE | `ORDER_ID` |

## LCO_ORDERS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190821".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `EXTERNAL_ORDER_DETAIL_JSON` | `CLOB` | YES |  |  |  |
| 8 | `EXTERNAL_ORDER_ID` | `VARCHAR2(400)` | YES |  |  |  |
| 9 | `ORDER_DATE` | `TIMESTAMP(9) WITH TIME ZONE` | YES |  |  |  |
| 10 | `ORDER_STATUS` | `NUMBER(10)` | NO |  |  |  |
| 11 | `SHIPPING_FEE` | `NUMBER(18,2)` | YES |  |  |  |
| 12 | `SUBTOTAL` | `NUMBER(18,2)` | YES |  |  |  |
| 13 | `TOTAL_AMOUNT` | `NUMBER(18,2)` | YES |  |  |  |
| 14 | `STORE_ID` | `NUMBER(19)` | YES |  |  |  |
| 15 | `CUSTOMER_ID` | `NUMBER(19)` | NO |  |  |  |
| 16 | `MARKETPLACE_ID` | `NUMBER(19)` | NO |  |  |  |
| 17 | `CURRENCY` | `VARCHAR2(12)` | YES |  |  |  |

- **Primary key:** `SYS_C00136743` (`ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136743` | UNIQUE | `ID` |

## MARKETPLACES

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190777".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `CODE` | `VARCHAR2(200)` | NO |  |  |  |
| 8 | `NAME` | `VARCHAR2(400)` | NO |  |  |  |

- **Primary key:** `SYS_C00136654` (`ID`)
- **Unique:** `UKRUB3RB4FOQV9AVAKSG5YYN5WG` (`CODE`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136654` | UNIQUE | `ID` |
| `UKRUB3RB4FOQV9AVAKSG5YYN5WG` | UNIQUE | `CODE` |

## MARKETPLACE_PRODUCT_SYNC_RUNS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190959".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `COMPLETED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | YES |  |  |  |
| 8 | `DISABLED_COUNT` | `NUMBER(10)` | NO |  |  |  |
| 9 | `ERROR_MESSAGE` | `CLOB` | YES |  |  |  |
| 10 | `FAILED_COUNT` | `NUMBER(10)` | NO |  |  |  |
| 11 | `INSERTED_COUNT` | `NUMBER(10)` | NO |  |  |  |
| 12 | `MARKETPLACE_CODE` | `VARCHAR2(80)` | NO |  |  |  |
| 13 | `STARTED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 14 | `STATUS` | `VARCHAR2(80)` | NO |  |  |  |
| 15 | `STORE_ID` | `NUMBER(19)` | NO |  |  |  |
| 16 | `TRIGGERED_BY` | `NUMBER(19)` | YES |  |  |  |
| 17 | `UPDATED_COUNT` | `NUMBER(10)` | NO |  |  |  |

- **Primary key:** `SYS_C00136792` (`ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136792` | UNIQUE | `ID` |

## ORDER_ITEMS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190780".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `LINE_TOTAL` | `NUMBER(18,2)` | YES |  |  |  |
| 8 | `PRICE` | `NUMBER(18,2)` | YES |  |  |  |
| 9 | `PRODUCT_NAME` | `VARCHAR2(1020)` | YES |  |  |  |
| 10 | `QUANTITY` | `NUMBER(10)` | YES |  |  |  |
| 11 | `SKU` | `VARCHAR2(400)` | YES |  |  |  |
| 12 | `ORDER_ID` | `NUMBER(19)` | NO |  |  |  |
| 13 | `PRODUCT_ID` | `NUMBER(19)` | NO |  |  |  |

- **Primary key:** `SYS_C00136662` (`ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136662` | UNIQUE | `ID` |

## PRODUCTS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190970".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `CURRENCY` | `VARCHAR2(12)` | YES |  |  |  |
| 8 | `DESCRIPTION` | `CLOB` | YES |  |  |  |
| 9 | `EXTERNAL_PRODUCT_ID` | `VARCHAR2(256)` | YES |  |  |  |
| 10 | `IMAGES_JSON` | `CLOB` | YES |  |  |  |
| 11 | `LAST_SYNC_RUN_ID` | `NUMBER(19)` | YES |  |  |  |
| 12 | `LAST_SYNCED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | YES |  |  |  |
| 13 | `MARKETPLACE_CODE` | `VARCHAR2(80)` | YES |  |  |  |
| 14 | `NAME` | `VARCHAR2(1020)` | YES |  |  |  |
| 15 | `PRICE` | `NUMBER(18,2)` | YES |  |  |  |
| 16 | `SKU` | `VARCHAR2(400)` | YES |  |  |  |
| 17 | `STATUS` | `VARCHAR2(200)` | YES |  |  |  |
| 18 | `VARIANTS_JSON` | `CLOB` | YES |  |  |  |
| 19 | `STORE_ID` | `NUMBER(19)` | YES |  |  |  |

- **Primary key:** `SYS_C00136798` (`ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136798` | UNIQUE | `ID` |

## PRODUCT_ERP_MAPPING

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190783".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `ERP_ITEM_ID` | `NUMBER(19)` | NO |  |  |  |
| 8 | `PRODUCT_ID` | `NUMBER(19)` | NO |  |  |  |

- **Primary key:** `SYS_C00136670` (`ID`)
- **Foreign key:** `FK8QA1U49L7XLVQNK5TSE0UXLE9` (`ERP_ITEM_ID`) → `ERP_ITEMS(ID)`

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136670` | UNIQUE | `ID` |

## PURCHASE_ORDERS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190792".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `PO_NUMBER` | `VARCHAR2(200)` | YES |  |  |  |
| 8 | `STATUS` | `NUMBER(10)` | NO |  |  |  |

- **Primary key:** `SYS_C00136692` (`ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136692` | UNIQUE | `ID` |

## PURCHASE_ORDER_ITEMS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190789".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `QUANTITY` | `NUMBER(10)` | YES |  |  |  |
| 8 | `UNIT_PRICE` | `NUMBER(18,2)` | YES |  |  |  |
| 9 | `ERP_ITEM_ID` | `NUMBER(19)` | NO |  |  |  |
| 10 | `PO_ID` | `NUMBER(19)` | NO |  |  |  |

- **Primary key:** `SYS_C00136684` (`ID`)
- **Foreign key:** `FK5Y0W29AHV8GQN5HQ6UG5F9U9O` (`PO_ID`) → `PURCHASE_ORDERS(ID)`
- **Foreign key:** `FKM4MF04TCVO5RISWNSXTPGN0A2` (`ERP_ITEM_ID`) → `ERP_ITEMS(ID)`

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136684` | UNIQUE | `ID` |

## STORES

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190802".nextval` | Y |  |
| 2 | `ACTIVE` | `NUMBER(3)` | NO |  |  |  |
| 3 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 4 | `LOGO_URL` | `VARCHAR2(2000)` | YES |  |  |  |
| 5 | `NAME` | `VARCHAR2(1020)` | NO |  |  |  |
| 6 | `OWNER_ID` | `NUMBER(19)` | NO |  |  |  |

- **Primary key:** `SYS_C00136709` (`ID`)
- **Foreign key:** `FK62SMC31FBGCLSU56AA4Y2HRXG` (`OWNER_ID`) → `USERS(ID)`

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136709` | UNIQUE | `ID` |

## STORE_MARKETPLACE_CONNECTIONS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190795".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `ACCESS_TOKEN` | `CLOB` | YES |  |  |  |
| 8 | `REFRESH_TOKEN` | `CLOB` | YES |  |  |  |
| 9 | `STATUS` | `NUMBER(10)` | NO |  |  |  |
| 10 | `TOKEN_EXPIRY` | `TIMESTAMP(9) WITH TIME ZONE` | YES |  |  |  |
| 11 | `MARKETPLACE_ID` | `NUMBER(19)` | NO |  |  |  |
| 12 | `STORE_ID` | `NUMBER(19)` | NO |  |  |  |
| 13 | `DISPLAY_NAME` | `VARCHAR2(1020)` | YES |  |  |  |
| 14 | `EXTERNAL_CONNECTION_ID` | `RAW(16)` | YES |  |  |  |
| 15 | `EXTERNAL_COUNTRY` | `VARCHAR2(32)` | YES |  |  |  |
| 16 | `EXTERNAL_SELLER_ID` | `VARCHAR2(512)` | YES |  |  |  |
| 17 | `SCRAPE_SESSION_JSON` | `CLOB` | YES |  |  |  |

- **Primary key:** `SYS_C00136702` (`ID`)
- **Foreign key:** `FK3T6NE74YNKKYE6IPA3TEGXYJS` (`MARKETPLACE_ID`) → `MARKETPLACES(ID)`
- **Foreign key:** `FKNXLWV5P4AJHNDMVML5G4QBABA` (`STORE_ID`) → `STORES(ID)`

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136702` | UNIQUE | `ID` |

## TIKTOK_SELLER_SESSIONS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_192133".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `DISPLAY_NAME` | `VARCHAR2(1020)` | YES |  |  |  |
| 8 | `SELLER_ID` | `VARCHAR2(512)` | NO |  |  |  |
| 9 | `STORAGE_STATE_JSON` | `CLOB` | NO |  |  |  |

- **Primary key:** `SYS_C00138021` (`ID`)
- **Unique:** `UKNK1UB9W262D3823B97HRSRG5Q` (`SELLER_ID`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00138021` | UNIQUE | `ID` |
| `UKNK1UB9W262D3823B97HRSRG5Q` | UNIQUE | `SELLER_ID` |

## USERS

| # | Column | Type | Nullable | Default | PK | Comment |
|---|--------|------|----------|---------|----|---------|
| 1 | `ID` | `NUMBER(19)` | NO | `"LACO_INVOICE"."ISEQ$$_190805".nextval` | Y |  |
| 2 | `CREATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 3 | `CREATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 4 | `IS_ENABLE` | `NUMBER(3)` | NO |  |  |  |
| 5 | `UPDATED_AT` | `TIMESTAMP(9) WITH TIME ZONE` | NO |  |  |  |
| 6 | `UPDATED_BY` | `NUMBER(19)` | YES |  |  |  |
| 7 | `ACTIVE` | `NUMBER(3)` | NO |  |  |  |
| 8 | `AUTH_SERVER_USER_ID` | `VARCHAR2(1020)` | YES |  |  |  |
| 9 | `EMAIL` | `VARCHAR2(1020)` | NO |  |  |  |
| 10 | `FULL_NAME` | `VARCHAR2(1020)` | YES |  |  |  |
| 11 | `ROLE` | `NUMBER(10)` | NO |  |  |  |

- **Primary key:** `SYS_C00136720` (`ID`)
- **Unique:** `UK6DOTKOTT2KJSP8VW4D0M25FB7` (`EMAIL`)

### Indexes

| Index | Unique | Columns |
|-------|--------|---------|
| `SYS_C00136720` | UNIQUE | `ID` |
| `UK6DOTKOTT2KJSP8VW4D0M25FB7` | UNIQUE | `EMAIL` |

