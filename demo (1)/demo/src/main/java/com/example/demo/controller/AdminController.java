package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/dashboard")
    public Map<String, String> dashboard() {

        return Map.of(
                "message",
                "Welcome to the admin dashboard"
        );
    }
}