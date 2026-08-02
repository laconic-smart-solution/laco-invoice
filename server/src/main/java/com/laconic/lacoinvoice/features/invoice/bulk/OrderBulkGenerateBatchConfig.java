package com.laconic.lacoinvoice.features.invoice.bulk;

import org.springframework.batch.core.configuration.JobRegistry;
import org.springframework.batch.core.configuration.support.MapJobRegistry;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.batch.core.launch.support.TaskExecutorJobOperator;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;

import com.laconic.lacoinvoice.config.OrderBulkGenerateProperties;

@Configuration
@EnableConfigurationProperties(OrderBulkGenerateProperties.class)
public class OrderBulkGenerateBatchConfig {

	public static final String JOB_NAME = "orderBulkGenerateJob";

	private final OrderBulkGenerateProperties properties;

	public OrderBulkGenerateBatchConfig(OrderBulkGenerateProperties properties) {
		this.properties = properties;
	}

	@Bean
	public JobOperator orderBulkGenerateJobOperator(
			JobRepository jobRepository,
			@Qualifier("orderBulkGenerateJob") Job orderBulkGenerateJob) throws Exception {
		JobRegistry jobRegistry = new MapJobRegistry();
		jobRegistry.register(orderBulkGenerateJob);

		TaskExecutorJobOperator operator = new TaskExecutorJobOperator();
		operator.setJobRepository(jobRepository);
		operator.setJobRegistry(jobRegistry);
		operator.setTaskExecutor(new SimpleAsyncTaskExecutor("order-bulk-generate-"));
		operator.afterPropertiesSet();
		return operator;
	}

	@Bean
	public Job orderBulkGenerateJob(
			JobRepository jobRepository,
			Step orderBulkGeneratePdfStep,
			Step orderBulkGenerateZipStep,
			OrderBulkGenerateJobListener jobListener) {
		return new JobBuilder(JOB_NAME, jobRepository)
				.listener(jobListener)
				.start(orderBulkGeneratePdfStep)
				.next(orderBulkGenerateZipStep)
				.build();
	}

	@Bean
	public Step orderBulkGeneratePdfStep(
			JobRepository jobRepository,
			PlatformTransactionManager transactionManager,
			OrderBulkGenerateItemReader reader,
			OrderBulkGenerateItemProcessor processor,
			OrderBulkGenerateItemWriter writer) {
		return new StepBuilder("orderBulkGeneratePdfStep", jobRepository)
				.<Long, OrderBulkGeneratePdfItem>chunk(properties.getChunkSize(), transactionManager)
				.reader(reader)
				.processor(processor)
				.writer(writer)
				.build();
	}

	@Bean
	public Step orderBulkGenerateZipStep(
			JobRepository jobRepository,
			PlatformTransactionManager transactionManager,
			OrderBulkGenerateZipTasklet zipTasklet) {
		return new StepBuilder("orderBulkGenerateZipStep", jobRepository)
				.tasklet(zipTasklet, transactionManager)
				.build();
	}
}
