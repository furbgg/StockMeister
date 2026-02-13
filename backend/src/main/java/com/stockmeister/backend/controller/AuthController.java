package com.stockmeister.backend.controller;

import com.stockmeister.backend.dto.ChangePasswordRequest;
import com.stockmeister.backend.dto.LoginRequest;
import com.stockmeister.backend.dto.LoginResponse;
import com.stockmeister.backend.dto.TotpVerifyRequest;
import com.stockmeister.backend.model.User;
import com.stockmeister.backend.repository.UserRepository;
import com.stockmeister.backend.security.JwtUtil;
import com.stockmeister.backend.service.TotpService;
import com.stockmeister.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 🔐 AUTH CONTROLLER
 * Handles user authentication and JWT token generation.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final TotpService totpService;


    /**
     * POST /api/auth/login
     * Authenticates user and returns JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        log.info("Login attempt for user: {}", loginRequest.getUsername());

        try {

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.isTwoFactorEnabled() && user.getTotpSecret() != null) {
                log.info("2FA required for user: {}", user.getUsername());
                return ResponseEntity.ok(Map.of(
                        "twoFactorRequired", true,
                        "username", user.getUsername()));
            }

            String role = user.getRole().name();
            String token = jwtUtil.generateToken(user.getUsername(), role);

            log.info("Login successful for user: {} with role: {}", user.getUsername(), role);

            return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), role));

        } catch (Exception e) {
            log.error("Login failed for user {}: {}", loginRequest.getUsername(), e.getMessage());
            return ResponseEntity.status(401).body("Login failed: " + e.getMessage());
        }
    }

    /**
     * POST /api/auth/validate
     * Validates a JWT token and returns user info.
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Invalid token format");
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(401).body("Token expired or invalid");
            }

            String username = jwtUtil.extractUsername(token);
            String role = jwtUtil.extractRole(token);

            return ResponseEntity.ok(new LoginResponse(token, username, role));

        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage());
            return ResponseEntity.status(401).body("Token validation failed");
        }
    }

    /**
     * GET /api/auth/me
     * Returns current authenticated user info.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);
            String role = jwtUtil.extractRole(token);

            return ResponseEntity.ok(new LoginResponse(token, username, role));

        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid token");
        }
    }

    /**
     * GET /api/auth/2fa/status
     * Returns the 2FA status for the authenticated user.
     */
    @GetMapping("/2fa/status")
    public ResponseEntity<?> get2FAStatus(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(Map.of("enabled", user.isTwoFactorEnabled()));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to get 2FA status"));
        }
    }

    /**
     * POST /api/auth/2fa/setup
     * Generates TOTP secret and QR code URL. Does NOT enable 2FA yet.
     */
    @PostMapping("/2fa/setup")
    public ResponseEntity<?> setup2FA(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String secret = totpService.generateSecret();
            String qrUrl = totpService.getQrCodeUrl(secret, username);

            user.setTotpSecret(secret);
            userRepository.save(user);

            log.info("2FA setup initiated for user: {}", username);

            return ResponseEntity.ok(Map.of(
                    "secret", secret,
                    "qrUrl", qrUrl));

        } catch (Exception e) {
            log.error("2FA setup failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "2FA setup failed"));
        }
    }

    /**
     * POST /api/auth/2fa/confirm-setup
     * Verifies the TOTP code and enables 2FA for the user.
     */
    @PostMapping("/2fa/confirm-setup")
    public ResponseEntity<?> confirmSetup2FA(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody TotpVerifyRequest request) {
        try {
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getTotpSecret() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "2FA setup not initiated"));
            }

            if (!totpService.verifyCode(user.getTotpSecret(), request.getCode())) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid code"));
            }

            user.setTwoFactorEnabled(true);
            userRepository.save(user);

            log.info("2FA enabled for user: {}", username);

            return ResponseEntity.ok(Map.of("message", "2FA enabled successfully"));

        } catch (Exception e) {
            log.error("2FA confirm failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "2FA confirmation failed"));
        }
    }

    /**
     * POST /api/auth/2fa/disable
     * Disables 2FA for the authenticated user.
     */
    @PostMapping("/2fa/disable")
    public ResponseEntity<?> disable2FA(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setTwoFactorEnabled(false);
            user.setTotpSecret(null);
            userRepository.save(user);

            log.info("2FA disabled for user: {}", username);

            return ResponseEntity.ok(Map.of("message", "2FA disabled successfully"));

        } catch (Exception e) {
            log.error("2FA disable failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Failed to disable 2FA"));
        }
    }

    /**
     * POST /api/auth/2fa/verify
     * Verifies TOTP code during login and returns JWT token.
     */
    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verify2FA(@RequestBody TotpVerifyRequest request) {
        try {
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!totpService.verifyCode(user.getTotpSecret(), request.getCode())) {
                log.warn("Invalid 2FA code for user: {}", request.getUsername());
                return ResponseEntity.status(401).body(Map.of("message", "Invalid 2FA code"));
            }

            String role = user.getRole().name();
            String jwtToken = jwtUtil.generateToken(user.getUsername(), role);

            log.info("2FA verified for user: {}", user.getUsername());

            return ResponseEntity.ok(new LoginResponse(jwtToken, user.getUsername(), role));

        } catch (Exception e) {
            log.error("2FA verification failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", "2FA verification failed"));
        }
    }

    /**
     * PUT /api/auth/change-password
     * Changes the password for the authenticated user.
     */
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChangePasswordRequest request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(401).body(Map.of("message", "Token expired or invalid"));
            }

            String username = jwtUtil.extractUsername(token);

            log.info("Password change request for user: {}", username);

            userService.changePassword(username, request.getCurrentPassword(), request.getNewPassword());

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));

        } catch (RuntimeException e) {
            log.error("Password change failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Password change error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "An error occurred while changing password"));
        }
    }
}
