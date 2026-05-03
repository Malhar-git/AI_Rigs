package com.airigs.modules.aimodel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

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
    private Map<String, Object> precisionVariants;

    @Column(name = "skip_precision", nullable = false)
    private boolean skipPrecision;
}
