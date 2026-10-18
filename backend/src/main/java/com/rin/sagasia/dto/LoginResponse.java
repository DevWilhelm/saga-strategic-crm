package com.rin.sagasia.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Authentication response containing access token and user details")
public record LoginResponse(
        @Schema(description = "Token type identifier", example = "Bearer")
        String tokenType,

        @Schema(description = "Stateless HMAC-SHA256 signed bearer access token", example = "eyJzdWIiOiIxMjM...6NmQw...")
        String accessToken,

        @Schema(description = "Authenticated user profile summary")
        UserResponse user
) {}
