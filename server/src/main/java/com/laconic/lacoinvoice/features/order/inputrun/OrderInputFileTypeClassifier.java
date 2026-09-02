package com.laconic.lacoinvoice.features.order.inputrun;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laconic.lacoinvoice.common.util.ExcelXmlNormalizer;
import com.laconic.lacoinvoice.config.OpenAiProperties;
import com.laconic.lacoinvoice.domain.models.OrderInputFileType;

@Component
public class OrderInputFileTypeClassifier {

	private static final Logger log = LoggerFactory.getLogger(OrderInputFileTypeClassifier.class);
	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
	private static final int HEADER_SCAN_LIMIT = 25;
	private static final int HEURISTIC_CONFIDENCE_GAP = 3;

	private final OpenAiProperties openAiProperties;
	private final RestClient openAiRestClient;
	private final DataFormatter formatter = new DataFormatter();

	public OrderInputFileTypeClassifier(
			OpenAiProperties openAiProperties,
			@Qualifier("openAiRestClient") RestClient openAiRestClient) {
		this.openAiProperties = openAiProperties;
		this.openAiRestClient = openAiRestClient;
	}

	public OrderInputFileType classify(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Excel file is required.");
		}

		WorkbookSnapshot snapshot = extractSnapshot(file);
		HeuristicResult heuristic = classifyHeuristic(snapshot);

		if (heuristic.confident()) {
			return heuristic.type();
		}

		if (openAiProperties.isConfigured()) {
			try {
				return classifyWithOpenAi(snapshot);
			} catch (Exception ex) {
				log.warn("OpenAI input file type classification failed, using heuristic fallback: {}",
						ex.getMessage());
			}
		}

		if (heuristic.type() != null) {
			return heuristic.type();
		}

		throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
				"Could not determine input file type from the uploaded Excel file.");
	}

	private WorkbookSnapshot extractSnapshot(MultipartFile file) {
		try (InputStream normalized = ExcelXmlNormalizer.normalize(file.getInputStream());
				Workbook workbook = WorkbookFactory.create(normalized)) {
			List<String> sheetNames = new ArrayList<>();
			Set<String> headerCells = new LinkedHashSet<>();
			for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
				Sheet sheet = workbook.getSheetAt(sheetIndex);
				if (sheet == null) {
					continue;
				}
				String sheetName = sheet.getSheetName();
				if (StringUtils.hasText(sheetName)) {
					sheetNames.add(sheetName.trim());
				}
				int lastRow = Math.min(sheet.getLastRowNum(), HEADER_SCAN_LIMIT);
				for (int rowIndex = 0; rowIndex <= lastRow; rowIndex++) {
					Row row = sheet.getRow(rowIndex);
					if (row == null) {
						continue;
					}
					short lastCell = row.getLastCellNum();
					if (lastCell < 0) {
						continue;
					}
					for (int cellIndex = 0; cellIndex < lastCell; cellIndex++) {
						String value = formatter.formatCellValue(row.getCell(cellIndex)).trim();
						if (StringUtils.hasText(value)) {
							headerCells.add(value);
						}
					}
				}
			}
			return new WorkbookSnapshot(
					file.getOriginalFilename(),
					sheetNames,
					new ArrayList<>(headerCells));
		} catch (ResponseStatusException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Failed to read Excel file: " + ex.getMessage(), ex);
		}
	}

	private HeuristicResult classifyHeuristic(WorkbookSnapshot snapshot) {
		int shippingScore = 0;
		int serviceScore = 0;

		String filename = snapshot.filename() != null
				? snapshot.filename().toLowerCase(Locale.ROOT)
				: "";
		if (filename.contains("orderskulist") || filename.contains("order_sku")
				|| filename.contains("order-sku") || filename.contains("shipping")) {
			shippingScore += 4;
		}
		if (filename.contains("payout") || filename.contains("withdraw")
				|| filename.contains("settlement") || filename.contains("service")) {
			serviceScore += 4;
		}

		for (String sheetName : snapshot.sheetNames()) {
			String normalized = sheetName.toLowerCase(Locale.ROOT);
			if (normalized.contains("orderskulist") || normalized.contains("order sku")) {
				shippingScore += 6;
			}
			if (normalized.contains("order details") || normalized.contains("payout")
					|| normalized.contains("settlement") || normalized.contains("订单")) {
				serviceScore += 4;
			}
		}

		for (String header : snapshot.headerCells()) {
			String normalized = header.toLowerCase(Locale.ROOT);
			if (containsAny(normalized,
					"sku", "seller sku", "product name", "variation", "package id",
					"sku id", "sku货号", "商品名称", "规格")) {
				shippingScore += 2;
			}
			if (containsAny(normalized,
					"total settlement amount", "settlement amount", "结算总金额",
					"tiktok shop commission", "transaction fee", "total fees", "总费用",
					"affiliate commission", "seller shipping fee", "actual shipping fee",
					"order/adjustment id", "订单id/调整单id", "交易类型")) {
				serviceScore += 2;
			}
			if (normalized.equals("order id") || normalized.equals("订单id") || normalized.equals("订单 id")) {
				shippingScore += 1;
				serviceScore += 1;
			}
		}

		if (shippingScore == 0 && serviceScore == 0) {
			return new HeuristicResult(null, false);
		}
		if (shippingScore > serviceScore) {
			return new HeuristicResult(OrderInputFileType.SHIPPING_FEE,
					shippingScore - serviceScore >= HEURISTIC_CONFIDENCE_GAP);
		}
		if (serviceScore > shippingScore) {
			return new HeuristicResult(OrderInputFileType.SERVICE_FEE,
					serviceScore - shippingScore >= HEURISTIC_CONFIDENCE_GAP);
		}
		return new HeuristicResult(OrderInputFileType.SHIPPING_FEE, false);
	}

	private OrderInputFileType classifyWithOpenAi(WorkbookSnapshot snapshot) {
		String userPrompt = """
				Classify this TikTok Shop Excel export as either SHIPPING_FEE or SERVICE_FEE.

				SHIPPING_FEE = OrderSKUList style order line export (SKU rows per order).
				SERVICE_FEE = Payout / settlement / withdraw report with fee columns.

				Filename: %s
				Sheet names: %s
				Header cells (sample): %s

				Reply with exactly one token: SHIPPING_FEE or SERVICE_FEE.
				""".formatted(
				snapshot.filename(),
				String.join(", ", snapshot.sheetNames()),
				String.join(" | ", snapshot.headerCells().stream().limit(80).toList()));

		Map<String, Object> body = Map.of(
				"model", openAiProperties.getModel(),
				"temperature", 0,
				"messages", List.of(
						Map.of("role", "system", "content",
								"You classify TikTok Shop Excel exports. Reply with only SHIPPING_FEE or SERVICE_FEE."),
						Map.of("role", "user", "content", userPrompt)));

		String responseBody;
		try {
			responseBody = openAiRestClient.post()
					.uri("/chat/completions")
					.contentType(MediaType.APPLICATION_JSON)
					.header("Authorization", "Bearer " + openAiProperties.getApiKey().trim())
					.body(body)
					.retrieve()
					.body(String.class);
		} catch (RestClientResponseException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"OpenAI classification failed: " + ex.getStatusText(), ex);
		}

		String content = parseOpenAiContent(responseBody);
		if (content.contains("SERVICE_FEE")) {
			return OrderInputFileType.SERVICE_FEE;
		}
		if (content.contains("SHIPPING_FEE")) {
			return OrderInputFileType.SHIPPING_FEE;
		}
		throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
				"OpenAI returned an unexpected classification response.");
	}

	private String parseOpenAiContent(String responseBody) {
		try {
			JsonNode root = OBJECT_MAPPER.readTree(responseBody);
			JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
			return contentNode.asText("").toUpperCase(Locale.ROOT);
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Failed to parse OpenAI response.", ex);
		}
	}

	private static boolean containsAny(String value, String... needles) {
		for (String needle : needles) {
			if (value.contains(needle.toLowerCase(Locale.ROOT))) {
				return true;
			}
		}
		return false;
	}

	private record WorkbookSnapshot(String filename, List<String> sheetNames, List<String> headerCells) {
	}

	private record HeuristicResult(OrderInputFileType type, boolean confident) {
	}
}
