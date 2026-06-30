package com.airigs.modules.build.repository;

import com.airigs.modules.build.entity.Build;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuildRepository extends JpaRepository<Build, UUID> {

    // Fetch build with all items in one query — avoids N+1
    @Query("SELECT b FROM Build b LEFT JOIN FETCH b.items where b.id = :id")
    Optional<Build> findIdWithItems(@Param("id")  UUID id);

    // All builds for a logged-in user
    Page<Build> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // All builds in a browser session (anonymous users)
    List<Build> findBySessionIdOrderByCreatedAtDesc(String sessionId);

    // Admin analytics — recent builds by task type
    @Query("SELECT b FROM Build b WHERE b.task = :task ORDER BY b.createdAt DESC")
    List<Build> findByRecentByTask(@Param("task") String task, Pageable pageable);
}
