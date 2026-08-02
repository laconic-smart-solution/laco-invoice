package com.laconic.lacoinvoice.features.user;

import java.util.List;

import com.laconic.lacoinvoice.features.user.pageable.UserFilter;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "LacoinvoiceUserExportRequest")
public class UserExportRequest {

	/** When non-empty, export / preview only these user IDs. */
	private List<Long> ids;

	/** When true (and ids empty), export all users matching {@link #filter}. */
	private boolean exportAll;

	private UserFilter filter;

	/**
	 * Optional Excel column keys in display order.
	 * When empty, all columns are exported.
	 */
	private List<String> columns;

	/** Preview page (1-based). Used by export preview only. */
	@Min(1)
	private Integer pageNumber = 1;

	/** Preview page size. Used by export preview only. */
	@Min(1)
	@Max(50)
	private Integer pageSize = 10;
}
