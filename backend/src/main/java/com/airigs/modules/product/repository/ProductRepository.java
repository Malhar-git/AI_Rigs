package com.airigs.modules.product.repository;

import com.airigs.modules.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    boolean existsByName(String name);

    List<Product> findByCategoryIgnoreCase(String category);

    // ── Core filter used by BuildService ─────────────────────────────────────
    // Returns all in-stock products within budget AND meeting VRAM floor.
    // vramMin is applied only to GPUs — other categories are unaffected.
    // GPUs with null vram_gb are excluded from eligible (they don't prove VRAM fit).
    @Query("""
        SELECT p FROM Product p
        WHERE p.inStock = true
          AND p.priceInr >= :budgetMin
          AND p.priceInr <= :budgetMax
          AND (
                p.category != 'gpu'
                OR p.vramGb >= :vramMin
              )
        ORDER BY p.category ASC, p.priceInr ASC
        """)
    List<Product> findEligibleForBuild(@Param("budgetMin") BigDecimal budgetMin,
                                       @Param("budgetMax") BigDecimal budgetMax,
                                       @Param("vramMin")   int vramMin);

    // Fallback: highest-VRAM GPUs in budget when none meet the VRAM floor
    @Query("""
        SELECT p FROM Product p
        WHERE p.inStock = true
          AND p.category = 'gpu'
          AND p.priceInr <= :budgetMax
        ORDER BY p.vramGb DESC NULLS LAST, p.priceInr ASC
        """)
    List<Product> findTopVramGpusWithinBudget(@Param("budgetMax") BigDecimal budgetMax,
                                              Pageable pageable);

    // ── Dynamic filter used by product catalog page ─────────────────────────
    // Native query: CAST(:x AS VARCHAR) gives the null parameter an explicit type,
    // avoiding PostgreSQL's "lower(bytea) does not exist" error from untyped nulls.
    @Query(
        value = """
            SELECT * FROM products p
            WHERE (CAST(:category AS VARCHAR) IS NULL OR LOWER(p.category) = LOWER(CAST(:category AS VARCHAR)))
              AND (CAST(:brand AS VARCHAR)    IS NULL OR LOWER(p.brand)    LIKE LOWER('%' || CAST(:brand AS VARCHAR) || '%'))
              AND (:budgetMax IS NULL OR p.price_inr <= :budgetMax)
              AND (:budgetMin IS NULL OR p.price_inr >= :budgetMin)
              AND (:vramMin   IS NULL OR p.vram_gb   >= :vramMin)
              AND (:inStock   IS NULL OR p.in_stock   = :inStock)
            """,
        countQuery = """
            SELECT COUNT(*) FROM products p
            WHERE (CAST(:category AS VARCHAR) IS NULL OR LOWER(p.category) = LOWER(CAST(:category AS VARCHAR)))
              AND (CAST(:brand AS VARCHAR)    IS NULL OR LOWER(p.brand)    LIKE LOWER('%' || CAST(:brand AS VARCHAR) || '%'))
              AND (:budgetMax IS NULL OR p.price_inr <= :budgetMax)
              AND (:budgetMin IS NULL OR p.price_inr >= :budgetMin)
              AND (:vramMin   IS NULL OR p.vram_gb   >= :vramMin)
              AND (:inStock   IS NULL OR p.in_stock   = :inStock)
            """,
        nativeQuery = true
    )
    Page<Product> findWithFilters(
            @Param("category")  String     category,
            @Param("brand")     String     brand,
            @Param("budgetMin") BigDecimal budgetMin,
            @Param("budgetMax") BigDecimal budgetMax,
            @Param("vramMin")   Integer    vramMin,
            @Param("inStock")   Boolean    inStock,
            Pageable pageable);

    // ── Distinct values for filter dropdowns ─────────────────────────────────-

    @Query("SELECT DISTINCT p.category FROM Product p ORDER BY p.category")
    List<String> findDistinctCategories();

    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.brand IS NOT NULL ORDER BY p.brand")
    List<String> findDistinctBrands();

    @Query("SELECT DISTINCT p.brand FROM Product p WHERE LOWER(p.category) = LOWER(:category) ORDER BY p.brand")
    List<String> findDistinctBrandsByCategory(@Param("category") String category);

}
