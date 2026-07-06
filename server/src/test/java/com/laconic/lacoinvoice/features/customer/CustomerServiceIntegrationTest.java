package com.laconic.lacoinvoice.features.customer;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.models.UserRole;
import com.laconic.lacoinvoice.domain.repositories.CustomerInfoRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.CreateRequest;
import com.laconic.lacoinvoice.features.customer.CustomerCommands.UpdateRequest;
import com.laconic.lacoinvoice.features.customer.pageable.CustomerPageRequest;

@SpringBootTest
@ActiveProfiles("test")
class CustomerServiceIntegrationTest {

	@Autowired
	private CustomerService customerService;

	@Autowired
	private CustomerInfoRepository customerInfoRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private StoreRepository storeRepository;

	private User owner;

	@BeforeEach
	void setUp() {
		String suffix = UUID.randomUUID().toString().substring(0, 8);
		owner = new User();
		owner.setEmail("owner-customer-test-" + suffix + "@example.com");
		owner.setAuthServerUserId("owner-customer-test-auth-id-" + suffix);
		owner.setFullName("Owner Test");
		owner.setRole(UserRole.OWNER);
		owner.setActive(true);
		owner = userRepository.save(owner);

		AuditUserContext.setCurrentUserId(owner.getAuthServerUserId());
		AuditUserContext.setCurrentLocalUserId(owner.getId());
		AuditUserContext.setCurrentUserRole(UserRole.OWNER);
	}

	@AfterEach
	void tearDown() {
		AuditUserContext.clear();
	}

	@Test
	void createPageGetUpdateDeleteCustomer() {
		CreateRequest createRequest = new CreateRequest();
		createRequest.setName("Jane Doe");
		createRequest.setEmail("jane@example.com");
		createRequest.setPhone("+959123456789");
		createRequest.setGender("female");
		createRequest.setAddress("Yangon, Myanmar");

		CustomerDto created = customerService.create(createRequest);
		assertThat(created.id()).isNotNull();
		assertThat(created.name()).isEqualTo("Jane Doe");

		CustomerPageRequest pageRequest = new CustomerPageRequest();
		pageRequest.setPageNumber(1);
		pageRequest.setPageSize(10);
		ApiResponse<java.util.List<CustomerDto>> page = customerService.page(pageRequest);
		assertThat(page.getData()).anyMatch(customer -> customer.id().equals(created.id()));

		CustomerDto fetched = customerService.getById(created.id());
		assertThat(fetched.email()).isEqualTo("jane@example.com");

		UpdateRequest updateRequest = new UpdateRequest();
		updateRequest.setName("Jane Smith");
		updateRequest.setEmail("jane.smith@example.com");
		updateRequest.setPhone("+959123456789");
		updateRequest.setGender("female");
		updateRequest.setAddress("Mandalay, Myanmar");

		CustomerDto updated = customerService.update(created.id(), updateRequest);
		assertThat(updated.name()).isEqualTo("Jane Smith");

		customerService.delete(created.id());
	}

	@Test
	void pageReturnsCustomersAcrossStores() {
		String suffix = UUID.randomUUID().toString().substring(0, 8);

		User admin = new User();
		admin.setEmail("admin-customer-test-" + suffix + "@example.com");
		admin.setAuthServerUserId("admin-customer-test-auth-id-" + suffix);
		admin.setFullName("Admin Test");
		admin.setRole(UserRole.ADMIN);
		admin.setActive(true);
		admin = userRepository.save(admin);

		User ownerTwo = new User();
		ownerTwo.setEmail("owner-two-customer-test-" + suffix + "@example.com");
		ownerTwo.setAuthServerUserId("owner-two-customer-test-auth-id-" + suffix);
		ownerTwo.setFullName("Owner Two");
		ownerTwo.setRole(UserRole.OWNER);
		ownerTwo.setActive(true);
		ownerTwo = userRepository.save(ownerTwo);

		Store storeOne = new Store();
		storeOne.setOwner(owner);
		storeOne.setName("Store One " + suffix);
		storeOne.setActive(true);
		storeOne = storeRepository.save(storeOne);

		Store storeTwo = new Store();
		storeTwo.setOwner(ownerTwo);
		storeTwo.setName("Second Store " + suffix);
		storeTwo.setActive(true);
		storeTwo = storeRepository.save(storeTwo);

		CustomerInfo customerInStoreOne = new CustomerInfo();
		customerInStoreOne.setStore(storeOne);
		customerInStoreOne.setName("Store One Customer");
		customerInStoreOne.setEmail("store-one-" + suffix + "@example.com");
		customerInStoreOne = customerInfoRepository.save(customerInStoreOne);

		CustomerInfo customerInStoreTwo = new CustomerInfo();
		customerInStoreTwo.setStore(storeTwo);
		customerInStoreTwo.setName("Store Two Customer");
		customerInStoreTwo.setEmail("store-two-" + suffix + "@example.com");
		customerInStoreTwo = customerInfoRepository.save(customerInStoreTwo);

		AuditUserContext.clear();
		AuditUserContext.setCurrentUserId(admin.getAuthServerUserId());
		AuditUserContext.setCurrentLocalUserId(admin.getId());
		AuditUserContext.setCurrentUserRole(UserRole.ADMIN);

		CustomerPageRequest pageRequest = new CustomerPageRequest();
		pageRequest.setPageNumber(1);
		pageRequest.setPageSize(50);
		ApiResponse<java.util.List<CustomerDto>> page = customerService.page(pageRequest);

		assertThat(page.getData())
				.extracting(CustomerDto::id)
				.contains(customerInStoreOne.getId(), customerInStoreTwo.getId());
		assertThat(page.getData())
				.extracting(CustomerDto::storeId)
				.contains(storeOne.getId(), storeTwo.getId());
	}
}
