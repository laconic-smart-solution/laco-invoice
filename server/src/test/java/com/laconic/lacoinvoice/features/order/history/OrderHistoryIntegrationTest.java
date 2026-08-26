package com.laconic.lacoinvoice.features.order.history;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.persistence.AuditUserContext;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.domain.models.CustomerInfo;
import com.laconic.lacoinvoice.domain.models.Marketplace;
import com.laconic.lacoinvoice.domain.models.Order;
import com.laconic.lacoinvoice.domain.models.OrderHistory;
import com.laconic.lacoinvoice.domain.models.OrderHistoryAction;
import com.laconic.lacoinvoice.domain.models.OrderHistorySource;
import com.laconic.lacoinvoice.domain.models.OrderImportFile;
import com.laconic.lacoinvoice.domain.models.OrderImportStatus;
import com.laconic.lacoinvoice.domain.models.OrderStatus;
import com.laconic.lacoinvoice.domain.models.Store;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.models.UserRole;
import com.laconic.lacoinvoice.domain.repositories.CustomerInfoRepository;
import com.laconic.lacoinvoice.domain.repositories.MarketplaceRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderHistoryRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderImportFileRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.StoreRepository;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;

@SpringBootTest
@ActiveProfiles("test")
class OrderHistoryIntegrationTest {

	@Autowired
	private OrderHistoryRecorder recorder;

	@Autowired
	private OrderHistoryService historyService;

	@Autowired
	private OrderHistoryRepository orderHistoryRepository;

	@Autowired
	private OrderRepository orderRepository;

	@Autowired
	private OrderImportFileRepository importFileRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private StoreRepository storeRepository;

	@Autowired
	private MarketplaceRepository marketplaceRepository;

	@Autowired
	private CustomerInfoRepository customerInfoRepository;

	private User admin;
	private Store store;
	private Marketplace marketplace;

	@BeforeEach
	void setUp() {
		String suffix = UUID.randomUUID().toString().substring(0, 8);

		admin = new User();
		admin.setEmail("admin-history-" + suffix + "@example.com");
		admin.setAuthServerUserId("admin-history-auth-" + suffix);
		admin.setFullName("Admin Laconic");
		admin.setRole(UserRole.ADMIN);
		admin.setActive(true);
		admin = userRepository.save(admin);

		AuditUserContext.setCurrentUserId(admin.getAuthServerUserId());
		AuditUserContext.setCurrentLocalUserId(admin.getId());
		AuditUserContext.setCurrentUserRole(UserRole.ADMIN);

		store = new Store();
		store.setOwner(admin);
		store.setName("History Store " + suffix);
		store.setActive(true);
		store = storeRepository.save(store);

		marketplace = new Marketplace();
		marketplace.setCode("HIST_MP_" + suffix);
		marketplace.setName("History Marketplace");
		marketplace = marketplaceRepository.save(marketplace);
	}

	@AfterEach
	void tearDown() {
		AuditUserContext.clear();
	}

	@Test
	void manualCreateAndUpdateGroupFieldChangesUnderOneEvent() {
		Order order = createOrder("EXT-MANUAL-1", OrderStatus.PENDING, "100.00");

		OrderHistory createEvent = recorder.recordManualCreate(order, OrderHistorySnapshot.capture(order));
		assertThat(createEvent).isNotNull();
		assertThat(createEvent.getAction()).isEqualTo(OrderHistoryAction.CREATE);
		assertThat(createEvent.getSource()).isEqualTo(OrderHistorySource.MANUAL);
		assertThat(createEvent.getImportFile()).isNull();
		assertThat(createEvent.getPerformedByUserId()).isEqualTo(admin.getId());
		assertThat(createEvent.getChanges()).isNotEmpty();
		assertThat(createEvent.getChanges())
				.anyMatch(c -> "order_status".equals(c.getFieldName()) && "PENDING".equals(c.getNewValue()));

		OrderHistorySnapshot before = OrderHistorySnapshot.capture(order);
		order.setOrderStatus(OrderStatus.DELIVERED);
		order.setTotalAmount(new BigDecimal("180.50"));
		order = orderRepository.save(order);

		OrderHistory updateEvent =
				recorder.recordManualUpdate(order, before, OrderHistorySnapshot.capture(order));
		assertThat(updateEvent).isNotNull();
		assertThat(updateEvent.getAction()).isEqualTo(OrderHistoryAction.UPDATE);
		assertThat(updateEvent.getChanges()).hasSize(2);
		assertThat(updateEvent.getChanges())
				.anyMatch(c -> "order_status".equals(c.getFieldName())
						&& "PENDING".equals(c.getOldValue())
						&& "DELIVERED".equals(c.getNewValue()));
		assertThat(updateEvent.getChanges())
				.anyMatch(c -> "total_amount".equals(c.getFieldName())
						&& "100".equals(c.getOldValue())
						&& "180.5".equals(c.getNewValue()));
	}

