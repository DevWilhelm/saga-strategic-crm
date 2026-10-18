package com.rin.sagasia.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rin.sagasia.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BearerTokenService {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final CustomUserDetailsService customUserDetailsService;

    public record TokenPayload(String sub, String email, String role, long exp) {}

    public String generateToken(UserPrincipal userPrincipal) {
        try {
            long expirationSeconds = appProperties.getSecurity().getToken().getExpirationMinutes() * 60;
            long exp = Instant.now().getEpochSecond() + expirationSeconds;

            Map<String, Object> payload = Map.of(
                    "sub", userPrincipal.getId().toString(),
                    "email", userPrincipal.getEmail(),
                    "role", userPrincipal.getRole().name(),
                    "exp", exp
            );

            String payloadJson = objectMapper.writeValueAsString(payload);
            String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            String signature = sign(encodedPayload);

            return encodedPayload + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate token", e);
        }
    }

    public UserPrincipal authenticate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) {
                throw new RuntimeException("Invalid token format");
            }

            String encodedPayload = parts[0];
            String signature = parts[1];

            String expectedSignature = sign(encodedPayload);
            if (!expectedSignature.equals(signature)) {
                throw new RuntimeException("Invalid token signature");
            }

            String payloadJson = new String(
                    Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            TokenPayload payload = objectMapper.readValue(payloadJson, TokenPayload.class);

            if (Instant.now().getEpochSecond() > payload.exp()) {
                throw new RuntimeException("Token expired");
            }

            return (UserPrincipal) customUserDetailsService.loadUserByUsername(payload.email());
        } catch (Exception e) {
            throw new RuntimeException("Token authentication failed", e);
        }
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(
                appProperties.getSecurity().getToken().getSecret().getBytes(StandardCharsets.UTF_8),
                "HmacSHA256");
        mac.init(keySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
    }
}
