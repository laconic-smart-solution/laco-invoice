package com.laconic.lacoinvoice.common.autoconfigure;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@AutoConfiguration
@ComponentScan(
		basePackages = "com.laconic.lacoinvoice.common",
		excludeFilters = @ComponentScan.Filter(
				type = FilterType.REGEX,
				pattern = "com\\.laconic\\.lacoinvoice\\.common\\.autoconfigure\\..*"))
public class LacoinvoiceCommonAutoConfiguration {
}
