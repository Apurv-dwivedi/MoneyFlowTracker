package MoneyFlowTracker.demo.entity; // Apna package name cross-check kar lena

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    // Spring ko batana ki Date kis format me aayegi
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String type;

    private String category;

    // FIX (Audit BUG-02 & BUG-03): Negative amounts aur lambe decimals block karna
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Amount must be strictly positive")
    @Digits(integer = 10, fraction = 2, message = "Amount format is invalid (max 2 decimal places)")
    @Column(nullable = false)
    private BigDecimal amount;

    private String description;

    // Frontend se JSON me ye field "hidden" naam se aati hai
    @JsonProperty("hidden")
    @Column(name = "is_hidden", columnDefinition = "boolean default false")
    private boolean isHidden;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}