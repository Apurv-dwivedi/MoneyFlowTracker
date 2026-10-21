package MoneyFlowTracker.demo.entity; // Apna package name cross-check kar lena

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonFormat;      // Naya import
import com.fasterxml.jackson.annotation.JsonProperty;    // Naya import

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

    // FIX 1: Spring ko batana ki Date kis format me aayegi
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String type;

    private String category;

    @Column(nullable = false)
    private Double amount;

    private String description;

    // FIX 2: Frontend se JSON me ye field "hidden" naam se aati hai
    @JsonProperty("hidden")
    @Column(name = "is_hidden", columnDefinition = "boolean default false")
    private boolean isHidden;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}