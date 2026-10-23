package MoneyFlowTracker.demo.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.format.DateTimeParseException;

@ControllerAdvice
public class GlobalExceptionHandler {

    // 1. Duplicate Email ya Database Constraint error pakadne ke liye
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDatabaseExceptions(DataIntegrityViolationException ex) {
        // Agar pehle se maujud email se koi naya account banayega toh ye cleanly block karega
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: Email pehle se registered hai!");
    }

    // 2. Audit BUG-08: Malformed dates aur galat JSON format pakadne ke liye
    @ExceptionHandler({HttpMessageNotReadableException.class, DateTimeParseException.class})
    public ResponseEntity<String> handleBadInputFormat() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid input data format. Check date structure (YYYY-MM-DD) and number values.");
    }

    // 3. Audit BUG-02 & BUG-03: Validation failures (jaise negative numbers) pakadne ke liye
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Data validation failed: Please ensure the amount is strictly positive and up to 2 decimal places.");
    }

    // 4. Security / Token Errors ya koi bhi anjaan error pakadne ke liye
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralExceptions(Exception ex) {
        // Server ko crash hone se bachayega aur clean message dega
        System.out.println("🚨 Backend Error Aaya: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server Error: Kuch internal gadbad hai.");
    }
}