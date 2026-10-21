package MoneyFlowTracker.demo.controller;

import MoneyFlowTracker.demo.dto.AuthRequest;
import MoneyFlowTracker.demo.entity.User;
import MoneyFlowTracker.demo.repository.UserRepository;
import MoneyFlowTracker.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Frontend se access allow karne ke liye
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // 1. SIGNUP API - Naya account banane ke liye
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody AuthRequest request) {
        // Check karo ki email pehle se exist toh nahi karti
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Email is already registered!");
        }

        // Naya User banao aur password ko encrypt (hash) karke save karo
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    // 2. LOGIN API - Email/Password check karke Token dene ke liye
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // User ka enter kiya hua password aur DB ka encrypted password match karo
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {

                // Agar password sahi hai, toh naya JWT token generate karo
                String token = jwtUtil.generateToken(user.getEmail());

                // Frontend ko token aur basic user detail bhej do
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("userId", user.getId());
                response.put("email", user.getEmail());
                response.put("name", user.getName());

                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(401).body("Error: Invalid email or password!");
    }
}