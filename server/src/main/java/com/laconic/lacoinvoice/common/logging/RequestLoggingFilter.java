package com.laconic.lacoinvoice.common.logging;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
public class RequestLoggingFilter extends OncePerRequestFilter {

	private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

	private final LoggingProperties properties;

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if (!properties.isEnabled()) {
			return true;
		}
		String path = request.getRequestURI();
		return properties.getExcludePaths().stream().anyMatch(path::startsWith);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {

		String requestId = resolveRequestId(request);
		String clientIp = resolveClientIp(request);

		MDC.put(MdcKeys.REQUEST_ID, requestId);
		MDC.put(MdcKeys.HTTP_METHOD, request.getMethod());
		MDC.put(MdcKeys.HTTP_PATH, request.getRequestURI());
		MDC.put(MdcKeys.CLIENT_IP, clientIp);

		response.setHeader(properties.getRequestIdHeader(), requestId);

		long startNs = System.nanoTime();
		Throwable error = null;
		try {
			log.info("-> {} {} from {}", request.getMethod(), buildFullPath(request), clientIp);
			chain.doFilter(request, response);
		} catch (Throwable t) {
			error = t;
			throw t;
		} finally {
			long durationMs = (System.nanoTime() - startNs) / 1_000_000L;
			int status = (error != null) ? HttpServletResponse.SC_INTERNAL_SERVER_ERROR : response.getStatus();

			MDC.put(MdcKeys.HTTP_STATUS, Integer.toString(status));
			MDC.put(MdcKeys.DURATION_MS, Long.toString(durationMs));

			if (error != null) {
				log.error("<- {} {} {} ({}ms) error={}",
						request.getMethod(), request.getRequestURI(), status, durationMs, error.toString());
			} else if (durationMs >= properties.getSlowRequestThresholdMs()) {
				log.warn("<- {} {} {} ({}ms) SLOW",
						request.getMethod(), request.getRequestURI(), status, durationMs);
			} else if (status >= 500) {
				log.error("<- {} {} {} ({}ms)",
						request.getMethod(), request.getRequestURI(), status, durationMs);
			} else if (status >= 400) {
				log.warn("<- {} {} {} ({}ms)",
						request.getMethod(), request.getRequestURI(), status, durationMs);
			} else {
				log.info("<- {} {} {} ({}ms)",
						request.getMethod(), request.getRequestURI(), status, durationMs);
			}

			MDC.clear();
		}
	}

	private String resolveRequestId(HttpServletRequest request) {
		String existing = request.getHeader(properties.getRequestIdHeader());
		if (StringUtils.hasText(existing)) {
			return existing;
		}
		return UUID.randomUUID().toString();
	}

	private String resolveClientIp(HttpServletRequest request) {
		String forwarded = request.getHeader("X-Forwarded-For");
		if (StringUtils.hasText(forwarded)) {
			int comma = forwarded.indexOf(',');
			return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
		}
		String realIp = request.getHeader("X-Real-IP");
		if (StringUtils.hasText(realIp)) {
			return realIp;
		}
		return request.getRemoteAddr();
	}

	private String buildFullPath(HttpServletRequest request) {
		String query = request.getQueryString();
		return StringUtils.hasText(query)
				? request.getRequestURI() + "?" + query
				: request.getRequestURI();
	}
}
