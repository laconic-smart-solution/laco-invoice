# Schema Changes for OrderSKUList Import

Target: `LACO_INVOICE` (Oracle, `113.53.62.172:1200`)
Source: `OrderSKUList` sheet — one row per order line (SKU), 63 columns

---

## 1. Column mapping (all 63 columns)

| # | Excel column | Target | Status |
|---|---|---|---|
| 1 | Order ID | `LCO_ORDERS.EXTERNAL_ORDER_ID` | existing |
| 2 | Order Status | `LCO_ORDERS.ORDER_STATUS` | existing (needs text→enum lookup) |
| 3 | Order Substatus | `LCO_ORDERS.ORDER_SUBSTATUS` | new |
| 4 | Cancelation/Return Type | `LCO_ORDERS.CANCEL_RETURN_TYPE` | new |
| 5 | Normal or Pre-order | `LCO_ORDERS.ORDER_KIND` | new |
| 6 | SKU ID | `ORDER_ITEMS.PLATFORM_SKU_ID` | new |
| 7 | Seller SKU | `ORDER_ITEMS.SKU` | existing |
| 8 | Product Name | `ORDER_ITEMS.PRODUCT_NAME` | existing |
| 9 | Variation | `ORDER_ITEMS.VARIATION` | new |
| 10 | Quantity | `ORDER_ITEMS.QUANTITY` | existing |
| 11 | Sku Quantity of return | `ORDER_ITEMS.QUANTITY_RETURNED` | new |
| 12 | SKU Unit Original Price | `ORDER_ITEMS.PRICE` | existing |
| 13 | SKU Subtotal Before Discount | `ORDER_ITEMS.SUBTOTAL_BEFORE_DISCOUNT` | new |
| 14 | SKU Platform Discount | `ORDER_ITEMS.ITEM_PLATFORM_DISCOUNT` | new |
| 15 | SKU Seller Discount | `ORDER_ITEMS.ITEM_SELLER_DISCOUNT` | new |
| 16 | SKU Subtotal After Discount | `ORDER_ITEMS.LINE_TOTAL` | existing |
| 17 | Shipping Fee After Discount | `LCO_ORDERS.SHIPPING_FEE` | existing |
| 18 | Original Shipping Fee | `LCO_ORDERS.SHIPPING_FEE_ORIGINAL` | new |
| 19 | Shipping Fee Seller Discount | `LCO_ORDERS.SHIPPING_FEE_SELLER_DISC` | new |
| 20 | Shipping Fee Platform Discount | `LCO_ORDERS.SHIPPING_FEE_PLATFORM_DISC` | new |
| 21 | Payment platform discount | `LCO_ORDERS.PAYMENT_PLATFORM_DISCOUNT` | new |
| 22 | Taxes | `LCO_ORDERS.TAXES` | new |
| 23 | Order Amount | `LCO_ORDERS.TOTAL_AMOUNT` | existing |
| 24 | Order Refund Amount | `LCO_ORDERS.REFUND_AMOUNT` | new |
| 25 | Created Time | `LCO_ORDERS.ORDER_DATE` | existing |
| 26 | Paid Time | `LCO_ORDERS.PAID_AT` | new |
| 27 | RTS Time | `LCO_ORDERS.RTS_AT` | new |
| 28 | Shipped Time | `LCO_ORDERS.SHIPPED_AT` | new |
| 29 | Delivered Time | `LCO_ORDERS.DELIVERED_AT` | new |
| 30 | Cancelled Time | `LCO_ORDERS.CANCELLED_AT` | new |
| 31 | Cancel By | `LCO_ORDERS.CANCEL_BY` | new |
| 32 | Cancel Reason | `LCO_ORDERS.CANCEL_REASON` | new |
| 33 | Fulfillment Type | `LCO_ORDERS.FULFILLMENT_TYPE` | new |
| 34 | Warehouse Name | `LCO_ORDERS.WAREHOUSE_NAME` | new |
| 35 | Tracking ID | `LCO_ORDERS.TRACKING_ID` | new |
| 36 | Delivery Option | `LCO_ORDERS.DELIVERY_OPTION` | new |
| 37 | Shipping Provider Name | `LCO_ORDERS.SHIPPING_PROVIDER_NAME` | new |
| 38 | Buyer Message | `LCO_ORDERS.BUYER_MESSAGE` | new |
| 39 | Buyer Username | `CUSTOMERS_INFO.EXTERNAL_CUSTOMER_ID` | existing |
| 40 | Recipient | `CUSTOMERS_INFO.NAME` | existing |
| 41 | Phone # | `CUSTOMERS_INFO.PHONE` | existing |
| 42 | Zipcode | `CUSTOMERS_INFO.ZIPCODE` | new |
| 43 | Country | `CUSTOMERS_INFO.COUNTRY` | new |
| 44 | Province | `CUSTOMERS_INFO.PROVINCE` | new |
| 45 | District | `CUSTOMERS_INFO.DISTRICT` | new |
| 46 | Districts | `CUSTOMERS_INFO.SUB_DISTRICT` | new |
| 47 | Detail Address | `CUSTOMERS_INFO.ADDRESS` | existing |
| 48 | Additional address information | `CUSTOMERS_INFO.ADDITIONAL_ADDRESS_INFO` | new |
| 49 | Payment Method | `LCO_ORDERS.PAYMENT_METHOD` | new |
| 50 | Weight(kg) | `ORDER_ITEMS.WEIGHT_KG` | new |
| 51 | Product Category | `ORDER_ITEMS.PRODUCT_CATEGORY` | new |
| 52 | Package ID | `LCO_ORDERS.PACKAGE_ID` | new |
| 53 | Seller Note | `LCO_ORDERS.SELLER_NOTE` | new |
| 54 | Checked Status | `LCO_ORDERS.CHECKED_STATUS` | new |
| 55 | Checked Marked by | `LCO_ORDERS.CHECKED_MARKED_BY` | new |
| 56 | Request Tax Invoice | `ORDER_TAX_INVOICES.REQUESTED` | new table |
| 57 | Tax Info - Buyer Tax ID | `ORDER_TAX_INVOICES.BUYER_TAX_ID` | new table |
| 58 | Tax Info - Type | `ORDER_TAX_INVOICES.TAX_TYPE` | new table |
| 59 | Tax Info - Full Name of Buyer | `ORDER_TAX_INVOICES.FULL_NAME` | new table |
| 60 | Tax Info - Email | `ORDER_TAX_INVOICES.EMAIL` | new table |
| 61 | Tax Info - Phone Number | `ORDER_TAX_INVOICES.PHONE_NUMBER` | new table |
| 62 | Tax Info - Registered Address | `ORDER_TAX_INVOICES.REGISTERED_ADDRESS` | new table |
| 63 | Tax Info - Address Type | `ORDER_TAX_INVOICES.ADDRESS_TYPE` | new table |

