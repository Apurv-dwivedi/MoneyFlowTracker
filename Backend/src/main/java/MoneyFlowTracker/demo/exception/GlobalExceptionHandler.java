package MoneyFlowTracker.demo.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    // 1. Duplicate Email ya Database Constraint error pakadne ke liye
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDatabaseExceptions(DataIntegrityViolationException ex) {
        // Agar pehle se maujud email se koi naya account banayega toh ye cleanly block karega
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: Email pehle se registered hai!");
    }

    // 2. Security / Token Errors ya koi bhi anjaan error pakadne ke liye
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralExceptions(Exception ex) {
        // Server ko crash hone se bachayega aur clean message dega
        System.out.println("🚨 Backend Error Aaya: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server Error: Kuch internal gadbad hai.");
    }
}