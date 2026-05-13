package com.airigs.modules.aimodel.repository;

import com.airigs.modules.aimodel.entity.AiModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiModelRepository extends JpaRepository<AiModel, UUID> {

    // Used by the seeder to avoid duplicates.
    boolean existsByModelNameIgnoreCase(String modelName);

    // Used by the /api/models endpoint for grouped display.
    List<AiModel> findAllByOrderByModelFamilyAscModelNameAsc();
}
