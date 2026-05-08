package com.example.authservice;

import com.example.authservice.dto.AuthResponse;
import com.example.authservice.dto.LoginRequest;
import com.example.authservice.dto.RegisterRequest;
import com.example.authservice.entity.AppUser;
import com.example.authservice.entity.Role;
import com.example.authservice.repository.RoleRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.security.JwtUtil;
import com.example.authservice.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserDetailsService userDetailsService;

    @InjectMocks private AuthService authService;

    private static Role developerRole() {
        return Role.builder().id(3L).name("developer").displayName("Développeur").description("").permissions(Set.of()).build();
    }

    @Test
    void register_createsUserAndReturnsToken() {
        var req = new RegisterRequest("Alice", "alice@test.com", "Alice1234!@#", "developer");
        when(userRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Alice1234!@#")).thenReturn("hashed");
        when(roleRepository.findByName("developer")).thenReturn(Optional.of(developerRole()));
        var saved = AppUser.builder().id(1L).name("Alice").email("alice@test.com")
                .password("hashed").role(developerRole()).plan("free").build();
        when(userRepository.save(any(AppUser.class))).thenReturn(saved);
        var userDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("alice@test.com")).thenReturn(userDetails);
        when(jwtUtil.generateToken(userDetails)).thenReturn("jwt-token");

        AuthResponse response = authService.register(req);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("alice@test.com");
        assertThat(response.user().role()).isEqualTo("developer");
    }

    @Test
    void register_defaultsRoleToDeveloperWhenNotProvided() {
        var req = new RegisterRequest("Alice", "alice@test.com", "Alice1234!@#", null);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(roleRepository.findByName("developer")).thenReturn(Optional.of(developerRole()));
        var saved = AppUser.builder().id(1L).name("Alice").email("alice@test.com")
                .password("hashed").role(developerRole()).plan("free").build();
        when(userRepository.save(any(AppUser.class))).thenReturn(saved);
        when(userDetailsService.loadUserByUsername(any())).thenReturn(mock(UserDetails.class));
        when(jwtUtil.generateToken(any())).thenReturn("tok");

        authService.register(req);

        verify(userRepository).save(argThat(u -> "developer".equals(u.getRole().getName())));
    }

    @Test
    void register_throwsWhenEmailAlreadyExists() {
        var req = new RegisterRequest("Alice", "alice@test.com", "Alice1234!@#", "developer");
        when(userRepository.existsByEmail("alice@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already in use");
    }

    @Test
    void login_returnsTokenForValidCredentials() {
        var req = new LoginRequest("alice@test.com", "Alice1234!@#");
        var user = AppUser.builder().id(1L).name("Alice").email("alice@test.com")
                .password("hashed").role(developerRole()).plan("free").build();
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        var userDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("alice@test.com")).thenReturn(userDetails);
        when(jwtUtil.generateToken(userDetails)).thenReturn("jwt-token");

        AuthResponse response = authService.login(req);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("alice@test.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_throwsWhenUserNotFound() {
        var req = new LoginRequest("unknown@test.com", "Password1!@#");
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");
    }
}
