package com.laconic.lacoinvoice.config;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.http.HttpClient;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

public final class InsecureSslHttpClientSupport {

	private InsecureSslHttpClientSupport() {
	}

	public static JdkClientHttpRequestFactory jdkRequestFactory() {
		return new JdkClientHttpRequestFactory();
	}

	public static JdkClientHttpRequestFactory insecureJdkRequestFactory() throws GeneralSecurityException {
		return new JdkClientHttpRequestFactory(
				HttpClient.newBuilder().sslContext(trustAllSslContext()).build());
	}

	public static SimpleClientHttpRequestFactory insecureRequestFactory() throws GeneralSecurityException {
		SSLContext sslContext = trustAllSslContext();

		return new SimpleClientHttpRequestFactory() {
			@Override
			protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
				if (connection instanceof HttpsURLConnection https) {
					https.setSSLSocketFactory(sslContext.getSocketFactory());
					https.setHostnameVerifier((hostname, session) -> true);
				}
				super.prepareConnection(connection, httpMethod);
			}
		};
	}

	private static SSLContext trustAllSslContext() throws GeneralSecurityException {
		TrustManager[] trustAll = new TrustManager[] {
			new X509TrustManager() {
				@Override
				public void checkClientTrusted(X509Certificate[] chain, String authType) {
					// dev-only
				}

				@Override
				public void checkServerTrusted(X509Certificate[] chain, String authType) {
					// dev-only
				}

				@Override
				public X509Certificate[] getAcceptedIssuers() {
					return new X509Certificate[0];
				}
			}
		};
		SSLContext sslContext = SSLContext.getInstance("TLS");
		sslContext.init(null, trustAll, new SecureRandom());
		return sslContext;
	}
}
