package com.laconic.lacoinvoice.features.order.history;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.laconic.lacoinvoice.common.exception.ResourceNotFoundException;
import com.laconic.lacoinvoice.common.web.ApiResponse;
import com.laconic.lacoinvoice.common.web.PageMeta;
import com.laconic.lacoinvoice.domain.models.OrderHistory;
import com.laconic.lacoinvoice.domain.models.OrderHistoryChange;
import com.laconic.lacoinvoice.domain.models.User;
import com.laconic.lacoinvoice.domain.repositories.OrderHistoryChangeRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderHistoryRepository;
import com.laconic.lacoinvoice.domain.repositories.OrderRepository;
import com.laconic.lacoinvoice.domain.repositories.UserRepository;

@Service
public class OrderHistoryService {

	private final OrderRepository orderRepository;
	private final OrderHistoryRepository orderHistoryRepository;
	private final OrderHistoryChangeRepository orderHistoryChangeRepository;
	private final UserRepository userRepository;

	public OrderHistoryService(
			OrderRepository orderRepository,
			OrderHistoryRepository orderHistoryRepository,
			OrderHistoryChangeRepository orderHistoryChangeRepository,
			UserRepository userRepository) {
		this.orderRepository = orderRepository;
		this.orderHistoryRepository = orderHistoryRepository;
		this.orderHistoryChangeRepository = orderHistoryChangeRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	@PreAuthorize("@authz.isOwnerOrAdmin()")
	public ApiResponse<List<OrderHistoryEventDto>> page(Long orderId, int pageNumber, int pageSize) {
		if (!orderRepository.existsById(orderId)) {
			throw new ResourceNotFoundException("Order not found: id=" + orderId);
		}

		int page = Math.max(pageNumber, 1);
		int size = Math.min(Math.max(pageSize, 1), 100);
		PageRequest pageable = PageRequest.of(page - 1, size);

		Page<OrderHistory> historyPage =
				orderHistoryRepository.findByOrder_IdOrderByPerformedAtDescIdDesc(orderId, pageable);

		List<OrderHistory> events = historyPage.getContent();
		Map<Long, List<OrderHistoryChange>> changesByHistoryId = loadChanges(events);
		Map<Long, String> userNames = loadUserNames(events);

		List<OrderHistoryEventDto> data = events.stream()
				.map(event -> toDto(event, changesByHistoryId.getOrDefault(event.getId(), List.of()), userNames))
				.toList();

		PageMeta meta = new PageMeta(
				page,
				size,
				historyPage.getTotalElements(),
				historyPage.getTotalPages());
		return ApiResponse.ok("OK", data, meta);
	}

	private Map<Long, List<OrderHistoryChange>> loadChanges(List<OrderHistory> events) {
		if (events.isEmpty()) {
			return Map.of();
		}
		Set<Long> ids = events.stream().map(OrderHistory::getId).collect(Collectors.toSet());
		List<OrderHistoryChange> changes = orderHistoryChangeRepository.findByHistory_IdInOrderByIdAsc(ids);
		Map<Long, List<OrderHistoryChange>> byHistoryId = new HashMap<>();
		for (OrderHistoryChange change : changes) {
			byHistoryId.computeIfAbsent(change.getHistory().getId(), ignored -> new ArrayList<>()).add(change);
		}
		return byHistoryId;
	}

	private Map<Long, String> loadUserNames(List<OrderHistory> events) {
		Set<Long> userIds = events.stream()
				.map(OrderHistory::getPerformedByUserId)
				.filter(Objects::nonNull)
				.collect(Collectors.toSet());
		if (userIds.isEmpty()) {
			return Map.of();
		}
		Map<Long, String> names = new HashMap<>();
		for (User user : userRepository.findAllById(userIds)) {
			String display = StringUtils.hasText(user.getFullName()) ? user.getFullName() : user.getEmail();
			names.put(user.getId(), display);
		}
		return names;
	}

	private OrderHistoryEventDto toDto(
			OrderHistory event,
			List<OrderHistoryChange> changes,
			Map<Long, String> userNames) {
		Long importFileId = event.getImportFile() != null ? event.getImportFile().getId() : null;
		String excelFileName = event.getImportFile() != null ? event.getImportFile().getOriginalFilename() : null;
		String updatedBy = event.getPerformedByUserId() == null
				? null
				: userNames.getOrDefault(event.getPerformedByUserId(), null);

		return new OrderHistoryEventDto(
				event.getId(),
				event.getAction().name(),
				event.getSource().name(),
				event.getPerformedByUserId(),
				updatedBy,
				event.getPerformedAt(),
				importFileId,
				excelFileName,
				event.getNote(),
				changes.stream()
						.map(change -> new OrderHistoryChangeDto(
								change.getFieldName(),
								change.getFieldLabelKey(),
								change.getOldValue(),
								change.getNewValue(),
								change.getValueType().name()))
						.toList());
	}
}
