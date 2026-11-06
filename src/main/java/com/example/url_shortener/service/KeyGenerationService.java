package com.example.url_shortener.service;

import com.example.url_shortener.entity.UnusedKey;
import com.example.url_shortener.repository.UnusedKeyRepository;
import com.example.url_shortener.util.Base62Encoder;
import com.example.url_shortener.util.SnowflakeIdGenerator;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
public class KeyGenerationService {

    private static final Logger logger = LoggerFactory.getLogger(KeyGenerationService.class);

    private final UnusedKeyRepository unusedKeyRepository;
    private final ConcurrentLinkedQueue<String> keyQueue;
    private final SnowflakeIdGenerator idGenerator;

    private static final int LOW_WATER_MARK = 100;
    private static final int BATCH_SIZE = 200;

    public KeyGenerationService(UnusedKeyRepository unusedKeyRepository) {
        this.unusedKeyRepository = unusedKeyRepository;
        this.keyQueue = new ConcurrentLinkedQueue<>();
        this.idGenerator = new SnowflakeIdGenerator(1, 1);
    }

    @PostConstruct
    public void init() {
        // Pre-fill queue in-memory immediately so the application is ready instantly
        for (int i = 0; i < LOW_WATER_MARK; i++) {
            keyQueue.offer(Base62Encoder.encode(idGenerator.nextId()));
        }
        try {
            hydrateQueue();
        } catch (Exception e) {
            logger.warn("Initial DB key hydration skipped: {}", e.getMessage());
        }
    }

    public String getNextKey() {
        String key = keyQueue.poll();
        if (key != null && !key.isBlank()) {
            return key;
        }
        // Direct, fast, collision-free Snowflake ID generation
        return Base62Encoder.encode(idGenerator.nextId());
    }

    @Scheduled(fixedDelay = 30000) // Check every 30 seconds instead of every 5 seconds
    public void checkAndHydrateQueue() {
        if (keyQueue.size() < LOW_WATER_MARK) {
            try {
                hydrateQueue();
            } catch (Exception e) {
                logger.warn("Scheduled key hydration failed: {}", e.getMessage());
                // Replenish in-memory queue using Snowflake generator
                while (keyQueue.size() < LOW_WATER_MARK) {
                    keyQueue.offer(Base62Encoder.encode(idGenerator.nextId()));
                }
            }
        }
    }

    @Transactional
    public void hydrateQueue() {
        List<UnusedKey> dbKeys = unusedKeyRepository.findBatch(BATCH_SIZE);

        if (dbKeys.isEmpty()) {
            List<UnusedKey> newKeys = new ArrayList<>(BATCH_SIZE);
            for (int i = 0; i < BATCH_SIZE; i++) {
                newKeys.add(new UnusedKey(Base62Encoder.encode(idGenerator.nextId())));
            }
            unusedKeyRepository.saveAll(newKeys);
            dbKeys = unusedKeyRepository.findBatch(BATCH_SIZE);
        }

        List<Long> idsToDelete = new ArrayList<>();
        for (UnusedKey uk : dbKeys) {
            keyQueue.offer(uk.getShortKey());
            idsToDelete.add(uk.getId());
        }

        if (!idsToDelete.isEmpty()) {
            unusedKeyRepository.deleteBatch(idsToDelete);
        }

        logger.info("Hydrated queue. Current size: {}", keyQueue.size());
    }
}
