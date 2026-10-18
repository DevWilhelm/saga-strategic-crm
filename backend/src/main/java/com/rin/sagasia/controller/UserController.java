package com.rin.sagasia.controller;

import com.rin.sagasia.dto.CreateUserRequest;
import com.rin.sagasia.dto.UpdateUserRequest;
import com.rin.sagasia.dto.UserResponse;
import com.rin.sagasia.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin CRUD operations for CRM user accounts")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create user", description = "Creates a new CRM user with encoded password. Admin role required.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation failed or email already registered"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid Bearer token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role")
    })
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List users", description = "Returns a paginated list of all CRM users. Supports sorting and paging parameters.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Paginated list of users retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid Bearer token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role")
    })
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @Parameter(description = "Pagination parameters (e.g. page=0, size=20, sort=createdAt,desc)")
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieve single user profile by their UUID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid Bearer token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role"),
            @ApiResponse(responseCode = "404", description = "User not found with the given UUID")
    })
    public ResponseEntity<UserResponse> getUserById(
            @Parameter(description = "UUID of the user", required = true)
            @PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Update an existing user's name, display name, phone, status, role, or optionally reset password.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation failed on update request body"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid Bearer token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role"),
            @ApiResponse(responseCode = "404", description = "User not found with the given UUID")
    })
    public ResponseEntity<UserResponse> updateUser(
            @Parameter(description = "UUID of the user to update", required = true)
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user", description = "Permanently deletes a CRM user by UUID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "User deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid Bearer token"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role"),
            @ApiResponse(responseCode = "404", description = "User not found with the given UUID")
    })
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "UUID of the user to delete", required = true)
            @PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
