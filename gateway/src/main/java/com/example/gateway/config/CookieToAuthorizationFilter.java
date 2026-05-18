package com.example.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Extracts the httpOnly auth_token cookie and injects it as an Authorization
 * Bearer header so downstream services can remain unaware of cookies.
 * Only applied when no Authorization header is already present.
 */
@Component
public class CookieToAuthorizationFilter implements GlobalFilter, Ordered {

    private static final String COOKIE_NAME = "auth_token";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        if (request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            return chain.filter(exchange);
        }

        HttpCookie cookie = request.getCookies().getFirst(COOKIE_NAME);
        if (cookie == null || cookie.getValue().isBlank()) {
            return chain.filter(exchange);
        }

        ServerHttpRequest mutated = request.mutate()
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + cookie.getValue())
                .build();
        return chain.filter(exchange.mutate().request(mutated).build());
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
