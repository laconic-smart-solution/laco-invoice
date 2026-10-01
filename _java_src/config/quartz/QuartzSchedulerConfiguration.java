package com.laconic.lacoinvoice.config.quartz;

import org.springframework.boot.quartz.autoconfigure.SchedulerFactoryBeanCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzSchedulerConfiguration {

	@Bean
	public SchedulerFactoryBeanCustomizer autowiringJobFactoryCustomizer(AutowiringSpringBeanJobFactory jobFactory) {
		return schedulerFactoryBean -> schedulerFactoryBean.setJobFactory(jobFactory);
	}
}
