package com.airigs.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Pagination envelope used by any endpoint that returns a list with page info.
 *
 * Response shape:
 * {
 *   "success": true,
 *   "data": {
 *     "content":       [ ...items... ],
 *     "page":          0,
 *     "size":          20,
 *     "totalElements": 3226,
 *     "totalPages":    162,
 *     "last":          false
 *   }
 * }
 *
 * Usage in a controller:
 *   Page<GpuBenchmarkResult> page = repo.findAll(pageable);
 *   return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(page, mapper::toDTO)));
 */


@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
public class PagedResponse<T> {

    private final List<T> content;
    private final int page;
    private final int size;
    private final int totalElements;
    private final int totalPages;
    private final boolean last;

    public PagedResponse(List<T> content, int page, int size, int totalElements, int totalPages, boolean last) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.last = last;
    }

    // ── Factory — build from Spring Data Page<Entity> ─────────────────────────

    /**
     * Map a Spring Data Page directly to a PagedResponse with the same type.
     */
    public static <T> PagedResponse<T> of(Page<T> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                (int) page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }


    /**
     * Map a Spring Data Page<Entity> to PagedResponse<DTO> using a mapper function.
     *
     * Usage:
     *   PagedResponse.of(entityPage, entity -> modelMapper.map(entity, MyDTO.class))
     */

    public static <E, T> PagedResponse<T> of(Page<E> page, java.util.function.Function<E, T> mapper) {
        List<T> mapped = page.getContent()
                .stream()
                .map(mapper)
                .toList();

        return new PagedResponse<>(
                mapped,
                page.getNumber(),
                page.getSize(),
                (int) page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}


