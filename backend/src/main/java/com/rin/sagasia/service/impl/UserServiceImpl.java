package com.rin.sagasia.service.impl;

import com.rin.sagasia.dto.CreateUserRequest;
import com.rin.sagasia.dto.UpdateUserRequest;
import com.rin.sagasia.dto.UserResponse;
import com.rin.sagasia.entity.User;
import com.rin.sagasia.enums.Role;
import com.rin.sagasia.enums.UserStatus;
import com.rin.sagasia.exception.ResourceNotFoundException;
import com.rin.sagasia.repository.UserRepository;
import com.rin.sagasia.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use: " + request.email());
        }

        User user = User.builder()
                .name(request.name())
                .displayName(request.displayName())
                .email(request.email())
                .phoneNo(request.phoneNo())
                .password(passwordEncoder.encode(request.password()))
                .role(request.role() != null ? request.role() : Role.ADMIN)
                .status(request.status() != null ? request.status() : UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toUserResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setName(request.name());
        user.setDisplayName(request.displayName());
        user.setPhoneNo(request.phoneNo());

        if (request.role() != null) {
            user.setRole(request.role());
        }

        if (request.status() != null) {
            user.setStatus(request.status());
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        User updated = userRepository.save(user);
        return toUserResponse(updated);
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getDisplayName(),
                user.getEmail(),
                user.getPhoneNo(),
                user.getRole(),
                user.getStatus(),
                List.of("ROLE_" + user.getRole().name())
        );
    }
}

