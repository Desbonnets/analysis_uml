package com.example.authservice;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void register_returns201ForValidRequest() throws Exception {
        var body = Map.of(
                "name", "Test User",
                "email", "valid@integration.test",
                "password", "Test1234!@#$",
                "role", "developer");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(cookie().exists("auth_token"))
                .andExpect(jsonPath("$.email").value("valid@integration.test"))
                .andExpect(jsonPath("$.role").value("developer"));
    }

    @Test
    void register_returns400WithMessageForWeakPassword() throws Exception {
        var body = Map.of(
                "name", "Test",
                "email", "weak@integration.test",
                "password", "allowercase12",
                "role", "developer");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isNotEmpty());
    }

    @Test
    void register_returns400ForPasswordUnder12Chars() throws Exception {
        var body = Map.of(
                "name", "Test",
                "email", "short@integration.test",
                "password", "Ab1!",
                "role", "developer");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_returns400ForInvalidEmail() throws Exception {
        var body = Map.of(
                "name", "Test",
                "email", "not-an-email",
                "password", "Test1234!@#$",
                "role", "developer");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_returns400ForDuplicateEmail() throws Exception {
        var body = Map.of(
                "name", "Test",
                "email", "dup@integration.test",
                "password", "Test1234!@#$",
                "role", "developer");
        var json = objectMapper.writeValueAsString(body);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON).content(json));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already in use"));
    }

    @Test
    void login_returns200AndTokenForValidCredentials() throws Exception {
        var regBody = Map.of(
                "name", "Login User",
                "email", "login@integration.test",
                "password", "Login1234!@#",
                "role", "developer");
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regBody)));

        var loginBody = Map.of("email", "login@integration.test", "password", "Login1234!@#");
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("auth_token"))
                .andExpect(jsonPath("$.email").value("login@integration.test"));
    }

    @Test
    void login_returns400ForInvalidEmailFormat() throws Exception {
        var body = Map.of("email", "not-valid", "password", "Password1!@#");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_returns401WithErrorMessageForWrongPassword() throws Exception {
        var regBody = Map.of(
                "name", "Cred User",
                "email", "cred@integration.test",
                "password", "Cred1234!@#$",
                "role", "developer");
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regBody)));

        var loginBody = Map.of("email", "cred@integration.test", "password", "WrongPass1234!@#");
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Email ou mot de passe incorrect"));
    }

    @Test
    void login_returns401WithErrorMessageForUnknownEmail() throws Exception {
        var body = Map.of("email", "nobody@integration.test", "password", "Any1234!@#$");
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").isNotEmpty());
    }
}
