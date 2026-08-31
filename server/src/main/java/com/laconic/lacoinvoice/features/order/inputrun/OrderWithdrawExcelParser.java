package com.laconic.lacoinvoice.features.order.inputrun;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.laconic.lacoinvoice.common.util.ExcelXmlNormalizer;
import com.laconic.lacoinvoice.features.order.inputrun.ParsedWithdrawWorkbook.ParsedWithdrawRow;

/**
 * Parses TikTok Payout Report "Order details" sheet into typed columns
 * supporting both English and Chinese column headers.
 */
@Component
public class OrderWithdrawExcelParser {

	private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Bangkok");
	private static final int HEADER_SCAN_LIMIT = 30;

	// Bilingual header mapping definitions
	private static final String[] H_ORDER_ADJ_ID = { "Order/adjustment ID", "订单ID/调整单ID", "Order ID", "订单ID", "调整单ID" };
	private static final String[] H_TYPE = { "Type", "交易类型" };
	private static final String[] H_CREATED = { "Order created time", "订单创建时间", "Created Time" };
	private static final String[] H_SETTLED = { "Order settled time", "订单结算时间", "Settled Time" };
	private static final String[] H_CURRENCY = { "Currency", "货币" };
	private static final String[] H_SETTLEMENT = { "Total settlement amount", "结算总金额", "Settlement amount" };
	private static final String[] H_REVENUE = { "Total Revenue", "总收入", "Revenue" };
	private static final String[] H_SUB_AFTER = { "Subtotal after seller discounts", "享受商家折扣后小计" };
	private static final String[] H_SUB_BEFORE = { "Subtotal before discounts", "享受折扣前小计" };
	private static final String[] H_SELLER_DISC = { "Seller discounts", "商家折扣" };
	private static final String[] H_REFUND_SUB_AFTER = { "Refund subtotal after seller discounts", "享受商家折扣后的退款小计" };
	private static final String[] H_REFUND_SUB_BEFORE = { "Refund subtotal before seller discounts", "享受商家折扣前的退款小计" };
	private static final String[] H_REFUND_SELLER_DISC = { "Refund of seller discounts", "商家折扣退款" };
	private static final String[] H_TOTAL_FEES = { "Total Fees", "总费用" };
	private static final String[] H_TX_FEE = { "Transaction fee", "交易手续费" };
	private static final String[] H_COMMISSION = { "TikTok Shop commission fee", "TikTok Shop 佣金费", "TikTok Shop佣金费", "TikTok Shop Commission" };
	private static final String[] H_CC_INTEREST = { "Credit card installment - Interest rate cost", "信用卡分期付款 - 利率成本", "信用卡分期付款-利率成本" };
	private static final String[] H_SELLER_SHIP = { "Seller shipping fee", "商家运费" };
	private static final String[] H_ACTUAL_SHIP = { "Actual shipping fee", "实际运费" };
	private static final String[] H_PLAT_SHIP_DISC = { "Platform shipping fee discount", "平台运费减免" };
	private static final String[] H_CUST_SHIP = { "Customer shipping fee", "买家支付运费" };
	private static final String[] H_RETURN_SHIP = { "Actual return shipping fee", "实际退货运费" };
	private static final String[] H_REFUND_CUST_SHIP = { "Refunded customer shipping fee", "客户运费退款" };
	private static final String[] H_SHIP_SUBSIDY = { "Shipping subsidy", "运费补贴" };
	private static final String[] H_AFF_COMM = { "Affiliate Commission", "联盟佣金" };
	private static final String[] H_AFF_COMM_BEFORE_PIT = {
			"Affiliate commission before PIT (personal income tax)",
			"Affiliate commission before PIT",
			"扣除个人所得税（PIT）前的联盟佣金",
			"扣除个人所得税(PIT)前的联盟佣金"
	};
	private static final String[] H_PIT_AFF = {
			"Personal income tax withheld from affiliate commission",
			"已扣缴 PIT",
			"已扣缴PIT"
	};
	private static final String[] H_AFF_PARTNER = { "Affiliate partner commission", "联盟服务商佣金" };
	private static final String[] H_AFF_SHOP_ADS = { "Affiliate Shop Ads commission", "联盟店铺广告佣金" };
	private static final String[] H_AFF_SHOP_ADS_BEFORE_PIT = {
			"Affiliate Shop Ads commission before PIT",
			"联盟店铺广告佣金（税前）",
			"联盟店铺广告佣金(税前)"
	};
	private static final String[] H_PIT_AFF_SHOP_ADS = {
			"Personal income tax withheld from affiliate Shop Ads commission",
			"从联盟店铺广告佣金中预扣的个人所得税"
	};
	private static final String[] H_AFF_DEPOSIT = { "Affiliate commission deposit", "联盟佣金保证金" };
	private static final String[] H_AFF_REFUND = { "Affiliate commission refund", "联盟佣金退款" };
	private static final String[] H_AFF_PARTNER_SHOP_ADS = { "Affiliate Partner shop ads commission", "联盟服务商店铺广告佣金" };
	private static final String[] H_SFP = { "SFP service fee", "SFP 服务费", "SFP服务费" };
	private static final String[] H_BONUS_CASHBACK = { "Bonus cashback service fee", "奖金返现服务费" };
	private static final String[] H_LIVE_SPECIALS = { "LIVE Specials service fee", "直播特别活动服务费" };
	private static final String[] H_VOUCHER_XTRA = { "Voucher Xtra service fee", "超级优惠券服务费" };
	private static final String[] H_EAMS = { "EAMS Program service fee", "EAMS 计划服务费", "EAMS计划服务费" };
	private static final String[] H_BRANDS_CRAZY = { "Brands Crazy Deals/Flash Sale service fee", "品牌疯狂优惠/秒杀服务费" };
	private static final String[] H_PAYLATER = { "TikTok PayLater program fee", "TikTok PayLater 计划费用", "TikTok PayLater计划费用" };
	private static final String[] H_COMMERCE_GROWTH = { "Commerce growth fee", "电商增长服务费" };
	private static final String[] H_INFRA = { "Infrastructure fee", "基础设施费" };
	private static final String[] H_CAMPAIGN = { "Campaign resource fee", "活动资源费" };
	private static final String[] H_PREORDER = { "Pre-order service fee", "预售服务费" };
	private static final String[] H_ADJUSTMENT = { "Adjustment amount", "Ajustment amount", "调整金额" };
	private static final String[] H_RELATED_ORDER = { "Related order ID", "相关订单 ID", "相关订单ID" };
	private static final String[] H_CUST_PAYMENT = { "Customer payment", "客户付款" };
	private static final String[] H_CUST_REFUND = { "Customer refund", "客户退款" };
	private static final String[] H_SELLER_COFUND = { "Seller co-funded voucher discount", "商家共同赞助优惠券折扣" };
	private static final String[] H_REFUND_SELLER_COFUND = { "Refund of seller co-funded voucher discount", "商家共同赞助优惠券折扣退款" };
	private static final String[] H_PLATFORM_DISC = { "Platform discounts", "平台折扣" };
	private static final String[] H_REFUND_PLATFORM_DISC = { "Refund of platform discounts", "平台折扣退款" };
	private static final String[] H_PLATFORM_COFUND = { "Platform co-funded voucher discounts", "平台共同赞助优惠券折扣" };
	private static final String[] H_REFUND_PLATFORM_COFUND = { "Refund of platform co-funded voucher discounts", "平台共同赞助优惠券折扣退款" };
	private static final String[] H_SELLER_SHIP_DISC = { "Seller shipping fee discount", "商家运费折扣" };
	private static final String[] H_EST_WEIGHT = { "Estimated package weight (g)", "预估包裹重量", "预估包裹重量 (g)", "预估包裹重量(g)" };
	private static final String[] H_ACT_WEIGHT = { "Actual package weight (g)", "计费包裹重量", "计费包裹重量 (g)", "计费包裹重量(g)" };
	private static final String[] H_SHOP_ITEMS = { "Shopping center items", "已售商品详情" };
	private static final String[] H_CUST_BANK = { "Customer's bank for payment", "客户付款银行", "Customer bank for payment" };

