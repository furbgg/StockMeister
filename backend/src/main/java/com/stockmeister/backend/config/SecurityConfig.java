package com.stockmeister.backend.config;

import com.stockmeister.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * 🛡️ SECURITY CONFIGURATION
 * Production-grade security with JWT and RBAC.
 *
 * ROLE PERMISSIONS:
 * ================
 * ADMIN: Full access to EVERYTHING
 * CHEF: Recipes, Ingredients, Low Stock, Waste
 * WAITER: POS only
 * INVENTORY_MANAGER: Ingredients, Stock Count, Waste
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/health/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/ingredients/**")
                        .hasAnyRole("ADMIN", "CHEF", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/ingredients/**")
                        .hasAnyRole("ADMIN", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/ingredients/**")
                        .hasAnyRole("ADMIN", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/ingredients/**")
                        .hasAnyRole("ADMIN", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/ingredients/**")
                        .hasAnyRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/recipes/**")
                        .hasAnyRole("ADMIN", "CHEF", "WAITER")
                        .requestMatchers(HttpMethod.POST, "/api/recipes/*/sell")
                        .hasAnyRole("ADMIN", "CHEF", "WAITER")
                        .requestMatchers(HttpMethod.POST, "/api/recipes/**")
                        .hasAnyRole("ADMIN", "CHEF")
                        .requestMatchers(HttpMethod.PUT, "/api/recipes/**")
                        .hasAnyRole("ADMIN", "CHEF")
                        .requestMatchers(HttpMethod.DELETE, "/api/recipes/**")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/waste/**")
                        .hasAnyRole("ADMIN", "CHEF", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/waste/**")
                        .hasAnyRole("ADMIN", "CHEF", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/waste/**")
                        .hasRole("ADMIN")

                        .requestMatchers("/api/users/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/staff/**")
                        .hasRole("ADMIN")

                        .requestMatchers("/api/finance/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/reports/**")
                        .hasAnyRole("ADMIN", "CHEF")

                        .requestMatchers("/api/pos/**")
                        .hasAnyRole("ADMIN", "WAITER")
                        .requestMatchers("/api/orders/**")
                        .hasAnyRole("ADMIN", "WAITER", "CHEF")

                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        CorsConfiguration apiConfig = new CorsConfiguration();
        apiConfig.setAllowedOriginPatterns(List.of("*"));
        apiConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        apiConfig.setAllowedHeaders(List.of("*"));
        apiConfig.setExposedHeaders(List.of("Authorization"));
        apiConfig.setAllowCredentials(true);
        source.registerCorsConfiguration("/api/**", apiConfig);
        source.registerCorsConfiguration("/**", apiConfig);

        CorsConfiguration uploadsConfig = new CorsConfiguration();
        uploadsConfig.setAllowedOrigins(List.of("*"));
        uploadsConfig.setAllowedMethods(List.of("GET", "HEAD", "OPTIONS"));
        uploadsConfig.setAllowedHeaders(List.of("*"));
        uploadsConfig.setAllowCredentials(false);
        source.registerCorsConfiguration("/uploads/**", uploadsConfig);

        return source;
    }
}
