package Spring_Ecomerc.Spring_ecomerc.controller;

import Spring_Ecomerc.Spring_ecomerc.dto.*;
import Spring_Ecomerc.Spring_ecomerc.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginAdmin(request);
        return ResponseEntity.ok(ApiResponse.success("Admin login successful", response));
    }

    @PostMapping("/customer/login")
    public ResponseEntity<ApiResponse<AuthResponse>> customerLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginCustomer(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/customer/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody CustomerRegisterRequest request) {
        AuthResponse response = authService.registerCustomer(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful"));
    }

    @PostMapping("/oauth2/code")
    public ResponseEntity<ApiResponse<AuthResponse>> oauth2CodeLogin(@Valid @RequestBody OAuth2CodeRequest request) {
        AuthResponse response = authService.loginWithOAuth2Code(request);
        return ResponseEntity.ok(ApiResponse.success("OAuth2 login successful", response));
    }
}
