package com.example.url_shortener.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Service
public class CacheService {

    private static final Logger logger = LoggerFactory.getLogger(CacheService.class);

    private final RestTemplate restTemplate;

    @Value("${redis.host:}")
    private String redisHost;

    @Value("${redis.password:}")
    private String redisToken;

    public CacheService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(1000); // 1-second connect timeout
        factory.setReadTimeout(1000);    // 1-second read timeout
        this.restTemplate = new RestTemplate(factory);
    }

    private boolean isRedisConfigured() {
        if (redisHost == null || redisHost.isBlank()) {
            return false;
        }
        String host = redisHost.trim().toLowerCase();
        if (host.equals("localhost") || host.equals("127.0.0.1") || host.equals("redis")) {
            return false;
        }
        // Must be a valid remote domain like Upstash (*.upstash.io)
        return host.contains(".") && redisToken != null && !redisToken.isBlank() && !redisToken.equals("redispassword");
    }

    public void put(String key, String value, Duration ttl) {
        if (!isRedisConfigured()) {
            return;
        }
        try {
            String url = "https://" + redisHost.trim() + "/set/" + key + "?EX=" + ttl.getSeconds();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + redisToken.trim());
            HttpEntity<String> entity = new HttpEntity<>(value, headers);
            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
            logger.debug("Cache put failed for key {}: {}", key, e.getMessage());
        }
    }

    public String get(String key) {
        if (!isRedisConfigured()) {
            return null;
        }
        try {
            String url = "https://" + redisHost.trim() + "/get/" + key;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + redisToken.trim());
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            String body = response.getBody();
            if (body != null && body.contains("\"result\":\"")) {
                int start = body.indexOf("\"result\":\"") + 10;
                int end = body.indexOf("\"", start);
                if (end > start) {
                    return body.substring(start, end);
                }
            }
            return null;
        } catch (Exception e) {
            logger.debug("Cache get failed for key {}: {}", key, e.getMessage());
            return null;
        }
    }
}
