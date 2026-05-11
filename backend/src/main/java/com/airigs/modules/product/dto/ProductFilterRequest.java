package com.airigs.modules.product.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductFilterRequest {
    private String category;
    private String brand;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private Integer vramMin;
    private Boolean inStock;

    private String sortBy = "price_inr";
    private String sortDir = "asc";

    private int page = 0;
    private int size = 20;
}