	private final DataFormatter formatter = new DataFormatter();

	public ParsedWithdrawWorkbook parse(MultipartFile file) {
		try {
			return parse(file.getInputStream());
		} catch (IllegalArgumentException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalArgumentException("Failed to parse withdraw Excel: " + ex.getMessage(), ex);
		}
	}

	public ParsedWithdrawWorkbook parse(byte[] content) {
		return parse(new ByteArrayInputStream(content));
	}

	public ParsedWithdrawWorkbook parse(InputStream inputStream) {
		try (InputStream normalized = ExcelXmlNormalizer.normalize(inputStream);
				Workbook workbook = WorkbookFactory.create(normalized)) {
			Sheet sheet = findOrderDetailsSheet(workbook);
			int headerRowIndex = findHeaderRowIndex(sheet);
			Row headerRow = sheet.getRow(headerRowIndex);
			Map<String, Integer> cols = buildColumnIndex(headerRow);

			if (resolveHeader(cols, H_ORDER_ADJ_ID) == null) {
				throw new IllegalArgumentException(
						"Withdraw Excel must include column: Order/adjustment ID (or 订单ID/调整单ID)");
			}
			if (resolveHeader(cols, H_SETTLEMENT) == null) {
				throw new IllegalArgumentException(
						"Withdraw Excel must include a Total settlement amount (or 结算总金额) column");
			}

			List<ParsedWithdrawRow> rows = new ArrayList<>();
			int dataRows = 0;
			for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
				Row row = sheet.getRow(i);
				if (row == null) {
					continue;
				}
				String orderId = text(cols, row, H_ORDER_ADJ_ID);
				if (!StringUtils.hasText(orderId)) {
					continue;
				}
				dataRows++;
				rows.add(toParsedRow(row, cols, orderId.trim()));
			}
			return new ParsedWithdrawWorkbook(sheet.getSheetName(), dataRows, rows);
		} catch (IllegalArgumentException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalArgumentException("Failed to parse withdraw Excel: " + ex.getMessage(), ex);
		}
	}

	private ParsedWithdrawRow toParsedRow(Row row, Map<String, Integer> cols, String orderId) {
		BigDecimal settlement = decimal(cols, row, H_SETTLEMENT);
		Instant settled = instant(cols, row, H_SETTLED);
		return new ParsedWithdrawRow(
				row.getRowNum() + 1,
				orderId,
				text(cols, row, H_TYPE),
				instant(cols, row, H_CREATED),
				settled,
				text(cols, row, H_CURRENCY),
				settlement,
				decimal(cols, row, H_REVENUE),
				decimal(cols, row, H_SUB_AFTER),
				decimal(cols, row, H_SUB_BEFORE),
				decimal(cols, row, H_SELLER_DISC),
				decimal(cols, row, H_REFUND_SUB_AFTER),
				decimal(cols, row, H_REFUND_SUB_BEFORE),
				decimal(cols, row, H_REFUND_SELLER_DISC),
				decimal(cols, row, H_TOTAL_FEES),
				decimal(cols, row, H_TX_FEE),
				decimal(cols, row, H_COMMISSION),
				decimal(cols, row, H_CC_INTEREST),
				decimal(cols, row, H_SELLER_SHIP),
				decimal(cols, row, H_ACTUAL_SHIP),
				decimal(cols, row, H_PLAT_SHIP_DISC),
				decimal(cols, row, H_CUST_SHIP),
				decimal(cols, row, H_RETURN_SHIP),
				decimal(cols, row, H_REFUND_CUST_SHIP),
				decimal(cols, row, H_SHIP_SUBSIDY),
				decimal(cols, row, H_AFF_COMM),
				decimal(cols, row, H_AFF_COMM_BEFORE_PIT),
				decimal(cols, row, H_PIT_AFF),
				decimal(cols, row, H_AFF_PARTNER),
				decimal(cols, row, H_AFF_SHOP_ADS),
				decimal(cols, row, H_AFF_SHOP_ADS_BEFORE_PIT),
				decimal(cols, row, H_PIT_AFF_SHOP_ADS),
				decimal(cols, row, H_AFF_DEPOSIT),
				decimal(cols, row, H_AFF_REFUND),
				decimal(cols, row, H_AFF_PARTNER_SHOP_ADS),
				decimal(cols, row, H_SFP),
				decimal(cols, row, H_BONUS_CASHBACK),
				decimal(cols, row, H_LIVE_SPECIALS),
				decimal(cols, row, H_VOUCHER_XTRA),
				decimal(cols, row, H_EAMS),
				decimal(cols, row, H_BRANDS_CRAZY),
				decimal(cols, row, H_PAYLATER),
				decimal(cols, row, H_COMMERCE_GROWTH),
				decimal(cols, row, H_INFRA),
				decimal(cols, row, H_CAMPAIGN),
				decimal(cols, row, H_PREORDER),
				decimal(cols, row, H_ADJUSTMENT),
				text(cols, row, H_RELATED_ORDER),
				decimal(cols, row, H_CUST_PAYMENT),
				decimal(cols, row, H_CUST_REFUND),
				decimal(cols, row, H_SELLER_COFUND),
				decimal(cols, row, H_REFUND_SELLER_COFUND),
				decimal(cols, row, H_PLATFORM_DISC),
				decimal(cols, row, H_REFUND_PLATFORM_DISC),
				decimal(cols, row, H_PLATFORM_COFUND),
				decimal(cols, row, H_REFUND_PLATFORM_COFUND),
				decimal(cols, row, H_SELLER_SHIP_DISC),
				decimal(cols, row, H_EST_WEIGHT),
				decimal(cols, row, H_ACT_WEIGHT),
				text(cols, row, H_SHOP_ITEMS),
				text(cols, row, H_CUST_BANK));
	}

	private Sheet findOrderDetailsSheet(Workbook workbook) {
		for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
			Sheet sheet = workbook.getSheetAt(i);
			String name = sheet.getSheetName() == null ? "" : sheet.getSheetName().trim();
			if (name.equalsIgnoreCase("Order details")
					|| name.toLowerCase().contains("order detail")
					|| name.contains("订单")
					|| name.contains("明细")
					|| name.contains("收入")) {
				return sheet;
			}
		}
		for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
			Sheet sheet = workbook.getSheetAt(i);
			try {
				findHeaderRowIndex(sheet);
				return sheet;
			} catch (IllegalArgumentException ignored) {
				// try next
			}
		}
		throw new IllegalArgumentException(
				"Could not find a payout sheet with Order/adjustment ID or 订单ID/调整单ID header");
	}

	private int findHeaderRowIndex(Sheet sheet) {
		int last = Math.min(sheet.getLastRowNum(), HEADER_SCAN_LIMIT);
		for (int i = 0; i <= last; i++) {
			Row row = sheet.getRow(i);
			if (row == null) {
				continue;
			}
			Map<String, Integer> cols = buildColumnIndex(row);
			if (resolveHeader(cols, H_ORDER_ADJ_ID) != null) {
				return i;
			}
		}
		throw new IllegalArgumentException(
				"Could not find Excel header row containing Order/adjustment ID or 订单ID/调整单ID");
	}

	private Map<String, Integer> buildColumnIndex(Row headerRow) {
		Map<String, Integer> index = new LinkedHashMap<>();
		for (Cell cell : headerRow) {
			String name = formatter.formatCellValue(cell).trim();
			if (StringUtils.hasText(name)) {
				index.put(name, cell.getColumnIndex());
			}
		}
		return index;
	}

	private String text(Map<String, Integer> cols, Row row, String[] headerCandidates) {
		String header = resolveHeader(cols, headerCandidates);
		if (header == null) {
			return null;
		}
		Integer idx = cols.get(header);
		if (idx == null) {
			return null;
		}
		String value = cellValue(row, idx);
		return StringUtils.hasText(value) ? value.trim() : null;
	}

	private BigDecimal decimal(Map<String, Integer> cols, Row row, String[] headerCandidates) {
		String raw = text(cols, row, headerCandidates);
		if (!StringUtils.hasText(raw)) {
			return null;
		}
		try {
			return new BigDecimal(raw.replace(",", "").replace(" ", ""));
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private Instant instant(Map<String, Integer> cols, Row row, String[] headerCandidates) {
		String raw = text(cols, row, headerCandidates);
		if (!StringUtils.hasText(raw)) {
			return null;
		}
		DateTimeFormatter[] dateTimeFormats = {
				DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"),
				DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
				DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
				DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")
		};
		for (DateTimeFormatter format : dateTimeFormats) {
			try {
				return LocalDateTime.parse(raw, format).atZone(DEFAULT_ZONE).toInstant();
			} catch (DateTimeParseException ignored) {
				// next
			}
		}
		DateTimeFormatter[] dateFormats = {
				DateTimeFormatter.ofPattern("yyyy/MM/dd"),
				DateTimeFormatter.ofPattern("yyyy-MM-dd"),
				DateTimeFormatter.ofPattern("dd/MM/yyyy"),
				DateTimeFormatter.ofPattern("dd-MM-yyyy")
		};
		for (DateTimeFormatter format : dateFormats) {
			try {
				return LocalDate.parse(raw, format).atStartOfDay(DEFAULT_ZONE).toInstant();
			} catch (DateTimeParseException ignored) {
				// next
			}
		}
		return null;
	}

	private static String resolveHeader(Map<String, Integer> cols, String[] candidates) {
		for (String candidate : candidates) {
			if (candidate == null) continue;
			if (cols.containsKey(candidate)) {
				return candidate;
			}
		}
		for (String candidate : candidates) {
			if (candidate == null) continue;
			for (String key : cols.keySet()) {
				if (key.equalsIgnoreCase(candidate)) {
					return key;
				}
			}
		}
		// Match stripped spaces (e.g. "已扣缴 PIT" vs "已扣缴PIT")
		for (String candidate : candidates) {
			if (candidate == null) continue;
			String strippedCandidate = candidate.replaceAll("\\s+", "").toLowerCase();
			for (String key : cols.keySet()) {
				String strippedKey = key.replaceAll("\\s+", "").toLowerCase();
				if (strippedKey.equals(strippedCandidate)) {
					return key;
				}
			}
		}
		// Fuzzy match only for longer English labels (avoid "Type" matching "Transaction fee")
		for (String candidate : candidates) {
			if (candidate == null || candidate.length() < 12) {
				continue;
			}
			String c = candidate.toLowerCase();
			for (String key : cols.keySet()) {
				String lower = key.toLowerCase();
				if (lower.contains(c) || c.contains(lower)) {
					return key;
				}
			}
		}
		return null;
	}

	private String cellValue(Row row, int idx) {
		Cell cell = row.getCell(idx);
		if (cell == null) {
			return "";
		}
		return formatter.formatCellValue(cell).trim();
	}
}
