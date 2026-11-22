package MoneyFlowTracker.demo.service;

import MoneyFlowTracker.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class DatabaseKeepAliveService {

    @Autowired
    private UserRepository userRepository;

    @Value("${app.keepalive.url:https://moneyflowtracker.onrender.com/api/status}")
    private String keepAliveUrl;

    // Har 5 minute (300,000 ms) me execute hoga
    @Scheduled(fixedRate = 300000, initialDelay = 10000)
    public void keepDatabaseAndServerAlive() {
        System.out.println("⏳ [KeepAlive] 5-minute keep-alive ping triggered...");

        // 1. Direct database query to keep MySQL connection active
        try {
            long userCount = userRepository.count();
            System.out.println("✅ [KeepAlive] Database ping successful! Registered users count: " + userCount);
        } catch (Exception e) {
            System.err.println("❌ [KeepAlive] Database ping failed: " + e.getMessage());
        }

        // 2. HTTP ping to Render to prevent web service sleeping
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(keepAliveUrl))
                    .GET()
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("✅ [KeepAlive] HTTP ping sent to " + keepAliveUrl + " | Response Code: " + response.statusCode());
        } catch (Exception e) {
            System.out.println("ℹ️ [KeepAlive] HTTP ping notice: " + e.getMessage());
        }
    }
}
