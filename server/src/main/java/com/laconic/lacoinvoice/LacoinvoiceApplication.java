package com.laconic.lacoinvoice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.laconic.lacoinvoice.domain.models")
@EnableJpaRepositories(basePackages = "com.laconic.lacoinvoice.domain.repositories")
public class LacoinvoiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(LacoinvoiceApplication.class, args);
	}
}
