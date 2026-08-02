package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.order-bulk-generate")
public class OrderBulkGenerateProperties {

	/** Max orders accepted for one async bulk-generate job. */
	private int maxOrders = 2_000;

	/** Spring Batch chunk size for PDF generation. */
	private int chunkSize = 10;

	/** Root directory for per-run work folders (PDFs + ZIP). */
	private String workRoot = System.getProperty("java.io.tmpdir") + "/laco-invoice/bulk-generate";

	public int getMaxOrders() {
		return maxOrders;
	}

	public void setMaxOrders(int maxOrders) {
		this.maxOrders = maxOrders;
	}

	public int getChunkSize() {
		return chunkSize;
	}

	public void setChunkSize(int chunkSize) {
		this.chunkSize = chunkSize;
	}

	public String getWorkRoot() {
		return workRoot;
	}

	public void setWorkRoot(String workRoot) {
		this.workRoot = workRoot;
	}
}
