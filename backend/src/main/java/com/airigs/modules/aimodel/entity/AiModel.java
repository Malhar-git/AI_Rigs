package com.airigs.modules.aimodel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

/**
 * ai_model catalog entry seeded from ai-model-catalog.json.
 */
@Entity
@Table(name = "ai_model")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(name = "model_family", nullable = false)
    private String modelFamily;

    @Column(name = "vram_min_gb", nullable = false)
    private Integer vramMinGb;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "precision_variants", columnDefinition = "jsonb")
    private List<String> precisionVariants;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "task_types", columnDefinition = "jsonb")
    private List<String> taskTypes;

    @Column(name = "skip_precision", nullable = false)
    private boolean skipPrecision;
}
