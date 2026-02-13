package com.stockmeister.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(length = 20)
    private String phone;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal salary;

    @Column(length = 50)
    private String timings;

    @Column(length = 255)
    private String address;

    @Column(name = "totp_secret")
    private String totpSecret;

    @Column(name = "two_factor_enabled")
    @Builder.Default
    private boolean twoFactorEnabled = false;
}