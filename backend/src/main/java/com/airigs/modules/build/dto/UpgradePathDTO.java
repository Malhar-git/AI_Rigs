package com.airigs.modules.build.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpgradePathDTO {

    private String target; // ram | gpu | cpu
    private String currentSpec;
    private String maxPossible;
    private String slotsFree; // free DIM | PCIe | M.2 slots
}
