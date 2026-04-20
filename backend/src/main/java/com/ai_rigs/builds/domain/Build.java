package com.ai_rigs.builds.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
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
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> answers;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_response", columnDefinition = "jsonb")
    private Map<String, Object> aiResponse;

    @Column(name = "total_price_inr", precision = 10, scale = 2)
    private BigDecimal totalPriceInr;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}

