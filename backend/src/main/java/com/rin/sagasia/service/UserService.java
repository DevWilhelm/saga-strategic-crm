package com.rin.sagasia.service;

import com.rin.sagasia.dto.CreateUserRequest;
import com.rin.sagasia.dto.UpdateUserRequest;
import com.rin.sagasia.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse createUser(CreateUserRequest request);
    Page<UserResponse> getAllUsers(Pageable pageable);
    List<UserResponse> getAllUsers();
    UserResponse getUserById(UUID id);
    UserResponse updateUser(UUID id, UpdateUserRequest request);
    void deleteUser(UUID id);
}

