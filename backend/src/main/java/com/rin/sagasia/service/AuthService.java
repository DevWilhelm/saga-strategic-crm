package com.rin.sagasia.service;

import com.rin.sagasia.dto.LoginRequest;
import com.rin.sagasia.dto.LoginResponse;
import com.rin.sagasia.dto.UserResponse;
import com.rin.sagasia.security.UserPrincipal;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    UserResponse me(UserPrincipal userPrincipal);
}
