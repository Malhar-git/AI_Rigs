package com.airigs.modules.benchmark.sync;

import com.airigs.modules.benchmark.repository.ModelBenchmarkRepository;
import com.airigs.modules.infrastructure.persistence.SyncLogRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AIArenaSyncJobTest {

    @Test
    void shouldSupportTheExpectedArenaCategoriesAndUrls() {
        AIArenaSyncJob job = new AIArenaSyncJob(
                Mockito.mock(ModelBenchmarkRepository.class),
                Mockito.mock(SyncLogRepository.class)
        );

        List<String> categories = job.getCategoriesToSync();

        assertThat(categories)
                .containsExactly("coding", "math", "chat", "reasoning", "agentic");
        assertThat(job.buildLeaderboardUrl("Reasoning")).isEqualTo("https://arena.ai/leaderboard/text/reasoning");
        assertThat(job.buildLeaderboardUrl("CHAT")).isEqualTo("https://arena.ai/leaderboard/text/chat");
    }
}
