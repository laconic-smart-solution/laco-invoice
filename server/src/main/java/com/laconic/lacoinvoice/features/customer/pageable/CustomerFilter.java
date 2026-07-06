package com.laconic.lacoinvoice.features.customer.pageable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceCustomerFilter")
public class CustomerFilter {

	private String name;

	private String email;

	private String phone;

	private String gender;
}
