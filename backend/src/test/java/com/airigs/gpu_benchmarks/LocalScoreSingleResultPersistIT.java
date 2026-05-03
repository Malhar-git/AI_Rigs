package com.airigs.gpu_benchmarks;

import com.airigs.modules.benchmark.entity.GpuBenchmarkResult;
import com.airigs.modules.benchmark.repository.GpuBenchmarkResultRepository;
import com.airigs.modules.benchmark.sync.LocalScoreSyncJob;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.lang.reflect.Method;

@SpringBootTest
class LocalScoreSingleResultPersistIT {

    @Autowired
    private LocalScoreSyncJob localScoreSyncJob;

    @Autowired
    private GpuBenchmarkResultRepository resultRepository;

    @Test
    void persistSingleKnownResultUsingCurrentParser() throws Exception {
        int testId = Integer.parseInt(System.getProperty("localscore.testId", "1"));

        Method scrapeMethod = LocalScoreSyncJob.class.getDeclaredMethod("scrapeResultPage", int.class);
        scrapeMethod.setAccessible(true);

        GpuBenchmarkResult parsed = (GpuBenchmarkResult) scrapeMethod.invoke(localScoreSyncJob, testId);
        if (parsed == null) {
            throw new IllegalStateException("Parser returned null for testId=" + testId);
        }

        resultRepository.findByLocalscoreTestId(testId).ifPresent(resultRepository::delete);
        GpuBenchmarkResult saved = resultRepository.saveAndFlush(parsed);

        System.out.println("[SINGLE_PERSIST] savedId=" + saved.getId()
                + " testId=" + saved.getLocalscoreTestId()
                + " acceleratorType=" + saved.getAcceleratorType()
                + " modelName='" + saved.getModelName() + "'"
                + " modelQuant='" + saved.getModelQuantization() + "'"
                + " generationTps=" + saved.getGenerationTps()
                + " promptTps=" + saved.getPromptTps()
                + " ttftMs=" + saved.getTtftMs()
                + " localscore=" + saved.getLocalscore()
                + " detailsCount=" + (saved.getDetails() == null ? 0 : saved.getDetails().size()));
    }
}

