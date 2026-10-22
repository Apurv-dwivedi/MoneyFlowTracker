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
    private EmailService emailService;

    private Map<String, String> otpStorage = new HashMap<>();

    // Naya storage Login OTP ke liye
    private Map<String, String> loginOtpStorage = new HashMap<>();

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists!");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);

        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        } catch (Exception e) {
            System.out.println("Email bhejne me error aaya: " + e.getMessage());
        }

        return ResponseEntity.ok("Account created successfully!");
    }

    // --- STEP 1: Check Password and Send OTP ---
    @PostMapping("/login-step1")
    public ResponseEntity<?> loginStep1(@RequestBody User loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());

        if (userOpt.isPresent() && passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {
            // Generate 6-digit OTP
            String otp = String.format("%06d", new java.util.Random().nextInt(999999));
            loginOtpStorage.put(loginRequest.getEmail(), otp);

            try {
                // Tumhari existing OTP email service use kar li
                emailService.sendOtpEmail(loginRequest.getEmail(), otp);
                return ResponseEntity.ok("OTP Sent");
            } catch (Exception e) {
                System.out.println("Login OTP Email bhejne me error aaya: " + e.getMessage());
                return ResponseEntity.status(500).body("Error sending OTP");
            }
        }
        return ResponseEntity.status(401).body("Invalid email or password");
    }

    // --- STEP 2: Verify OTP and Login ---
    @PostMapping("/login-step2")
    public ResponseEntity<?> loginStep2(@RequestParam String email, @RequestParam String otp) {
        if (loginOtpStorage.containsKey(email) && loginOtpStorage.get(email).equals(otp)) {
            // OTP sahi hai, ab isko delete kar do
            loginOtpStorage.remove(email);

            User user = userRepository.findByEmail(email).get();
            String realToken = jwtUtil.generateToken(user.getEmail());

            Map<String, String> response = new HashMap<>();
            response.put("token", realToken);
            response.put("userId", String.valueOf(user.getId()));
            response.put("name", user.getName());
            response.put("email", user.getEmail());

            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).body("Invalid OTP");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body("User not found!");
        }

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        otpStorage.put(email, otp);

        try {
            emailService.sendOtpEmail(email, otp);
            return ResponseEntity.ok("OTP sent to your email.");
        } catch (Exception e) {
            System.out.println("OTP Email bhejne me error aaya: " + e.getMessage());
            return ResponseEntity.status(500).body("Error sending OTP email");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String email,
                                           @RequestParam String otp,
                                           @RequestParam String newPassword) {
        if (!otpStorage.containsKey(email) || !otpStorage.get(email).equals(otp)) {
            return ResponseEntity.badRequest().body("Invalid OTP!");
        }

        User user = userRepository.findByEmail(email).get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        otpStorage.remove(email);
        return ResponseEntity.ok("Password reset successfully!");
    }
}