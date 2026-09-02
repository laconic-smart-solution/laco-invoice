package com.laconic.lacoinvoice.features.paymentvoucher.pageable;

import com.laconic.lacoinvoice.domain.models.VoucherPaymentMethod;
import com.laconic.lacoinvoice.domain.models.VoucherStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoicePaymentVoucherFilter")
public class PaymentVoucherFilter {

	private Long storeId;

	private String voucherNumber;

	private String customerName;

	private VoucherPaymentMethod paymentMethod;

	private VoucherStatus status;
}
