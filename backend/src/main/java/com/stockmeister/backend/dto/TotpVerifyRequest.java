package com.stockmeister.backend.dto;

import lombok.Data;

@Data
public class TotpVerifyRequest {
    private String username;
    private int code;
}
