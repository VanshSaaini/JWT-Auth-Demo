package com.example.demo.controller;

import com.example.demo.security.CustomUserDetails;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/profile")
    public Map<String, Object> profile(@AuthenticationPrincipal CustomUserDetails user) {

        return Map.of(
                "message", "You accessed a protected endpoint",
                "username", user.getUsername(),
                "role", user.getAuthorities()
                        .iterator()
                        .next()
                        .getAuthority()
        );
    }
}