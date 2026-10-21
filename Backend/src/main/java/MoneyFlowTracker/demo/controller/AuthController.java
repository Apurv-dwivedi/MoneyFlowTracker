package MoneyFlowTracker.demo.controller;

import MoneyFlowTracker.demo.entity.User;
import MoneyFlowTracker.demo.repository.UserRepository;
import MoneyFlowTracker.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private MoneyFlowTracker.demo.util.JwtUtil jwtUtil;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService; // Nayi Email Service inject ki

    // OTP save karne ke liye temporary storage
    private Map<String, String> otpStorage = new HashMap<>();

    // 1. Signup API
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists!");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);

        // Naya user save hote hi Welcome Email bhej do
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        } catch (Exception e) {
            System.out.println("Email bhejne me error aaya: " + e.getMessage());
            // Email fail bhi ho jaye toh account create ho jana chahiye
        }

        return ResponseEntity.ok("Account created successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());

        if (userOpt.isPresent() && passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {            User user = userOpt.get();

            String realToken = jwtUtil.generateToken(user.getEmail());

            Map<String, String> response = new HashMap<>();

            // 2. Dummy token ki jagah asli token set kar diya
            response.put("token", realToken);

            response.put("userId", String.valueOf(user.getId()));
            response.put("name", user.getName());
            response.put("email", user.getEmail());

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body("Invalid email or password");
    }

    // 3. Email par OTP bhejne ki API
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body("User not found!");
        }

        // 6-digit random OTP generate karo
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        otpStorage.put(email, otp); // OTP ko memory me save kiya

        try {
            emailService.sendOtpEmail(email, otp);
            return ResponseEntity.ok("OTP sent to your email.");
        } catch (Exception e) {
            System.out.println("OTP Email bhejne me error aaya: " + e.getMessage());
            return ResponseEntity.status(500).body("Error sending OTP email");
        }
    }

    // 4. Naya password save karne ki API
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String email,
                                           @RequestParam String otp,
                                           @RequestParam String newPassword) {
        // Check karo ki OTP sahi hai ya nahi
        if (!otpStorage.containsKey(email) || !otpStorage.get(email).equals(otp)) {
            return ResponseEntity.badRequest().body("Invalid OTP!");
        }

        // User ka naya password DB me update karo
        User user = userRepository.findByEmail(email).get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Reset hone ke baad OTP delete kar do
        otpStorage.remove(email);

        return ResponseEntity.ok("Password reset successfully!");
    }
}