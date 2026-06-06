package com.airigs.modules.build.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
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
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "build_id", nullable = false)
    private Build build;

    // Soft reference — no FK so catalog updates never break old builds
    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "brand")
    private String brand;

    @Column(name = "price_inr", precision = 12, scale = 2)
    private BigDecimal priceInr;

    @Column(name = "vram_gb")
    private Integer vramGb;

    @Column(name = "is_primary")
    private Boolean isPrimary;

    @Column(name = "ai_reason", columnDefinition = "text")
    private String aiReason;

    @Column(name = "sku")
    private String sku;   // catalog_id from product specs

}

