package com.rin.sagasia.dto;

import com.rin.sagasia.enums.Role;
import com.rin.sagasia.enums.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload for creating a new user (Admin only)")
public record CreateUserRequest(
        @Schema(description = "Full name of the user", example = "Jane Doe")
        @NotBlank(message = "Name is required")
        String name,

        @Schema(description = "Optional display name", example = "Jane", nullable = true)
        String displayName,

        @Schema(description = "Unique corporate email address", example = "jane.doe@sagasia.com")
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @Schema(description = "Optional contact phone number", example = "+1987654321", nullable = true)
        String phoneNo,

        @Schema(description = "User password (minimum 6 characters)", example = "SecretPass123")
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        @Schema(description = "User role", example = "ADMIN", defaultValue = "ADMIN")
        Role role,

        @Schema(description = "User account status", example = "ACTIVE", defaultValue = "ACTIVE")
        UserStatus status
) {}
