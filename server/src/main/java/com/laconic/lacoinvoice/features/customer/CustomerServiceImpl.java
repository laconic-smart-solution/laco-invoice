package com.laconic.lacoinvoice.features.customer;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.aspect.Loggable;
import com.laconic.lacoinvoice.common.mapper.BaseMapper;
import com.laconic.lacoinvoice.common.pagination.PageQuerySupport;
import com.laconic.lacoinvoice.common.service.BaseServiceImpl;
import com.laconic.lacoinvoice.common.util.ObjectMapUtils;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.repositories.CustomerInfoRepository;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.CreateRequest;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.customer.pageable.CustomerPageRequest;

@Service
public class CustomerServiceImpl extends BaseServiceImpl<CustomerInfo, CustomerDto, CreateRequest, UpdateRequest>
		implements CustomerService {

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
		return PageQuerySupport.queryWithMap(
				repository,
				mapper,
				request.toPageAndFilter(),
				CustomerInfo.class,
				ObjectMapUtils.toMap(request.getFilter()),
				null);
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
