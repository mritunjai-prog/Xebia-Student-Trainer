package com.xebia.portal.security;

import com.xebia.portal.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Component
public class JwtTokenProvider {
    private final String secret;
    private final long accessMinutes;
    private final long refreshDays;

    public JwtTokenProvider(@Value("${app.jwt.secret}") String secret,
                            @Value("${app.jwt.access-token-minutes}") long accessMinutes,
                            @Value("${app.jwt.refresh-token-days}") long refreshDays) {
        this.secret = secret;
        this.accessMinutes = accessMinutes;
        this.refreshDays = refreshDays;
    }

    public String createAccessToken(User user) {
        return createToken(user, Instant.now().plusSeconds(accessMinutes * 60), "access");
    }

    public String createRefreshToken(User user) {
        return createToken(user, Instant.now().plusSeconds(refreshDays * 24 * 60 * 60), "refresh");
    }

    public TokenClaims parse(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3 || !signature(parts[0] + "." + parts[1]).equals(parts[2])) {
            throw new IllegalArgumentException("Invalid token");
        }
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        String[] fields = payload.split("\\|", -1);
        if (fields.length != 6 || Instant.ofEpochMilli(Long.parseLong(fields[4])).isBefore(Instant.now())) {
            throw new IllegalArgumentException("Expired token");
        }
        return new TokenClaims(UUID.fromString(fields[0]), fields[1], fields[2], fields[3], fields[5]);
    }

    private String createToken(User user, Instant expiresAt, String type) {
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = user.getId() + "|" + user.getEmail() + "|" + user.getRole().name() + "|" + user.getName() + "|" + expiresAt.toEpochMilli() + "|" + type;
        String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String unsigned = header + "." + encodedPayload;
        return unsigned + "." + signature(unsigned);
    }

    private String signature(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign token", ex);
        }
    }

    public record TokenClaims(UUID userId, String email, String role, String name, String type) {
    }
}
