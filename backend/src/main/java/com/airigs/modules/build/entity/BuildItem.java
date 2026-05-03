package com.airigs.modules.build.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "build_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "build_id", nullable = false)
    private UUID buildId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private String category;

    @Column(name = "ai_reason")
    private String aiReason;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;
}

