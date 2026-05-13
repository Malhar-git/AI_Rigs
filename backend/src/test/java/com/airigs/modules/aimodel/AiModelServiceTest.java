package com.airigs.modules.aimodel;

import com.airigs.modules.aimodel.dto.AiModelFamilyGroupDto;
import com.airigs.modules.aimodel.dto.VramFloorDto;
import com.airigs.modules.aimodel.entity.AiModel;
import com.airigs.modules.aimodel.repository.AiModelRepository;
import com.airigs.modules.aimodel.service.AiModelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiModelServiceTest {

    @Mock
    private AiModelRepository aiModelRepository;

    private AiModelService aiModelService;

    @BeforeEach
    void setUp() {
        aiModelService = new AiModelService(aiModelRepository);
    }

    @Test
    void getGroupedByFamily_groupsModelsByFamily() {
        AiModel a1 = AiModel.builder()
                .id(UUID.randomUUID())
                .modelName("Alpha 1")
                .modelFamily("Alpha")
                .vramMinGb(16)
                .precisionVariants(List.of("q4"))
                .skipPrecision(false)
                .build();
        AiModel a2 = AiModel.builder()
                .id(UUID.randomUUID())
                .modelName("Alpha 2")
                .modelFamily("Alpha")
                .vramMinGb(32)
                .precisionVariants(List.of("q4"))
                .skipPrecision(false)
                .build();
        AiModel b1 = AiModel.builder()
                .id(UUID.randomUUID())
                .modelName("Beta 1")
                .modelFamily("Beta")
                .vramMinGb(24)
                .precisionVariants(List.of("int8"))
                .skipPrecision(false)
                .build();

        when(aiModelRepository.findAllByOrderByModelFamilyAscModelNameAsc())
                .thenReturn(List.of(a1, a2, b1));

        List<AiModelFamilyGroupDto> groups = aiModelService.getGroupedByFamily();

        assertEquals(2, groups.size());
        assertEquals("Alpha", groups.get(0).getFamily());
        assertEquals(2, groups.get(0).getModels().size());
        assertEquals("Beta", groups.get(1).getFamily());
        assertEquals(1, groups.get(1).getModels().size());
    }

    @Test
    void getVramFloor_appliesQ4MultiplierWhenSupported() {
        UUID id = UUID.randomUUID();
        AiModel model = AiModel.builder()
                .id(id)
                .modelName("Qwen")
                .modelFamily("Qwen")
                .vramMinGb(24)
                .precisionVariants(List.of("q4", "int8"))
                .skipPrecision(false)
                .build();

        when(aiModelRepository.findById(id)).thenReturn(Optional.of(model));

        VramFloorDto dto = aiModelService.getVramFloor(id, "q4");
        assertEquals(12, dto.getVramFloorGb());
    }

    @Test
    void getVramFloor_ignoresPrecisionWhenSkipPrecision() {
        UUID id = UUID.randomUUID();
        AiModel model = AiModel.builder()
                .id(id)
                .modelName("Claude")
                .modelFamily("Claude")
                .vramMinGb(40)
                .precisionVariants(List.of("q4"))
                .skipPrecision(true)
                .build();

        when(aiModelRepository.findById(id)).thenReturn(Optional.of(model));

        VramFloorDto dto = aiModelService.getVramFloor(id, "q4");
        assertEquals(40, dto.getVramFloorGb());
    }
}

