package com.example.servicemetier1.security;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Grants a full view/edit bypass on every project to ROLE_SUPERADMIN — but only
 * outside the "docker" profile. The superadmin role/account is itself only ever
 * seeded in dev (never by ProdDataSeeder), so this is a second, independent lock:
 * even a JWT carrying ROLE_SUPERADMIN is powerless once this service runs with
 * the docker profile active.
 */
@Component
public class SuperAdminGuard {

    private final boolean bypassAllowedInThisEnvironment;

    public SuperAdminGuard(Environment environment) {
        this.bypassAllowedInThisEnvironment = !environment.acceptsProfiles(Profiles.of("docker"));
    }

    public boolean isSuperAdmin(Authentication auth) {
        if (!bypassAllowedInThisEnvironment) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"));
    }
}
