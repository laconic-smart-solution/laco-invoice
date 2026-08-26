package com.laconic.lacoinvoice.features.customer;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.exception.BusinessRuleException;
import com.laconic.lacoinvoice.common.export.ExcelExportWriter;
import com.laconic.lacoinvoice.common.export.ExportColumnSelector;
import com.laconic.lacoinvoice.common.export.ExportPreviewPaging;
import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.pagination.SpecQuerySupport;
import com.laconic.lacoinvoice.common.service.BaseServiceImpl;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.repositories.CustomerInfoRepository;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.CreateRequest;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.customer.pageable.CustomerPageRequest;

@Service
public class CustomerServiceImpl extends BaseServiceImpl<CustomerInfo, CustomerDto, CreateRequest, UpdateRequest>
		implements CustomerService {

	private static final int MAX_EXPORT_ROWS = 10_000;
	private static final DateTimeFormatter EXPORT_DATE = DateTimeFormatter.BASIC_ISO_DATE;

	private static final Map<String, String> CUSTOMER_FILTER_FIELD_PATHS = Map.of(
			"storeId", "store.id",
			"marketplaceId", "marketplace.id",
			"marketplaceCode", "marketplace.code");

	private static final LinkedHashMap<String, ExportColumnSelector.ColumnDef<CustomerDto>> EXPORT_COLUMNS =
			createExportColumns();

	private static LinkedHashMap<String, ExportColumnSelector.ColumnDef<CustomerDto>> createExportColumns() {
		LinkedHashMap<String, ExportColumnSelector.ColumnDef<CustomerDto>> columns = new LinkedHashMap<>();
		columns.put("id", new ExportColumnSelector.ColumnDef<>("ID", CustomerDto::id));
		columns.put("storeName", new ExportColumnSelector.ColumnDef<>("Store", CustomerDto::storeName));
		columns.put("marketplaceCode", new ExportColumnSelector.ColumnDef<>("Marketplace", CustomerDto::marketplaceCode));
		columns.put("externalCustomerId", new ExportColumnSelector.ColumnDef<>("External Customer ID", CustomerDto::externalCustomerId));
		columns.put("name", new ExportColumnSelector.ColumnDef<>("Name", CustomerDto::name));
		columns.put("email", new ExportColumnSelector.ColumnDef<>("Email", CustomerDto::email));
		columns.put("phone", new ExportColumnSelector.ColumnDef<>("Phone", CustomerDto::phone));
		columns.put("gender", new ExportColumnSelector.ColumnDef<>("Gender", CustomerDto::gender));
		columns.put("address", new ExportColumnSelector.ColumnDef<>("Address", CustomerDto::address));
		columns.put("createdAt", new ExportColumnSelector.ColumnDef<>("Created At", CustomerDto::createdAt));
		return columns;
	}

	private final CustomerInfoRepository repository;
	private final CustomerMapper mapper;

	public CustomerServiceImpl(CustomerInfoRepository repository, CustomerMapper mapper) {
		this.repository = repository;
		this.mapper = mapper;
	}

	@Override
	@Loggable
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<CustomerDto>> page(CustomerPageRequest request) {
		return PageQuerySupport.query(
				repository,
				mapper,
				request.toPageAndFilter(),
				CustomerInfo.class,
				request.getFilter(),
				CUSTOMER_FILTER_FIELD_PATHS);
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public byte[] exportExcel(CustomerExportRequest request) {
		List<CustomerDto> customers = resolveCustomersForExport(request);
		if (customers.isEmpty()) {
			throw new BusinessRuleException("No customers found to export.");
		}

		ExportColumnSelector.SelectedColumns<CustomerDto> columns =
				ExportColumnSelector.select(EXPORT_COLUMNS, request.getColumns());
		return ExcelExportWriter.write(
				"Customers",
				columns.headers(),
				ExportColumnSelector.mapRows(columns, customers));
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public String exportFilename() {
		return "customers-export-" + LocalDate.now().format(EXPORT_DATE) + ".xlsx";
	}

	@Override
	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<CustomerDto>> exportPreview(CustomerExportRequest request) {
		int pageNumber = request.getPageNumber() != null ? request.getPageNumber() : 1;
		int pageSize = request.getPageSize() != null ? request.getPageSize() : 10;

		List<Long> allIds = resolveCustomerIdsForExport(request);
		if (allIds.isEmpty()) {
			return ExportPreviewPaging.empty(pageNumber, pageSize);
		}

		List<Long> pageIds = ExportPreviewPaging.pageIds(allIds, pageNumber, pageSize);
		if (pageIds.isEmpty()) {
			return ApiResponse.ok("OK", List.of(), ExportPreviewPaging.meta(pageNumber, pageSize, allIds.size()));
		}

		List<CustomerInfo> entities = repository.findAllById(pageIds);
		Map<Long, CustomerInfo> byId = entities.stream()
				.filter(customer -> customer.getId() != null)
				.collect(Collectors.toMap(CustomerInfo::getId, customer -> customer, (a, b) -> a));

		List<CustomerDto> ordered = pageIds.stream()
				.map(byId::get)
				.filter(Objects::nonNull)
				.map(mapper::toDto)
				.toList();
		PageMeta meta = ExportPreviewPaging.meta(pageNumber, pageSize, allIds.size());
		return ApiResponse.ok("OK", ordered, meta);
	}

	private List<CustomerDto> resolveCustomersForExport(CustomerExportRequest request) {
		List<Long> customerIds = resolveCustomerIdsForExport(request);
		if (customerIds.isEmpty()) {
			return List.of();
		}

		List<CustomerInfo> entities = repository.findAllById(customerIds);
		Map<Long, CustomerInfo> byId = entities.stream()
				.filter(customer -> customer.getId() != null)
				.collect(Collectors.toMap(CustomerInfo::getId, customer -> customer, (a, b) -> a));

		return customerIds.stream()
				.map(byId::get)
				.filter(Objects::nonNull)
				.map(mapper::toDto)
				.toList();
	}

	private List<Long> resolveCustomerIdsForExport(CustomerExportRequest request) {
		if (request == null) {
			throw new BusinessRuleException("Export request is required.");
		}

		List<Long> ids = request.getIds() == null
				? List.of()
				: request.getIds().stream().filter(Objects::nonNull).distinct().toList();

		if (!ids.isEmpty()) {
			if (ids.size() > MAX_EXPORT_ROWS) {
				throw new BusinessRuleException(
						"Export is limited to " + MAX_EXPORT_ROWS + " customers. Narrow your selection.");
			}
			return ids;
		}

		if (request.isExportAll()) {
			return SpecQuerySupport.findAll(
					repository,
					CustomerInfo.class,
					request.getFilter(),
					CUSTOMER_FILTER_FIELD_PATHS,
					MAX_EXPORT_ROWS,
					"Export is limited to " + MAX_EXPORT_ROWS + " customers. Apply filters to reduce the set.")
					.stream()
					.map(CustomerInfo::getId)
					.filter(Objects::nonNull)
					.toList();
		}

		throw new BusinessRuleException("Select customers to export, or confirm export all.");
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public CustomerDto getById(Long id) {
		return super.getById(id);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public List<CustomerDto> getAll() {
		return super.getAll();
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public CustomerDto create(CreateRequest request) {
		return super.create(request);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public CustomerDto update(Long id, UpdateRequest request) {
		return super.update(id, request);
	}

	@Override
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public void delete(Long id) {
		super.delete(id);
	}

	@Override
	protected JpaRepository<CustomerInfo, Long> repository() {
		return repository;
	}

	@Override
	protected BaseMapper<CustomerInfo, CustomerDto> mapper() {
		return mapper;
	}

	@Override
	protected CustomerInfo createEntity(CreateRequest request) {
		CustomerInfo entity = new CustomerInfo();
		applyFields(entity, request.getName(), request.getEmail(), request.getPhone(), request.getGender(),
				request.getAddress());
		return entity;
	}

	@Override
	protected void updateEntity(CustomerInfo entity, UpdateRequest request) {
		applyFields(entity, request.getName(), request.getEmail(), request.getPhone(), request.getGender(),
				request.getAddress());
	}

	private static void applyFields(
			CustomerInfo entity,
			String name,
			String email,
			String phone,
			String gender,
			String address) {
		entity.setName(name != null ? name.trim() : null);
		entity.setEmail(StringUtils.hasText(email) ? email.trim() : null);
		entity.setPhone(StringUtils.hasText(phone) ? phone.trim() : null);
		entity.setGender(StringUtils.hasText(gender) ? gender.trim() : null);
		entity.setAddress(StringUtils.hasText(address) ? address.trim() : null);
	}
}
