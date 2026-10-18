package com.rin.sagasia.dto;

import com.rin.sagasia.enums.Role;
import com.rin.sagasia.enums.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload for updating an existing user (Admin only)")
public record UpdateUserRequest(
        @Schema(description = "Full name of the user", example = "Jane Doe Updated")
        @NotBlank(message = "Name is required")
        String name,

        @Schema(description = "Optional display name", example = "Jane D.", nullable = true)
        String displayName,

        @Schema(description = "Optional contact phone number", example = "+1987654320", nullable = true)
        String phoneNo,

        @Schema(description = "Optional new password (leave blank to keep current)", example = "NewSecret123", nullable = true)
        @Size(min = 6, message = "Password must be at least 6 characters if provided")
        String password,

        @Schema(description = "User role", example = "ADMIN")
        Role role,

        @Schema(description = "User account status", example = "ACTIVE")
        UserStatus status
) {}
