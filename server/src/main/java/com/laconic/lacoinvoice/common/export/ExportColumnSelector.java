package com.laconic.lacoinvoice.common.export;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.function.Function;

/**
 * Builds Excel headers/rows from a declared column catalog and an optional
 * client-requested subset (visibility order).
 */
public final class ExportColumnSelector {

	private ExportColumnSelector() {
	}

	public static <T> SelectedColumns<T> select(
			LinkedHashMap<String, ColumnDef<T>> catalog,
			List<String> requestedColumns) {
		List<String> keys = new ArrayList<>();
		List<String> headers = new ArrayList<>();
		List<Function<T, Object>> extractors = new ArrayList<>();

		if (requestedColumns == null || requestedColumns.isEmpty()) {
			catalog.forEach((key, def) -> {
				keys.add(key);
				headers.add(def.header());
				extractors.add(def.extractor());
			});
			return new SelectedColumns<>(keys, headers, extractors);
		}

		for (String raw : requestedColumns) {
			if (raw == null || raw.isBlank()) {
				continue;
			}
			String normalized = raw.trim();
			String catalogKey = resolveKey(catalog, normalized);
			if (catalogKey == null || keys.contains(catalogKey)) {
				continue;
			}
			ColumnDef<T> def = catalog.get(catalogKey);
			keys.add(catalogKey);
			headers.add(def.header());
			extractors.add(def.extractor());
		}

		if (keys.isEmpty()) {
			return select(catalog, null);
		}
		return new SelectedColumns<>(keys, headers, extractors);
	}

	public static <T> List<List<Object>> mapRows(SelectedColumns<T> columns, List<T> items) {
		List<List<Object>> rows = new ArrayList<>(items.size());
		for (T item : items) {
			List<Object> row = new ArrayList<>(columns.extractors().size());
			for (Function<T, Object> extractor : columns.extractors()) {
				Object value = extractor.apply(item);
				row.add(value == null ? "" : value);
			}
			rows.add(row);
		}
		return rows;
	}

	private static <T> String resolveKey(LinkedHashMap<String, ColumnDef<T>> catalog, String requested) {
		if (catalog.containsKey(requested)) {
			return requested;
		}
		String lower = requested.toLowerCase(Locale.ROOT);
		for (String key : catalog.keySet()) {
			if (key.equalsIgnoreCase(lower)) {
				return key;
			}
		}
		return null;
	}

	public record ColumnDef<T>(String header, Function<T, Object> extractor) {
	}

	public record SelectedColumns<T>(
			List<String> keys,
			List<String> headers,
			List<Function<T, Object>> extractors) {
	}
}
