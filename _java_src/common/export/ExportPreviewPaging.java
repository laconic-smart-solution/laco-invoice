package com.laconic.lacoinvoice.common.export;

import java.util.Collections;
import java.util.List;

import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;

public final class ExportPreviewPaging {

	private ExportPreviewPaging() {
	}

	public static <T> ApiResponse<List<T>> pageOf(List<T> allItems, int pageNumber, int pageSize) {
		int safePage = Math.max(pageNumber, 1);
		int safeSize = Math.min(Math.max(pageSize, 1), 50);
		int total = allItems.size();
		int from = (safePage - 1) * safeSize;
		if (from >= total) {
			int totalPages = total == 0 ? 0 : (int) Math.ceil(total / (double) safeSize);
			return ApiResponse.ok("OK", List.of(), new PageMeta(safePage, safeSize, total, totalPages));
		}
		int to = Math.min(from + safeSize, total);
		List<T> page = allItems.subList(from, to);
		int totalPages = (int) Math.ceil(total / (double) safeSize);
		return ApiResponse.ok("OK", List.copyOf(page), new PageMeta(safePage, safeSize, total, totalPages));
	}

	public static List<Long> pageIds(List<Long> allIds, int pageNumber, int pageSize) {
		int safePage = Math.max(pageNumber, 1);
		int safeSize = Math.min(Math.max(pageSize, 1), 50);
		int total = allIds.size();
		int from = (safePage - 1) * safeSize;
		if (from >= total) {
			return List.of();
		}
		return List.copyOf(allIds.subList(from, Math.min(from + safeSize, total)));
	}

	public static PageMeta meta(int pageNumber, int pageSize, long totalElements) {
		int safePage = Math.max(pageNumber, 1);
		int safeSize = Math.min(Math.max(pageSize, 1), 50);
		int totalPages = totalElements == 0 ? 0 : (int) Math.ceil(totalElements / (double) safeSize);
		return new PageMeta(safePage, safeSize, totalElements, totalPages);
	}

	public static <T> ApiResponse<List<T>> empty(int pageNumber, int pageSize) {
		return ApiResponse.ok("OK", Collections.emptyList(), meta(pageNumber, pageSize, 0));
	}
}
