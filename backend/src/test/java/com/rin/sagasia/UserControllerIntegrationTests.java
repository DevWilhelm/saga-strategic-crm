package com.rin.sagasia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rin.sagasia.dto.CreateUserRequest;
import com.rin.sagasia.dto.LoginRequest;
import com.rin.sagasia.dto.UpdateUserRequest;
import com.rin.sagasia.enums.Role;
import com.rin.sagasia.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UserControllerIntegrationTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static UUID createdUserId;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    private String getAdminToken() throws Exception {
        if (adminToken == null) {
            LoginRequest loginRequest = new LoginRequest("admin@test.com", "Test@123");
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn();
            adminToken = objectMapper.readTree(result.getResponse().getContentAsString())
                    .get("accessToken").asText();
        }
        return adminToken;
    }

    @Test
    @Order(1)
    void shouldFailUserCrudWithoutToken() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(2)
    void shouldCreateUser() throws Exception {
        String token = getAdminToken();
        CreateUserRequest request = new CreateUserRequest(
                "Jane Doe",
                "Jane",
                "jane.doe@example.com",
                "0987654321",
                "Secret123",
                Role.ADMIN,
                UserStatus.ACTIVE
        );

        MvcResult result = mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Jane Doe"))
                .andExpect(jsonPath("$.displayName").value("Jane"))
                .andExpect(jsonPath("$.email").value("jane.doe@example.com"))
                .andExpect(jsonPath("$.phoneNo").value("0987654321"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();

        String idString = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
        createdUserId = UUID.fromString(idString);
    }

    @Test
    @Order(3)
    void shouldFailCreateUserWithDuplicateEmail() throws Exception {
        String token = getAdminToken();
        CreateUserRequest request = new CreateUserRequest(
                "Duplicate Jane",
                "Jane2",
                "jane.doe@example.com",
                "0987654321",
                "Secret123",
                Role.ADMIN,
                UserStatus.ACTIVE
        );

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email already in use: jane.doe@example.com"));
    }

    @Test
    @Order(4)
    void shouldGetUserById() throws Exception {
        String token = getAdminToken();

        mockMvc.perform(get("/api/users/" + createdUserId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdUserId.toString()))
                .andExpect(jsonPath("$.name").value("Jane Doe"))
                .andExpect(jsonPath("$.email").value("jane.doe@example.com"));
    }

    @Test
    @Order(5)
    void shouldGetAllUsers() throws Exception {
        String token = getAdminToken();

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @Order(6)
    void shouldUpdateUser() throws Exception {
        String token = getAdminToken();
        UpdateUserRequest updateRequest = new UpdateUserRequest(
                "Jane Updated",
                "JaneU",
                "0911223344",
                "NewPassword123",
                Role.ADMIN,
                UserStatus.INACTIVE
        );

        mockMvc.perform(put("/api/users/" + createdUserId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdUserId.toString()))
                .andExpect(jsonPath("$.name").value("Jane Updated"))
                .andExpect(jsonPath("$.displayName").value("JaneU"))
                .andExpect(jsonPath("$.phoneNo").value("0911223344"))
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    @Order(7)
    void shouldDeleteUser() throws Exception {
        String token = getAdminToken();

        mockMvc.perform(delete("/api/users/" + createdUserId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // Verify it is no longer found
        mockMvc.perform(get("/api/users/" + createdUserId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}

