package com.laconic.lacoinvoice.config.quartz;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.quartz.Job;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.spi.TriggerFiredBundle;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.context.ApplicationContext;

class AutowiringSpringBeanJobFactoryTest {

	@Test
	void createsJobThroughSpringSoConstructorInjectionWorks() throws Exception {
		AutowireCapableBeanFactory beanFactory = mock(AutowireCapableBeanFactory.class);
		ApplicationContext context = mock(ApplicationContext.class);
		when(context.getAutowireCapableBeanFactory()).thenReturn(beanFactory);

		ConstructorInjectedJob expected = new ConstructorInjectedJob("ok");
		when(beanFactory.createBean(ConstructorInjectedJob.class)).thenReturn(expected);

		AutowiringSpringBeanJobFactory factory = new AutowiringSpringBeanJobFactory();
		factory.setApplicationContext(context);

		JobDetail jobDetail = JobBuilder.newJob(ConstructorInjectedJob.class)
				.withIdentity("constructorJob")
				.storeDurably()
				.build();
		TriggerFiredBundle bundle = mock(TriggerFiredBundle.class);
		when(bundle.getJobDetail()).thenReturn(jobDetail);

		Object job = factory.createJobInstance(bundle);

		assertThat(job).isSameAs(expected);
		verify(beanFactory).createBean(ConstructorInjectedJob.class);
	}

	public static final class ConstructorInjectedJob implements Job {

		private final String value;

		public ConstructorInjectedJob(String value) {
			this.value = value;
		}

		@Override
		public void execute(JobExecutionContext context) {
			// unused
		}

		public String value() {
			return value;
		}
	}
}
