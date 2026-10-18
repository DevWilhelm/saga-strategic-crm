package com.rin.sagasia.dto;

import com.rin.sagasia.enums.Role;
import com.rin.sagasia.enums.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.UUID;

@Schema(description = "User profile response")
public record UserResponse(
        @Schema(description = "Unique user identifier (UUID)", example = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d")
        UUID id,

        @Schema(description = "Full name of the user", example = "Administrator")
        String name,

        @Schema(description = "Optional display name", example = "Admin")
        String displayName,

        @Schema(description = "User email address", example = "admin@sagasia.com")
        String email,

        @Schema(description = "Contact phone number", example = "+1234567890")
        String phoneNo,

        @Schema(description = "Assigned user role", example = "ADMIN")
        Role role,

        @Schema(description = "User status", example = "ACTIVE")
        UserStatus status,

        @Schema(description = "Granted Spring Security authorities", example = "[\"ROLE_ADMIN\"]")
        List<String> authorities
) {}
