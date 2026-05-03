package com.airigs.modules.benchmark.dto;

import com.airigs.modules.infrastructure.entity.SyncLog;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class SyncStatusDTO {
    private SyncLog localscore;
    private SyncLog arena;
}
