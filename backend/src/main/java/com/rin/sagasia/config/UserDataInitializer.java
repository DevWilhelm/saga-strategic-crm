package com.rin.sagasia.config;

import com.rin.sagasia.entity.User;
import com.rin.sagasia.enums.Role;
import com.rin.sagasia.enums.UserStatus;
import com.rin.sagasia.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class UserDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public void run(String... args) {
        String adminEmail = appProperties.getSecurity().getSeed().getAdmin().getEmail();
        String adminPassword = appProperties.getSecurity().getSeed().getAdmin().getPassword();

        if (adminEmail != null && !userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .name("Administrator")
                    .displayName("Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(admin);
            log.info("Admin user seeded with email: {}", adminEmail);
        }
    }
}
