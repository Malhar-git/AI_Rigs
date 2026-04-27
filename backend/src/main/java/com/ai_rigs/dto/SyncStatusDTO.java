package com.ai_rigs.dto;

import com.ai_rigs.sync_log.domain.SyncLog;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class SyncStatusDTO {
    private SyncLog localscore;
    private SyncLog arena;
}
