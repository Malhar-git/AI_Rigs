package com.airigs.modules.build.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Tells the frontend canvas which products to zoom/focus and which to dim.
 * Populated by BuildService after matching Claude's catalog_ids to real UUIDs.
 */
@Data
@Builder
public class CanvasHintsDTO {

    private List<UUID> focusProductIds; // hero components — zoom in
    private List<UUID> secondaryProductIds; // supporting — show normally
    private boolean dimOthers;// grey out non-recommended products
    private String zoomLevel; // overview | focused | hero
}