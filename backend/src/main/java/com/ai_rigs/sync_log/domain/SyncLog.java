package com.ai_rigs.sync_log.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sync_log")
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source", nullable = false)
    private String source;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "rows_upserted")
    private Integer rowsUpserted;

    @Column(name = "ran_at", nullable = false)
    private LocalDateTime ranAt;
}
