package com.laconic.lacoinvoice.common.pagination;

import java.util.List;

import lombok.Builder;

@Builder
public record PaginationDTO<T>(
		int pageNo,
		int pageSize,
		int totalPages,
		long totalElements,
		List<T> content,
		boolean last) {
}
