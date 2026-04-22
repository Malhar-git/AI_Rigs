package com.ai_rigs.services;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.sync.arena.run-on-startup", havingValue = "true")
public class AIArenaSyncStartupRunner implements CommandLineRunner {

    private final AIArenaSyncJob aiArenaSyncJob;

    public AIArenaSyncStartupRunner(AIArenaSyncJob aiArenaSyncJob) {
        this.aiArenaSyncJob = aiArenaSyncJob;
    }

    @Override
    public void run(String... args) {
        aiArenaSyncJob.sync();
    }
}

