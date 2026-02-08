package com.stockmeister.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String[] locations = {
                "file:./uploads/",
                "file:./backend/uploads/"
        };

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(locations)
                .setCachePeriod(3600);
    }

}