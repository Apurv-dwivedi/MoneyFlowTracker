package MoneyFlowTracker.demo.controller;

import MoneyFlowTracker.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkStatus() {
        boolean dbActive = false;
        long totalUsers = 0;

        try {
            totalUsers = userRepository.count();
            dbActive = true;
        } catch (Exception e) {
            System.err.println("DB query error in /api/status: " + e.getMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("databaseConnected", dbActive);
        response.put("totalUsers", totalUsers);
        response.put("message", "Money Flow Tracker Backend and Database are active!");
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }
}
