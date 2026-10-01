package com.laconic.lacoinvoice.common.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.laconic.lacoinvoice.common.exception.BadGatewayException;
import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.exception.ResourceConflictException;
import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail(404, ex.getMessage(), null));
	}

	@ExceptionHandler(ResourceConflictException.class)
	public ResponseEntity<ApiResponse<Void>> handleConflict(ResourceConflictException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.fail(409, ex.getMessage(), ex.getMeta()));
	}

	@ExceptionHandler(BusinessRuleException.class)
	public ResponseEntity<ApiResponse<Void>> handleBusinessRule(BusinessRuleException ex) {
		return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
				.body(ApiResponse.fail(422, ex.getMessage(), ex.getMeta()));
	}

	@ExceptionHandler(BadGatewayException.class)
	public ResponseEntity<ApiResponse<Void>> handleBadGateway(BadGatewayException ex) {
		return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.fail(502, ex.getMessage(), null));
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException ex) {
		HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
		if (status == null) {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
		}
		String msg = ex.getReason() != null ? ex.getReason() : ex.getMessage();
		return ResponseEntity.status(ex.getStatusCode()).body(ApiResponse.fail(status.value(), msg, null));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> fields = new LinkedHashMap<>();
		for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
			fields.put(fe.getField(), fe.getDefaultMessage());
		}
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(400, "Validation failed", fields));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ApiResponse<Void>> handleBadRequest(IllegalArgumentException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(400, ex.getMessage(), null));
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
		Throwable root = ex.getMostSpecificCause();
		String detail = root != null ? root.getMessage() : ex.getMessage();
		String msg = "Request rejected by database rules (CHECK/FK/NOT NULL). Cause: "
				+ (detail != null ? detail : ex.getMessage());
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(400, msg, null));
	}
}
