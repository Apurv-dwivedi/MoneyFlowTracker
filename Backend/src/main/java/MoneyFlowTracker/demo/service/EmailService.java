package MoneyFlowTracker.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendWelcomeEmail(String toEmail, String userName) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom("apurvdwivedi12345@gmail.com");
        message.setTo(toEmail);
        message.setSubject("Welcome to Money Flow Tracker! 🎉");
        message.setText("Hi " + userName + ",\n\n" +
                "Welcome to Money Flow Tracker! Your account has been successfully created.\n" +
                "We are excited to help you manage your finances and achieve your goals.\n\n" +
                "Best Regards,\n" +
                "Money Flow Tracker Team");

        mailSender.send(message);
    }

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();

        // Yahan placeholder hata kar tumhari asli email dal di hai
        message.setFrom("apurvdwivedi12345@gmail.com");
        message.setTo(toEmail);
        message.setSubject("Password Reset OTP - Money Flow Tracker");
        message.setText("Your OTP for password reset is: " + otp + "\n\n" +
                "Please do not share this OTP with anyone.\n" +
                "If you didn't request a password reset, you can safely ignore this email.");

        mailSender.send(message);
    }
    public void sendMonthlyReminder(String toEmail, String userName) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom("apurvdwivedi12345@gmail.com");
        message.setTo(toEmail);
        message.setSubject("📊 Your Monthly Financial Check-in - Money Tracker");
        message.setText("Hi " + userName + ",\n\n" +
                "It's time for your monthly financial check-in! Log in to Money Flow Tracker to review your expenses, check your 50/30/20 budget flow, and track your savings goals.\n\n" +
                "Stay consistent and build your dream!\n\n" +
                "Best Regards,\n" +
                "Money Flow Tracker Team");

        mailSender.send(message);
    }
}