---

## 2. ALTER TABLE / CREATE TABLE script

```sql
-- ============================================================
-- LCO_ORDERS: lifecycle, fulfillment, and discount detail
-- ============================================================
ALTER TABLE LACO_INVOICE.LCO_ORDERS ADD (
  ORDER_SUBSTATUS             VARCHAR2(100),
  CANCEL_RETURN_TYPE          VARCHAR2(100),
  ORDER_KIND                  VARCHAR2(20),    -- 'NORMAL' / 'PRE_ORDER'
  SHIPPING_FEE_ORIGINAL       NUMBER(18,2),
  SHIPPING_FEE_SELLER_DISC    NUMBER(18,2),
  SHIPPING_FEE_PLATFORM_DISC  NUMBER(18,2),
  PAYMENT_PLATFORM_DISCOUNT   NUMBER(18,2),
  TAXES                       NUMBER(18,2),
  REFUND_AMOUNT                NUMBER(18,2),
  PAID_AT                     TIMESTAMP(9) WITH TIME ZONE,
  RTS_AT                      TIMESTAMP(9) WITH TIME ZONE,
  SHIPPED_AT                  TIMESTAMP(9) WITH TIME ZONE,
  DELIVERED_AT                TIMESTAMP(9) WITH TIME ZONE,
  CANCELLED_AT                 TIMESTAMP(9) WITH TIME ZONE,
  CANCEL_BY                   VARCHAR2(100),
  CANCEL_REASON                VARCHAR2(1020),
  FULFILLMENT_TYPE             VARCHAR2(100),
  WAREHOUSE_NAME                VARCHAR2(100),
  TRACKING_ID                  VARCHAR2(200),
  DELIVERY_OPTION               VARCHAR2(200),
  SHIPPING_PROVIDER_NAME         VARCHAR2(200),
  PAYMENT_METHOD                VARCHAR2(100),
  PACKAGE_ID                    VARCHAR2(200),
  CHECKED_STATUS                 VARCHAR2(50),
  CHECKED_MARKED_BY              VARCHAR2(200),
  BUYER_MESSAGE                 CLOB,
  SELLER_NOTE                   CLOB
);

-- ============================================================
-- ORDER_ITEMS: line-level discount, return, and category detail
-- ============================================================
ALTER TABLE LACO_INVOICE.ORDER_ITEMS ADD (
  PLATFORM_SKU_ID               VARCHAR2(400),
  VARIATION                     VARCHAR2(400),
  QUANTITY_RETURNED              NUMBER(10),
  SUBTOTAL_BEFORE_DISCOUNT        NUMBER(18,2),
  ITEM_PLATFORM_DISCOUNT          NUMBER(18,2),
  ITEM_SELLER_DISCOUNT            NUMBER(18,2),
  PRODUCT_CATEGORY                VARCHAR2(200),
  WEIGHT_KG                      NUMBER(10,3)
);

-- ============================================================
-- CUSTOMERS_INFO: structured shipping address
-- ============================================================
ALTER TABLE LACO_INVOICE.CUSTOMERS_INFO ADD (
  ZIPCODE                       VARCHAR2(20),
  COUNTRY                       VARCHAR2(100),
  PROVINCE                      VARCHAR2(100),
  DISTRICT                      VARCHAR2(100),
  SUB_DISTRICT                  VARCHAR2(100),
  ADDITIONAL_ADDRESS_INFO         VARCHAR2(1020)
);

-- ============================================================
-- New table: sparse, optional, 1:1 with LCO_ORDERS
-- ============================================================
CREATE TABLE LACO_INVOICE.ORDER_TAX_INVOICES (
  ID                    NUMBER(19) NOT NULL,
  ORDER_ID              NUMBER(19) NOT NULL,
  REQUESTED             NUMBER(3) DEFAULT 0 NOT NULL,
  BUYER_TAX_ID          VARCHAR2(100),
  TAX_TYPE              VARCHAR2(50),        -- 'PERSONAL' / 'COMPANY'
  FULL_NAME             VARCHAR2(1020),
  EMAIL                 VARCHAR2(1020),
  PHONE_NUMBER          VARCHAR2(400),
  REGISTERED_ADDRESS      CLOB,
  ADDRESS_TYPE           VARCHAR2(50),        -- 'BRANCH' / 'HEAD_OFFICE'
  CREATED_AT             TIMESTAMP(9) WITH TIME ZONE NOT NULL,
  CONSTRAINT PK_ORDER_TAX_INVOICES PRIMARY KEY (ID),
  CONSTRAINT UK_ORDER_TAX_INVOICES_ORDER UNIQUE (ORDER_ID),
  CONSTRAINT FK_TAX_INVOICE_ORDER FOREIGN KEY (ORDER_ID)
    REFERENCES LACO_INVOICE.LCO_ORDERS(ID)
);

CREATE SEQUENCE LACO_INVOICE.SEQ_ORDER_TAX_INVOICES START WITH 1 INCREMENT BY 1;

-- ============================================================
-- ORDER_IMPORT_FILES: audit trail for Excel imports
-- ============================================================
CREATE TABLE LACO_INVOICE.ORDER_IMPORT_FILES (
  ID                    NUMBER(19) NOT NULL,
  STORE_ID              NUMBER(19) NOT NULL,
  MARKETPLACE_ID        NUMBER(19) NOT NULL,
  ORIGINAL_FILENAME     VARCHAR2(500) NOT NULL,
  SHEET_NAME            VARCHAR2(200),
  ROW_COUNT             NUMBER(10),
  IMPORTED_ORDERS       NUMBER(10),
  IMPORTED_ITEMS        NUMBER(10),
  STATUS                VARCHAR2(20) DEFAULT 'COMPLETED' NOT NULL,
  CREATED_AT            TIMESTAMP(9) WITH TIME ZONE NOT NULL,
  UPDATED_AT            TIMESTAMP(9) WITH TIME ZONE,
  CONSTRAINT PK_ORDER_IMPORT_FILES PRIMARY KEY (ID),
  CONSTRAINT FK_IMPORT_FILE_STORE FOREIGN KEY (STORE_ID)
    REFERENCES LACO_INVOICE.STORES(ID),
  CONSTRAINT FK_IMPORT_FILE_MARKETPLACE FOREIGN KEY (MARKETPLACE_ID)
    REFERENCES LACO_INVOICE.MARKETPLACES(ID)
);

CREATE SEQUENCE LACO_INVOICE.SEQ_ORDER_IMPORT_FILES START WITH 1 INCREMENT BY 1;

-- ============================================================
-- Source tracking: API sync vs Excel import
-- When SOURCE_TYPE = 'IMPORT', SOURCE_ID = ORDER_IMPORT_FILES.ID
-- Oracle ORA-01758: cannot add NOT NULL to a non-empty table in one step.
-- ============================================================
ALTER TABLE LACO_INVOICE.LCO_ORDERS ADD (
  SOURCE_TYPE             VARCHAR2(20),
  SOURCE_ID               NUMBER(19)
);
UPDATE LACO_INVOICE.LCO_ORDERS SET SOURCE_TYPE = 'API' WHERE SOURCE_TYPE IS NULL;
ALTER TABLE LACO_INVOICE.LCO_ORDERS MODIFY (SOURCE_TYPE VARCHAR2(20) DEFAULT 'API' NOT NULL);

ALTER TABLE LACO_INVOICE.ORDER_ITEMS ADD (
  SOURCE_TYPE             VARCHAR2(20),
  SOURCE_ID               NUMBER(19)
);
UPDATE LACO_INVOICE.ORDER_ITEMS SET SOURCE_TYPE = 'API' WHERE SOURCE_TYPE IS NULL;
ALTER TABLE LACO_INVOICE.ORDER_ITEMS MODIFY (SOURCE_TYPE VARCHAR2(20) DEFAULT 'API' NOT NULL);

-- ============================================================
-- VAT breakdown from Order Amount (VAT-inclusive, Thailand 7%)
-- EX.VAT = TOTAL_AMOUNT / 1.07, VAT = TOTAL_AMOUNT - EX.VAT
-- ============================================================
ALTER TABLE LACO_INVOICE.LCO_ORDERS ADD (
  AMOUNT_EX_VAT             NUMBER(18,2),
  VAT_AMOUNT                NUMBER(18,2)
);
```

