package com.airigs.modules.build.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BuildItemDTO {
    private UUID productId;
    private String     category;
    private String     name;
    private String     brand;
    private BigDecimal priceInr;
    private Integer    vramGb;
    private Boolean    isPrimary;   // true = hero component (GPU for AI builds)
    private String     reason;      // Gemini's 2-sentence justification
    private String     sku;         // catalog_id from specs jsonb
}
