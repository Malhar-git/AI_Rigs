package com.airigs.common.exception;

import lombok.Getter;

@Getter
public class ResourceNotFoundException extends RuntimeException {
    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;

//    Simple message constructor
    public ResourceNotFoundException(String message) {
        super(message);
        this.resourceName = null;
        this.fieldName = null;
        this.fieldValue = null;
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s with %s '%s' not found", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

}
