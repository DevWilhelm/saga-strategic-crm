package com.rin.sagasia.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Sagasia CRM API")
                        .version("1.0.0")
                        .description("""
                                ### Sagasia CRM Backend REST API Documentation
                                
                                This API provides secure internal CRM management services, including:
                                - **Authentication**: HMAC-SHA256 Stateless Bearer Token login and user profile inspection (`/api/auth/**`).
                                - **User Management (CRUD)**: Admin-only CRUD operations for managing CRM system users (`/api/users/**`).
                                
                                #### Authentication Workflow:
                                1. Call `POST /api/auth/login` with your registered email and password.
                                2. Copy the returned `accessToken`.
                                3. Click the **Authorize** button at the top of this Swagger UI page.
                                4. Paste the token in the `Value` field (no need to type `Bearer `, just paste the token).
                                5. Click **Authorize** and you are ready to execute protected endpoints!
                                """)
                        .contact(new Contact()
                                .name("Sagasia Development Team")
                                .email("dev@sagasia.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://sagasia.com")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Development Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("HMAC-SHA256")
                                        .description("Enter your Bearer access token received from /api/auth/login")));
    }
}
