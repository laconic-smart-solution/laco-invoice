package com.laconic.lacoinvoice.features.paymentvoucher.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.laconic.lacoinvoice.domain.models.VoucherPaymentMethod;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoicePaymentVoucherCreateRequest")
public class PaymentVoucherCreateRequest {

	@Size(max = 100)
	private String voucherNumber;

	@NotNull
	private LocalDate date;

	@NotNull
	private Long storeId;

	@Size(max = 255)
	private String customerName;

	@Size(max = 100)
	private String customerTaxId;

	@NotNull
	@DecimalMin(value = "0.01")
	private BigDecimal totalAmount;

	@NotNull
	private VoucherPaymentMethod paymentMethod;

	@Size(max = 200)
	private String bankReference;

	private String notes;

	@NotEmpty
	@Valid
	private List<AllocationRequest> allocations;

	@Getter
	@Setter
	@NoArgsConstructor
	@Schema(name = "LacoinvoiceVoucherAllocationRequest")
	public static class AllocationRequest {

		@NotNull
		private Long orderId;

		private Long invoiceId;

		@NotNull
		@DecimalMin(value = "0.01")
		private BigDecimal allocatedAmount;

		private String notes;
	}
}
