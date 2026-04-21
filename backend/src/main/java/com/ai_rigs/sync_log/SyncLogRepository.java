package com.ai_rigs.sync_log;

import com.ai_rigs.sync_log.domain.SyncLog;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SyncLogRepository extends JpaRepository<SyncLog, UUID> {
    List<SyncLog> findTop100BySourceOrderByRanAtDesc(String source, Limit limit);
    Optional<SyncLog> findTopBySourceOrderByRanAtDesc(String source);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO sync_log (id, source, status, rows_upserted, ran_at)
        VALUES (gen_random_uuid(), :source, :status, :rowsUpserted, :ranAt)
        """, nativeQuery = true)
    void insertLogEntry(
            @Param("source") String source,
            @Param("status") String status,
            @Param("rowsUpserted") Integer rowsUpserted,
            @Param("ranAt") java.time.LocalDateTime ranAt
    );

}
