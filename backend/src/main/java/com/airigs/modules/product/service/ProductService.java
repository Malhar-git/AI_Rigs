package com.airigs.modules.product.service;

import com.airigs.common.exception.ResourceNotFoundException;
import com.airigs.common.response.PagedResponse;
import com.airigs.modules.product.dto.ProductDto;
import com.airigs.modules.product.dto.ProductFilterRequest;
import com.airigs.modules.product.entity.Product;
import com.airigs.modules.product.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor()
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    // ── Single product ────────────────────────────────────────────────────────

    public ProductDto getById(UUID id) {
        return productRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
    }

    // ── Catalog page ──────────────────────────────────────────────────────────

    public PagedResponse<ProductDto> getFiltered(ProductFilterRequest req) {
        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(req.getSortDir())
                        ? Sort.Direction.DESC : Sort.Direction.ASC,
                resolveSortField(req.getSortBy())
        );
        org.springframework.data.domain.Pageable pageable = PageRequest.of(req.getPage(), req.getSize(), sort);

        Page<Product> page = productRepository.findWithFilters(
                req.getCategory(),
                req.getBrand(),
                req.getBudgetMin(),
                req.getBudgetMax(),
                req.getVramMin(),
                req.getInStock(),
                pageable
        );
        return PagedResponse.of(page, this::toDTO);
    }

    // ── Build wizard — catalog slice for Claude ───────────────────────────────
    // Called by BuildService before constructing the Claude prompt.
    // Returns in-stock products within budget that meet the VRAM floor.
    public List<ProductDto> filterByBudgetAndVram(BigDecimal budgetMin,
                                                  BigDecimal budgetMax,
                                                  int vramFloorGb) {
        return productRepository
                .findEligibleForBuild(budgetMax, vramFloorGb)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // ── Category browsing ─────────────────────────────────────────────────────

    public List<ProductDto> getByCategory(String category) {
        return productRepository
                .findByCategoryIgnoreCase(category)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // ── Filter metadata ───────────────────────────────────────────────────────

    public List<String> getCategories() {
        return productRepository.findDistinctCategories();
    }

    public List<String> getBrands(String category) {
        return (category != null && !category.isBlank())
                ? productRepository.findDistinctBrandsByCategory(category)
                : productRepository.findDistinctBrands();
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private ProductDto toDTO(Product p) {
        JsonNode specs = objectMapper.valueToTree(p.getSpecs());
        String cat     = p.getCategory();
        Integer coreCount = "gpu".equals(cat)
                ? specInt(specs, "cuda_cores")
                : "cpu".equals(cat) ? specInt(specs, "cores") : null;

        return ProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .category(cat)
                .brand(p.getBrand())
                .priceInr(p.getPriceInr())
                .vramGb(p.getVramGb())
                .inStock(Boolean.TRUE.equals(p.getInStock()))
                .specs(specs)
                // Common fields present in all categories
                .tier(   specStr(specs, "tier"))
                .badge(  specStr(specs, "badge"))
                .series( specStr(specs, "series"))
                // GPU + CPU shared
                .tdpWatts(     specStr(specs, "tdp_watts"))
                .architecture( specStr(specs, "architecture"))
                // GPU specific
                .memoryType(   "gpu".equals(cat) ? specStr(specs, "vram_type")   : null)
                .coreCount(    coreCount)
                .aiTops(       "gpu".equals(cat) ? specInt(specs, "ai_tops")     : null)
                // CPU specific
                .socket(       "cpu".equals(cat) ? specStr(specs, "socket")      : null)
                // Rack specific — rack_units lives inside form_factor sub-object
                .formFactor(   "rack".equals(cat) ? resolveRackFormFactor(specs) : null)
                .build();
    }

    // ── Spec field helpers ────────────────────────────────────────────────────

    private String specStr(JsonNode specs, String field) {
        if (specs == null || specs.isMissingNode()) return null;
        JsonNode node = specs.path(field);
        return (node.isNull() || node.isMissingNode()) ? null : node.asText(null);
    }

    private Integer specInt(JsonNode specs, String field) {
        if (specs == null || specs.isMissingNode()) return null;
        JsonNode node = specs.path(field);
        return (node.isNull() || node.isMissingNode() || !node.isNumber())
                ? null : node.asInt();
    }

    private String resolveRackFormFactor(JsonNode specs) {
        if (specs == null) return null;
        JsonNode ff = specs.path("form_factor");
        if (ff.isMissingNode() || ff.isNull()) return null;
        JsonNode units = ff.path("rack_units");
        if (units.isMissingNode() || units.isNull()) return null;
        return units.asInt() + "U";
    }

    // ── Sort field mapping ────────────────────────────────────────────────────

    private String resolveSortField(String sortBy) {
        return switch (sortBy == null ? "" : sortBy.toLowerCase()) {
            case "vram_gb"   -> "vramGb";
            case "name"      -> "name";
            case "price_inr" -> "priceInr";
            default          -> "priceInr";
        };
    }

}