	@Test
	void noOpManualUpdateCreatesNoHistory() {
		Order order = createOrder("EXT-NOOP-1", OrderStatus.PENDING, "50.00");
		OrderHistorySnapshot snapshot = OrderHistorySnapshot.capture(order);

		long beforeCount = orderHistoryRepository.countByOrder_Id(order.getId());
		OrderHistory event = recorder.recordManualUpdate(order, snapshot, snapshot);
		assertThat(event).isNull();
		assertThat(orderHistoryRepository.countByOrder_Id(order.getId())).isEqualTo(beforeCount);
	}

	@Test
	void excelCreateAndUpdateUseImportFileId() {
		OrderImportFile importFile = createImportFile("orders_august_26.xlsx");
		Order order = createOrder("EXT-IMPORT-1", OrderStatus.PENDING, "167.30");

		OrderHistory createEvent =
				recorder.recordImportCreate(order, importFile, OrderHistorySnapshot.capture(order));
		assertThat(createEvent.getSource()).isEqualTo(OrderHistorySource.IMPORT_EXCEL);
		assertThat(createEvent.getImportFile().getId()).isEqualTo(importFile.getId());

		OrderHistorySnapshot before = OrderHistorySnapshot.capture(order);
		order.setOrderStatus(OrderStatus.CONFIRMED);
		order = orderRepository.save(order);

		OrderHistory updateEvent =
				recorder.recordImportUpdate(order, importFile, before, OrderHistorySnapshot.capture(order));
		assertThat(updateEvent.getImportFile().getId()).isEqualTo(importFile.getId());

		Order orderTwo = createOrder("EXT-IMPORT-2", OrderStatus.PENDING, "10.00");
		recorder.recordImportCreate(orderTwo, importFile, OrderHistorySnapshot.capture(orderTwo));

		ApiResponse<List<OrderHistoryEventDto>> page = historyService.page(order.getId(), 1, 10);
		assertThat(page.getData()).isNotEmpty();
		OrderHistoryEventDto first = page.getData().get(0);
		assertThat(first.source()).isEqualTo("IMPORT_EXCEL");
		assertThat(first.importFileId()).isEqualTo(importFile.getId());
		assertThat(first.excelFileName()).isEqualTo("orders_august_26.xlsx");
		assertThat(first.updatedBy()).isEqualTo("Admin Laconic");
		assertThat(first.changes()).isNotEmpty();
	}

	@Test
	void historyApiReturnsNewestFirstAndPaginated() {
		Order order = createOrder("EXT-PAGE-1", OrderStatus.PENDING, "1.00");
		recorder.recordManualCreate(order, OrderHistorySnapshot.capture(order));

		OrderHistorySnapshot before = OrderHistorySnapshot.capture(order);
		order.setTotalAmount(new BigDecimal("2.00"));
		order = orderRepository.save(order);
		recorder.recordManualUpdate(order, before, OrderHistorySnapshot.capture(order));

		before = OrderHistorySnapshot.capture(order);
		order.setTotalAmount(new BigDecimal("3.00"));
		order = orderRepository.save(order);
		recorder.recordManualUpdate(order, before, OrderHistorySnapshot.capture(order));

		ApiResponse<List<OrderHistoryEventDto>> page1 = historyService.page(order.getId(), 1, 2);
		PageMeta meta = (PageMeta) page1.getMeta();
		assertThat(meta.getTotalElements()).isEqualTo(3);
		assertThat(page1.getData()).hasSize(2);
		assertThat(page1.getData().get(0).action()).isEqualTo("UPDATE");
		assertThat(page1.getData().get(0).excelFileName()).isNull();
		assertThat(page1.getData().get(0).importFileId()).isNull();

		ApiResponse<List<OrderHistoryEventDto>> page2 = historyService.page(order.getId(), 2, 2);
		assertThat(page2.getData()).hasSize(1);
		assertThat(page2.getData().get(0).action()).isEqualTo("CREATE");
	}

	@Test
	void historyApiThrowsWhenOrderMissing() {
		assertThatThrownBy(() -> historyService.page(9_999_999L, 1, 10))
				.isInstanceOf(ResourceNotFoundException.class);
	}

	private Order createOrder(String externalOrderId, OrderStatus status, String total) {
		CustomerInfo customer = new CustomerInfo();
		customer.setStore(store);
		customer.setMarketplace(marketplace);
		customer.setName("Customer " + externalOrderId);
		customer = customerInfoRepository.save(customer);

		Order order = new Order();
		order.setStore(store);
		order.setMarketplace(marketplace);
		order.setCustomer(customer);
		order.setExternalOrderId(externalOrderId);
		order.setOrderStatus(status);
		order.setTotalAmount(new BigDecimal(total));
		order.setCurrency("THB");
		return orderRepository.save(order);
	}

	private OrderImportFile createImportFile(String filename) {
		OrderImportFile importFile = new OrderImportFile();
		importFile.setStore(store);
		importFile.setMarketplace(marketplace);
		importFile.setOriginalFilename(filename);
		importFile.setStatus(OrderImportStatus.COMPLETED);
		return importFileRepository.save(importFile);
	}
}
