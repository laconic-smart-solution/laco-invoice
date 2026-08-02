package com.laconic.lacoinvoice.features.customer;

import java.util.List;

import com.laconic.lacoinvoice.common.service.BaseService;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.CreateRequest;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.customer.pageable.CustomerPageRequest;

public interface CustomerService extends BaseService<CustomerDto, CreateRequest, UpdateRequest> {

	ApiResponse<List<CustomerDto>> page(CustomerPageRequest request);

	byte[] exportExcel(CustomerExportRequest request);

	String exportFilename();

	ApiResponse<List<CustomerDto>> exportPreview(CustomerExportRequest request);
}
