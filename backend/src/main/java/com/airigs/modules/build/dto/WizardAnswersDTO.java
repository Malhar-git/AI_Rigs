package com.airigs.modules.build.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class WizardAnswersDTO {

//  Step 1: required
    @NotBlank(message = "AI task is required")
    private String task;
//  llm_interference | fine-tuning | image_gen | ai_dev | edge_deployment

//  Step 2: optional
    private UUID modelId;
    private String modelName;
    private Integer modelVramGb;

//  Step 3
    private String precision; // fp16 | q8 | q4 | auto

//  Step 4
    @NotBlank(message = "Budget tier is required")
    private String budgetTier; // essential | capable | serious | unrestricted

    private BigDecimal budgetMin; // actual INR derived from tier
    private BigDecimal budgetMax;

//  Step 5
    @NotBlank(message = "usage intensity is required")
    private String intensity; // occasional | daily | intensive | always_on

//  Step 6: multi select
    private List<String> priorities;
    // max_vram | speed | silent | future | value | power | multigpu

//  Step 7: optional
    private String brand; // nvidia | amd | open

//  Step 8
    @NotBlank(message = "Expandibility preference is required")
    private String expand; // fixed | ram | gpu2 | hedt

    // Session / user tracking
    private String sessionId;
    private UUID userId;
}
