package com.example.authservice;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String adminToken;

    @BeforeEach
    void obtainAdminToken() throws Exception {
        var body = Map.of("email", "admin@dev.local", "password", "Admin1234!@#");
        var result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();
        var response = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        adminToken = (String) response.get("token");
    }

    @Test
    void listUsers_returns200ForAdmin() throws Exception {
        mockMvc.perform(get("/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void listUsers_returns403ForUnauthenticated() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void listUsers_returns403ForDeveloper() throws Exception {
        var loginBody = Map.of("email", "bob@dev.local", "password", "Bob@Dev1234!");
        var result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andReturn();
        String devToken = (String) objectMapper.readValue(result.getResponse().getContentAsString(), Map.class).get("token");

        mockMvc.perform(get("/users").header("Authorization", "Bearer " + devToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void createUser_returns201ForAdmin() throws Exception {
        var body = Map.of(
                "name", "New User",
                "email", "newuser@test.local",
                "password", "NewUser1234!@#",
                "role", "developer",
                "plan", "free");

        mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("newuser@test.local"))
                .andExpect(jsonPath("$.role.name").value("developer"));
    }

    @Test
    void createUser_returns400ForDuplicateEmail() throws Exception {
        var body = Map.of(
                "name", "Dup", "email", "admin@dev.local",
                "password", "Dup12345!@#$", "role", "developer");

        mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already in use"));
    }

    @Test
    void getMe_returns200WithCurrentUser() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@dev.local"))
                .andExpect(jsonPath("$.role").value("admin"));
    }

    @Test
    void updateUserRole_changesRoleForAdmin() throws Exception {
        var listResult = mockMvc.perform(get("/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        var users = objectMapper.readValue(listResult.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(java.util.List.class, Map.class));
        Map<?, ?> bob = ((java.util.List<Map<?, ?>>) users).stream()
                .filter(u -> "bob@dev.local".equals(u.get("email")))
                .findFirst().orElseThrow();
        Long bobId = Long.valueOf(bob.get("id").toString());

        mockMvc.perform(put("/users/" + bobId + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "architect"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role.name").value("architect"));
    }

    @Test
    void deleteUser_returns204ForAdmin() throws Exception {
        var body = Map.of(
                "name", "ToDelete", "email", "todelete@test.local",
                "password", "Delete1234!@#", "role", "developer");
        var result = mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn();
        Long userId = Long.valueOf(
                objectMapper.readValue(result.getResponse().getContentAsString(), Map.class).get("id").toString());

        mockMvc.perform(delete("/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }
}
