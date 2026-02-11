package com.stockmeister.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "restaurant_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantSettings extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(length = 30)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 5, nullable = false)
    @Builder.Default
    private String currency = "EUR";

    @Column(length = 50, nullable = false)
    @Builder.Default
    private String timezone = "Europe/Vienna";
}
