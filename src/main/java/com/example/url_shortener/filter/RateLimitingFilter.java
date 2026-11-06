package com.example.url_shortener.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter implements Filter {

    private final ConcurrentHashMap<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        // Allow up to 60 requests per minute with refill
        Bandwidth limit = Bandwidth.classic(60, Refill.greedy(60, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Only rate limit POST /api/v1/shorten; let GET redirects, health checks, and OPTIONS pass through freely
        if (req.getRequestURI().startsWith("/api/v1/shorten") && req.getMethod().equalsIgnoreCase("POST")) {
            String ip = req.getRemoteAddr();
            String forwardedFor = req.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                ip = forwardedFor.split(",")[0].trim();
            }

            Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());

            if (bucket.tryConsume(1)) {
                chain.doFilter(request, response);
            } else {
                res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                res.setContentType("application/json");
                res.setCharacterEncoding("UTF-8");
                res.getWriter().write("{\"error\":\"Rate limit exceeded. Please wait a moment before shortening another link.\"}");
            }
        } else {
            chain.doFilter(request, response);
        }
    }
}
