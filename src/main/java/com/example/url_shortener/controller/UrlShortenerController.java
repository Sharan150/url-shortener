package com.example.url_shortener.controller;

import com.example.url_shortener.dto.UrlRequest;
import com.example.url_shortener.dto.UrlResponse;
import com.example.url_shortener.entity.UrlMapping;
import com.example.url_shortener.repository.UrlMappingRepository;
import com.example.url_shortener.service.CacheService;
import com.example.url_shortener.service.KeyGenerationService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
    RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS
})
public class UrlShortenerController {

    private static final Logger logger = LoggerFactory.getLogger(UrlShortenerController.class);

    private final KeyGenerationService keyGenerationService;
    private final UrlMappingRepository urlMappingRepository;
    private final CacheService cacheService;
    private final Timer redirectTimer;

    public UrlShortenerController(KeyGenerationService keyGenerationService,
                                  UrlMappingRepository urlMappingRepository,
                                  CacheService cacheService,
                                  MeterRegistry meterRegistry) {
        this.keyGenerationService = keyGenerationService;
        this.urlMappingRepository = urlMappingRepository;
        this.cacheService = cacheService;
        this.redirectTimer = meterRegistry.timer("url.shortener.redirect");
    }

    @PostMapping("/api/v1/shorten")
    public ResponseEntity<UrlResponse> shortenUrl(@Valid @RequestBody UrlRequest request) {
        String shortCode = keyGenerationService.getNextKey();
        UrlMapping mapping = new UrlMapping(shortCode, request.getLongUrl());
        
        cacheService.put(shortCode, request.getLongUrl(), Duration.ofHours(24));
        
        CompletableFuture.runAsync(() -> {
            try {
                urlMappingRepository.save(mapping);
            } catch (Exception e) {
                logger.error("Failed to persist URL mapping asynchronously for shortCode: {}", shortCode, e);
            }
        });
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UrlResponse(shortCode, request.getLongUrl()));
    }

    @GetMapping("/{shortCode:[a-zA-Z0-9]+}")
    public ResponseEntity<Void> redirect(@PathVariable String shortCode) {
        return redirectTimer.record(() -> {
            String longUrl = cacheService.get(shortCode);
            
            if ("".equals(longUrl)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "URL not found");
            }
            
            if (longUrl == null) {
                UrlMapping mapping = urlMappingRepository.findByShortCode(shortCode).orElse(null);
                        
                if (mapping == null) {
                    cacheService.put(shortCode, "", Duration.ofMinutes(5));
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "URL not found");
                }
                
                longUrl = mapping.getLongUrl();
                cacheService.put(shortCode, longUrl, Duration.ofHours(24));
            }
            
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(longUrl))
                    .build();
        });
    }
}
