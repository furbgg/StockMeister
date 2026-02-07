package com.stockmeister.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    private String username;
    private String email;
    private String password;
    private String role;
    private String phone;
    private BigDecimal salary;
    private String timings;
    private String address;
}
