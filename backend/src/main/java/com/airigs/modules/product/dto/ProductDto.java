package com.airigs.modules.product.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDto {

    private UUID id;
    private String name;
    private String category;

    private String brand;
    private BigDecimal priceInr;
    private Integer vramGb;

    private boolean inStock;
    // Full raw jsonb — kept as a Map (not JsonNode) so it serializes as plain JSON.
    // Under Spring Boot 4 (Jackson 3, tools.jackson.*) a Jackson-2 JsonNode is treated
    // as a foreign POJO and serialized as its getters; a Map is version-agnostic.
    private Map<String, Object> specs;

    // ── Convenience fields unpacked from specs ────────────────────────────────
    // Populated by ProductService.toDTO() for quick display without jsonb parsing

    private String  tdpWatts;          // GPU: specs.tdp_watts | CPU: specs.tdp_watts
    private String  architecture;      // GPU: specs.architecture | CPU: specs.architecture
    private String  memoryType;        // GPU: specs.vram_type
    private Integer coreCount;         // GPU: specs.cuda_cores | CPU: specs.cores
    private String  socket;            // CPU: specs.socket
    private String  tier;              // all: specs.tier (flagship|high-end|mid-range|entry)
    private String  badge;             // all: specs.badge (editor label)
    private String  formFactor;        // Rack: "{rack_units}U"
    private Integer aiTops;            // GPU: specs.ai_tops (Tensor TOPS)
    private String  series;            // all: specs.series

    /*
     * Outbound DTO — returned by every product endpoint and by BuildService
     * when assembling the Claude prompt catalog.
     *
     * Convenience fields (tdpWatts, architecture, etc.) are unpacked from the
     * specs JSONB by ProductService.toDTO() so the frontend doesn't have to
     * navigate nested JSON for common filter/display values.
     *
     * Field path reference per category:
     *
     *   GPU
     *     tdpWatts      ← specs.tdp_watts          (integer, from specifications{})
     *     architecture  ← specs.architecture        (string)
     *     memoryType    ← specs.vram_type           (string, e.g. "GDDR7")
     *     coreCount     ← specs.cuda_cores          (integer)
     *     aiTops        ← specs.ai_tops             (integer, Tensor TOPS)
     *     tier          ← specs.tier                (string, e.g. "flagship")
     *     badge         ← specs.badge               (string, e.g. "Best AI GPU")
     *
     *   CPU
     *     tdpWatts      ← specs.tdp_watts           (integer)
     *     architecture  ← specs.architecture        (string, e.g. "Zen 5")
     *     coreCount     ← specs.cores               (integer)
     *     socket        ← specs.socket              (string, e.g. "AM5")
     *     tier          ← specs.tier
     *     badge         ← specs.badge
     *
     *   Rack
     *     formFactor    ← specs.form_factor.rack_units + "U"
     *     tier          ← specs.tier
     *     badge         ← specs.badge
     */

}
