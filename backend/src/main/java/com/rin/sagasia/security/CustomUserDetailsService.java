package com.rin.sagasia.security;

import com.rin.sagasia.enums.UserStatus;
import com.rin.sagasia.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Accepts either an email address or a user name as the identifier.
     * Email is tried first (detected by the presence of '@'), then name.
     */
    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        return (identifier.contains("@")
                ? userRepository.findByEmail(identifier)
                : userRepository.findByName(identifier).or(() -> userRepository.findByEmail(identifier)))
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .map(UserPrincipal::fromUser)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No active user found for identifier: " + identifier));
    }
}
