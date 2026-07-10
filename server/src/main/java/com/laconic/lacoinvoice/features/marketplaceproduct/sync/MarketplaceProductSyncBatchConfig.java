package com.laconic.lacoinvoice.features.marketplaceproduct.sync;

import org.springframework.batch.core.configuration.JobRegistry;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.configuration.support.MapJobRegistry;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.batch.core.launch.support.TaskExecutorJobOperator;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;

import com.laconic.lacoinvoice.domain.models.Product;
import com.laconic.lacoinvoice.integration.marketplace.product.GatewayProductData;

@Configuration
@EnableBatchProcessing
public class MarketplaceProductSyncBatchConfig {

	public static final String JOB_NAME = "marketplaceProductSyncJob";

	@Bean
	public JobOperator asyncJobOperator(
			JobRepository jobRepository,
			@Qualifier("marketplaceProductSyncJob") Job marketplaceProductSyncJob) throws Exception {
		JobRegistry jobRegistry = new MapJobRegistry();
		jobRegistry.register(marketplaceProductSyncJob);

		TaskExecutorJobOperator operator = new TaskExecutorJobOperator();
		operator.setJobRepository(jobRepository);
		operator.setJobRegistry(jobRegistry);
		operator.setTaskExecutor(new SimpleAsyncTaskExecutor("marketplace-product-sync-"));
		operator.afterPropertiesSet();
		return operator;
	}

	@Bean
	public TaskExecutor marketplaceProductDetailTaskExecutor() {
		SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("marketplace-product-detail-");
		executor.setConcurrencyLimit(4);
		return executor;
	}

	@Bean
	public Job marketplaceProductSyncJob(
			JobRepository jobRepository,
			Step marketplaceProductListUpsertStep,
			Step marketplaceProductDetailEnrichStep,
			Step marketplaceProductSoftDisableStep,
			MarketplaceProductSyncJobListener jobListener) {
		return new JobBuilder(JOB_NAME, jobRepository)
				.listener(jobListener)
				.start(marketplaceProductListUpsertStep)
				.next(marketplaceProductDetailEnrichStep)
				.next(marketplaceProductSoftDisableStep)
				.build();
	}

	@Bean
	public Step marketplaceProductListUpsertStep(
			JobRepository jobRepository,
			PlatformTransactionManager transactionManager,
			MarketplaceProductPagingItemReader listReader,
			MarketplaceProductListUpsertWriter listWriter) {
		return new StepBuilder("marketplaceProductListUpsertStep", jobRepository)
				.<GatewayProductData, GatewayProductData>chunk(50, transactionManager)
				.reader(listReader)
				.writer(listWriter)
				.build();
	}

	@Bean
	public Step marketplaceProductDetailEnrichStep(
			JobRepository jobRepository,
			PlatformTransactionManager transactionManager,
			MarketplaceProductDetailItemReader detailReader,
			MarketplaceProductDetailEnrichProcessor detailProcessor,
			MarketplaceProductDetailEnrichWriter detailWriter,
			TaskExecutor marketplaceProductDetailTaskExecutor) {
		return new StepBuilder("marketplaceProductDetailEnrichStep", jobRepository)
				.<Product, Product>chunk(10, transactionManager)
				.reader(detailReader)
				.processor(detailProcessor)
				.writer(detailWriter)
				.taskExecutor(marketplaceProductDetailTaskExecutor)
				.build();
	}

	@Bean
	public Step marketplaceProductSoftDisableStep(
			JobRepository jobRepository,
			PlatformTransactionManager transactionManager,
			MarketplaceProductSoftDisableTasklet softDisableTasklet) {
		return new StepBuilder("marketplaceProductSoftDisableStep", jobRepository)
				.tasklet(softDisableTasklet, transactionManager)
				.build();
	}
}