---

## 3. Importer notes

1. **`ORDER_STATUS` mapping** — handled by `OrderStatusTextMapper` (Chinese + English aliases).
2. **Upsert logic** — products matched by `Seller SKU`; customers by `Buyer Username` or phone.
3. **De-duplication** — Excel rows grouped by `Order ID` in `OrderSkuListExcelParser`.
4. **Currency** — defaults to `THB` when not present in the sheet.
5. **Source tracking** — `SOURCE_TYPE` = `IMPORT` and `SOURCE_ID` = `order_import_files.id` on `LCO_ORDERS` and `ORDER_ITEMS`; API sync sets `SOURCE_TYPE` = `API` and `SOURCE_ID` = null.
6. **Example-sheet fallbacks** — when Excel leaves blanks:
   - `SKU Subtotal Before Discount` = Unit Original Price × Quantity
   - `SKU Seller Discount` = Before Discount − Platform Discount − After Discount
   - `Shipping Fee After Discount` = Original Shipping − Seller Disc − Platform Disc
7. **EX.VAT / VAT** — computed from `Order Amount` (`TOTAL_AMOUNT`) as VAT-inclusive using 7%: `AMOUNT_EX_VAT = TOTAL / 1.07`, `VAT_AMOUNT = TOTAL − AMOUNT_EX_VAT`. Applied on both Excel import and API sync.