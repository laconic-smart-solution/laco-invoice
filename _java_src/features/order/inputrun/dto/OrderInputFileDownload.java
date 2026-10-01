package com.laconic.lacoinvoice.features.order.inputrun.dto;

import org.springframework.http.MediaType;

public record OrderInputFileDownload(String filename, byte[] content, MediaType contentType) {

	public static OrderInputFileDownload excel(String filename, byte[] content) {
		return new OrderInputFileDownload(
				filename,
				content,
				MediaType.parseMediaType(
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
	}

	public static OrderInputFileDownload pdf(String filename, byte[] content) {
		return new OrderInputFileDownload(filename, content, MediaType.APPLICATION_PDF);
	}
}
