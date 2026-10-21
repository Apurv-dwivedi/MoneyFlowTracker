package MoneyFlowTracker.demo.controller;

import MoneyFlowTracker.demo.entity.User;
import MoneyFlowTracker.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // CORS Error se bachne ke liye
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // 1. Profile data fetch karne ke liye API
    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Password security ke liye hide kar denge
            user.setPassword(null);
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(404).body("User not found!");
    }

    // 2. Profile update (Photo, Bio, Occupation) karne ke liye API
    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody User updatedProfile) {
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isPresent()) {
            User existingUser = userOpt.get();

            // Jo naya data aaya hai, usko existing user me set kar do
            if (updatedProfile.getOccupation() != null) existingUser.setOccupation(updatedProfile.getOccupation());
            if (updatedProfile.getBio() != null) existingUser.setBio(updatedProfile.getBio());
            if (updatedProfile.getProfileImage() != null) existingUser.setProfileImage(updatedProfile.getProfileImage());

            userRepository.save(existingUser); // Database me save kiya

            existingUser.setPassword(null); // Return karte time password null kar do
            return ResponseEntity.ok(existingUser);
        }
        return ResponseEntity.status(404).body("User not found!");
    }
}