package com.laconic.lacoinvoice.common.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

	private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

	@Around("@annotation(loggable)")
	public Object logExecution(ProceedingJoinPoint joinPoint, Loggable loggable) throws Throwable {
		String signature = joinPoint.getSignature().toShortString();
		long start = System.currentTimeMillis();
		try {
			log.info("Enter {} args={}", signature, sanitizeArgs(joinPoint.getArgs()));
			Object result = joinPoint.proceed();
			log.info("Exit {} took={}ms", signature, System.currentTimeMillis() - start);
			return result;
		} catch (Exception ex) {
			log.error("Error in {} took={}ms message={}",
					signature, System.currentTimeMillis() - start, ex.getMessage());
			throw ex;
		}
	}

	private static Object[] sanitizeArgs(Object[] args) {
		if (args == null || args.length == 0) {
			return args;
		}
		Object[] sanitized = new Object[args.length];
		for (int i = 0; i < args.length; i++) {
			Object arg = args[i];
			if (arg == null) {
				sanitized[i] = null;
				continue;
			}
			String name = arg.getClass().getSimpleName().toLowerCase();
			if (name.contains("password") || name.contains("credential") || name.contains("token")) {
				sanitized[i] = "[REDACTED]";
			} else {
				sanitized[i] = arg;
			}
		}
		return sanitized;
	}
}
