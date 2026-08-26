package com.laconic.lacoinvoice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.order-import.preview-cleanup.quartz")
public class OrderImportPreviewCleanupQuartzProperties {

	/**
	 * When false, the Quartz job beans are not registered.
	 */
	private boolean enabled = false;

	/**
	 * Default: every day at 03:15 Asia/Bangkok.
	 */
	private String cron = "0 15 3 * * ?";

	private String timezone = "Asia/Bangkok";

	/**
	 * Hard-delete COMMITTED / EXPIRED / CANCELLED staging batches older than this many days.
	 * Does not touch {@code order_import_files} or live orders.
	 */
	private int retentionDays = 7;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getCron() {
		return cron;
	}

	public void setCron(String cron) {
		this.cron = cron;
	}

	public String getTimezone() {
		return timezone;
	}

	public void setTimezone(String timezone) {
		this.timezone = timezone;
	}

	public int getRetentionDays() {
		return retentionDays;
	}

	public void setRetentionDays(int retentionDays) {
		this.retentionDays = retentionDays;
	}
}
