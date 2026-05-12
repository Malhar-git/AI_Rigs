package com.airigs.modules.product.controller;

import com.airigs.common.response.ApiResponse;
import com.airigs.common.response.PagedResponse;
import com.airigs.modules.product.dto.ProductDto;
import com.airigs.modules.product.dto.ProductFilterRequest;
import com.airigs.modules.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductDto>>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false, name = "budget_min") BigDecimal budgetMax,
            @RequestParam(required = false, name = "budget_max") BigDecimal budgetMin,
            @RequestParam(required = false, name = "vram_min") Integer vramMin,
            @RequestParam(required = false, name = "in_stock") Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "price_inr", name = "sort_by") String sortBy,
            @RequestParam(defaultValue = "asc", name = "sort_dir") String sortDir
    ) {
        ProductFilterRequest req = new ProductFilterRequest();
        req.setCategory(category);
        req.setBrand(brand);
        req.setBudgetMin(budgetMin);
        req.setBudgetMax(budgetMax);
        req.setVramMin(vramMin);
        req.setInStock(inStock);
        req.setPage(page);
        req.setSize(size);
        req.setSortBy(sortBy);
        req.setSortDir(sortDir);

        return ResponseEntity.ok(ApiResponse.ok(productService.getFiltered(req)));

    }

    // ── GET /api/products/{id} ────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProduct(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getById(id)));
    }

    // ── GET /api/products/category/{category} ─────────────────────────────────
    // Full list for a category (no pagination) — used by wizard dropdowns
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getByCategory(
            @PathVariable String category) {
        return ResponseEntity.ok(
                ApiResponse.ok(productService.getByCategory(category)));
    }

    // ── GET /api/products/meta/categories ─────────────────────────────────────
    // All distinct categories — used to populate filter sidebar
    @GetMapping("/meta/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getCategories()));
    }

    // ── GET /api/products/meta/brands?category=gpu ────────────────────────────
    // All distinct brands, optionally scoped to a category
    @GetMapping("/meta/brands")
    public ResponseEntity<ApiResponse<List<String>>> getBrands(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getBrands(category)));
    }

}