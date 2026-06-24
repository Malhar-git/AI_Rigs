package com.airigs.modules.build.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "builds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Build {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "user_id")
    private UUID userId;

    // Full wizard answers stored as JSONB for auditability
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answers", columnDefinition = "jsonb")
    private JsonNode answers;

    // Raw Claude API response kept for debugging prompt issues
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_raw_response", columnDefinition = "jsonb")
    private JsonNode aiRawResponse;

    @Column(name = "build_name")
    private String buildName;

    @Column(name = "total_price_inr", precision = 12, scale = 2)
    private BigDecimal totalPriceInr;

    @Column(name = "summary_reasoning", columnDefinition = "text")
    private String summaryReasoning;

    @Column(name = "zoom_level")
    private String zoomLevel;

    @Column(name = "dim_others")
    private Boolean dimOthers;

    @Column(name = "vram_floor_gb")
    private Integer vramFloorGb;

    @Column(name = "task")
    private String task;

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "budget_tier")
    private String budgetTier;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "build",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    @Builder.Default
    private List<BuildItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

}

