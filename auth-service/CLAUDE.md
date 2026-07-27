# auth-service

## Internal layout

```
entity/     AppUser (app_users table), Role (roles table, role_permissions table)
repository/ UserRepository, RoleRepository
dto/        AuthResponse, LoginRequest, RegisterRequest
            UserAdminDto, RoleDto (admin API responses)
            AdminCreateUserRequest, AdminUpdateUserRequest
            UpdateProfileRequest (own profile)
service/    AuthService (login/register), UserManagementService (CRUD + profile),
            RoleService (list roles)
controller/ AuthController (/auth/**), UserController (/users/**), RoleController (/roles/**)
security/   JwtUtil, JwtAuthFilter, CustomUserDetailsService
config/     SecurityConfig, DevDataSeeder, ProdDataSeeder
```

See root `CLAUDE.md` for the security rules enforced in `SecurityConfig`, the role/permission system, and dev seed users.

## Test setup

```bash
./mvnw test
./mvnw test -Dtest=MyServiceTest
```

- H2 in-memory (create-drop), Eureka disabled
- `DevDataSeeder` runs in tests (profile `!docker`) — seeds roles + 3 users
- Integration tests obtain a real JWT by logging in as `admin@dev.local`
- Both unit tests (`AuthServiceTest` with Mockito) and integration tests (`AuthControllerIntegrationTest`, `UserControllerIntegrationTest` with MockMvc + H2)
