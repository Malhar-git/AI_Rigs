package com.ai_rigs.gpu_benchmarks;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.sync.localscore.backfill.run-on-startup", havingValue = "true")
public class LocalScoreBackfillStartupRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalScoreBackfillStartupRunner.class);

    private final LocalScoreSyncJob localScoreSyncJob;

    public LocalScoreBackfillStartupRunner(LocalScoreSyncJob localScoreSyncJob) {
        this.localScoreSyncJob = localScoreSyncJob;
    }

    @Override
    public void run(String... args) {
        Thread thread = new Thread(() -> {
            log.info("Starting LocalScore historical backfill on startup");
            localScoreSyncJob.backfillAll();
            log.info("LocalScore historical backfill completed");
        }, "localscore-backfill-startup");
        thread.setDaemon(true);
        thread.start();
    }
}
