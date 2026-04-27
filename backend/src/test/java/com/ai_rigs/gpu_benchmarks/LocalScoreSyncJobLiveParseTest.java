package com.ai_rigs.gpu_benchmarks;

import com.ai_rigs.sync_log.SyncLogRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class LocalScoreSyncJobLiveParseTest {

    @Test
    void parsesKnownLiveResultWithRequiredColumnsPresent() throws Exception {
        int testId = Integer.parseInt(System.getProperty("localscore.testId", "1"));

        GpuBenchmarkResultRepository resultRepo = Mockito.mock(GpuBenchmarkResultRepository.class);
        SyncLogRepository syncLogRepo = Mockito.mock(SyncLogRepository.class);
        LocalScoreSyncJob job = new LocalScoreSyncJob(resultRepo, syncLogRepo, 0, 1);

        Method method = LocalScoreSyncJob.class.getDeclaredMethod("scrapeResultPage", int.class);
        method.setAccessible(true);

        GpuBenchmarkResult result = (GpuBenchmarkResult) method.invoke(job, testId);

        assertNotNull(result, "Parser returned null result");
        assertEquals(testId, result.getLocalscoreTestId());

        // Required (non-nullable) entity fields
        assertNotNull(result.getTestedAt(), "testedAt should not be null");
        assertNotNull(result.getAcceleratorName(), "acceleratorName should not be null");
        assertNotNull(result.getAcceleratorType(), "acceleratorType should not be null");
        assertNotNull(result.getModelName(), "modelName should not be null");
        assertNotNull(result.getSyncedAt(), "syncedAt should not be null");

        System.out.println("[LIVE_PARSE_CHECK] testId=" + testId
                + " acceleratorName='" + result.getAcceleratorName() + "'"
                + " acceleratorType='" + result.getAcceleratorType() + "'"
                + " modelName='" + result.getModelName() + "'"
                + " modelQuantization='" + result.getModelQuantization() + "'"
                + " generationTps=" + result.getGenerationTps()
                + " promptTps=" + result.getPromptTps()
                + " ttftMs=" + result.getTtftMs()
                + " localscore=" + result.getLocalscore()
                + " cpuName='" + result.getCpuName() + "'"
                + " systemRamGb=" + result.getSystemRamGb()
                + " osName='" + result.getOsName() + "'"
                + " runtimeName='" + result.getRuntimeName() + "'"
                + " runtimeVersion='" + result.getRuntimeVersion() + "'"
                + " detailsCount=" + (result.getDetails() == null ? 0 : result.getDetails().size()));
    }
}

