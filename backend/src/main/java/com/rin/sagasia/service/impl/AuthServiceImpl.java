package com.rin.sagasia.service.impl;

import com.rin.sagasia.dto.LoginRequest;
import com.rin.sagasia.dto.LoginResponse;
import com.rin.sagasia.dto.UserResponse;
import com.rin.sagasia.entity.User;
import com.rin.sagasia.repository.UserRepository;
import com.rin.sagasia.security.BearerTokenService;
import com.rin.sagasia.security.UserPrincipal;
import com.rin.sagasia.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final BearerTokenService bearerTokenService;
    private final UserRepository userRepository;

    @Override
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.identifier(), request.password()));

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String token = bearerTokenService.generateToken(userPrincipal);
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new LoginResponse("Bearer", token, toUserResponse(user));
    }

    @Override
    public UserResponse me(UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toUserResponse(user);
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
