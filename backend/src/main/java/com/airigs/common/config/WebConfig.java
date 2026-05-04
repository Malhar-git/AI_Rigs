package com.airigs.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS configuration — controls which frontend origins can call the API.
 *
 * Dev:  allows localhost:3000 (Next.js dev server)
 * Prod: restrict to your actual domain via ALLOWED_ORIGINS env variable
 *
 * application-dev.yml:
 *   app.cors.allowed-origins: http://localhost:3000
 *
 * application-prod.yml:
 *   app.cors.allowed-origins: https://airigs.in,https://www.airigs.in
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                // Cache preflight response for 1 hour — reduces OPTIONS requests
                .maxAge(3600);
    }
}

