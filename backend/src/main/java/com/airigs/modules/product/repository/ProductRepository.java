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

    // ── Dynamic filter used by product catalog page ─────────────────────────
    @Query("""
        SELECT p FROM Product p
        WHERE (:category IS NULL OR LOWER(p.category) = LOWER(:category))
          AND (:brand    IS NULL OR LOWER(p.brand)    LIKE LOWER(CONCAT('%', :brand, '%')))
          AND (:budgetMax IS NULL OR p.priceInr <= :budgetMax)
          AND (:budgetMin IS NULL OR p.priceInr >= :budgetMin)
          AND (:vramMin   IS NULL OR p.vramGb   >= :vramMin)
          AND (:inStock   IS NULL OR p.inStock   = :inStock)
        """)
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
