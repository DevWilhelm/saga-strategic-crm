package com.rin.sagasia.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credentials for user login")
public record LoginRequest(
        @Schema(description = "Name or email address", example = "admin@sagasia.com")
        @NotBlank(message = "Name or email is required")
        String identifier,

        @Schema(description = "Account password", example = "Admin@123")
        @NotBlank(message = "Password is required")
        String password
) {}
