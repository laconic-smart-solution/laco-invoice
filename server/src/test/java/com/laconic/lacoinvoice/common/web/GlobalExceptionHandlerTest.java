package com.laconic.lacoinvoice.common.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;

class GlobalExceptionHandlerTest {

	private GlobalExceptionHandler handler;

	@BeforeEach
	void setUp() {
		handler = new GlobalExceptionHandler();
	}

	@Test
	void mapsResourceNotFoundTo404() {
		ResponseEntity<ApiResponse<Void>> response =
				handler.handleNotFound(new ResourceNotFoundException("missing"));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().getCode()).isEqualTo(404);
	}

	@Test
	void mapsResourceConflictTo409() {
		ResponseEntity<ApiResponse<Void>> response =
				handler.handleConflict(new ResourceConflictException("duplicate"));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
		assertThat(response.getBody().getCode()).isEqualTo(409);
	}

	@Test
	void mapsBusinessRuleTo422() {
		ResponseEntity<ApiResponse<Void>> response =
				handler.handleBusinessRule(new BusinessRuleException("invalid state"));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
		assertThat(response.getBody().getCode()).isEqualTo(422);
	}
}
