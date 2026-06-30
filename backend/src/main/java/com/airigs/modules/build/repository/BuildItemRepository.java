package com.airigs.modules.build.repository;

import com.airigs.modules.build.entity.BuildItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BuildItemRepository extends JpaRepository<BuildItem, UUID> {

    List<BuildItem> findByBuildId(UUID userId);

    // How often was a product recommended — useful for popularity analytics
    long countByProductId(UUID productId);
}
