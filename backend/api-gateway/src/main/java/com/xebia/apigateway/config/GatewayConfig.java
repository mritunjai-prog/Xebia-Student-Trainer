package com.xebia.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.cloud.gateway.server.mvc.predicate.GatewayRequestPredicates.path;

@Configuration
public class GatewayConfig {

    @Bean
    public RouterFunction<ServerResponse> gatewayRouter() {
        return route("user-service")
                .route(path("/api/v1/users"), http(java.net.URI.create("http://127.0.0.1:8081")))
                .route(path("/api/v1/users/**"), http(java.net.URI.create("http://127.0.0.1:8081")))
                .build()
                .and(route("batch-service")
                        .route(path("/api/v1/batches"), http(java.net.URI.create("http://127.0.0.1:8082")))
                        .route(path("/api/v1/batches/**"), http(java.net.URI.create("http://127.0.0.1:8082")))
                        .build())
                .and(route("assessment-service")
                        .route(path("/api/v1/assessments"), http(java.net.URI.create("http://127.0.0.1:8083")))
                        .route(path("/api/v1/assessments/**"), http(java.net.URI.create("http://127.0.0.1:8083")))
                        .route(path("/api/v1/questions"), http(java.net.URI.create("http://127.0.0.1:8083")))
                        .route(path("/api/v1/questions/**"), http(java.net.URI.create("http://127.0.0.1:8083")))
                        .route(path("/api/v1/submissions"), http(java.net.URI.create("http://127.0.0.1:8083")))
                        .route(path("/api/v1/submissions/**"), http(java.net.URI.create("http://127.0.0.1:8083")))
                        .route(path("/api/v1/certificates"), http(java.net.URI.create("http://127.0.0.1:8083")))
                        .route(path("/api/v1/certificates/**"), http(java.net.URI.create("http://127.0.0.1:8083")))
                        .build());
    }
}
