package com.laconic.lacoinvoice.config.quartz;

import org.quartz.spi.TriggerFiredBundle;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;
import org.springframework.stereotype.Component;

@Component
public class AutowiringSpringBeanJobFactory extends SpringBeanJobFactory implements ApplicationContextAware {

	private AutowireCapableBeanFactory beanFactory;

	@Override
	public void setApplicationContext(ApplicationContext applicationContext) {
		this.beanFactory = applicationContext.getAutowireCapableBeanFactory();
	}

	@Override
	protected Object createJobInstance(TriggerFiredBundle bundle) throws Exception {
		if (this.beanFactory == null) {
			throw new IllegalStateException("ApplicationContext has not been set on AutowiringSpringBeanJobFactory.");
		}
		// createBean uses constructor injection. Quartz's default factory only
		// calls a no-arg constructor, then field-wires — which breaks @Component jobs
		// that take services in the constructor (OrderSyncQuartzJob, etc.).
		return this.beanFactory.createBean(bundle.getJobDetail().getJobClass());
	}
}
