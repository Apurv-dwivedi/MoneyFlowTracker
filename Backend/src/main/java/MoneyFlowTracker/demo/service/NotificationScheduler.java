package MoneyFlowTracker.demo.service;

import MoneyFlowTracker.demo.entity.User;
import MoneyFlowTracker.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationScheduler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    // Testing ke liye: Ye har 1 minute me email bhejega (Taki tum turant test kar sako)
    // Asli app me jab live karoge tab ye use karna -> @Scheduled(cron = "0 0 10 1 * ?") (Har mahine ki 1 tareekh ko subah 10 baje)
//    @Scheduled(fixedRate = 60000)
    @Scheduled(cron = "0 0 10 1 * ?")
    public void sendAutomatedEmails() {
        System.out.println("⏳ Scheduler Started: Sending automated emails...");

        List<User> users = userRepository.findAll();

        for (User user : users) {
            try {
                emailService.sendMonthlyReminder(user.getEmail(), user.getName());
                System.out.println("✅ Sent reminder to: " + user.getEmail());
            } catch (Exception e) {
                System.out.println("❌ Failed to send email to " + user.getEmail());
            }
        }
    }
}