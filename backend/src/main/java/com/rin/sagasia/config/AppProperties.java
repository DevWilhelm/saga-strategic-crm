package com.rin.sagasia.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {

    private final Cors cors = new Cors();
    private final Api api = new Api();
    private final Security security = new Security();

    @Getter
    @Setter
    public static class Cors {
        private String allowedOrigin = "http://localhost:3000";
    }

    @Getter
    @Setter
    public static class Api {
        private String basePath = "/api";
    }

    @Getter
    @Setter
    public static class Security {
        private final Token token = new Token();
        private final Seed seed = new Seed();
    }

    @Getter
    @Setter
    public static class Token {
        private String secret;
        private long expirationMinutes = 120;
    }

    @Getter
    @Setter
    public static class Seed {
        private final Credential admin = new Credential();
    }

    @Getter
    @Setter
    public static class Credential {
        private String email;
        private String password;
    }
}

