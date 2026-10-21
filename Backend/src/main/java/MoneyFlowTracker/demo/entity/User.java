package MoneyFlowTracker.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String password;

    // Naye Profile Fields:
    private String occupation;
    private String bio;

    @Column(columnDefinition = "LONGTEXT") // Image badi hoti hai, isliye LONGTEXT zaroori hai
    private String profileImage;

    // Yahan Default Constructor, Parameterized Constructor, aur saare Getter/Setter zaroor add karna

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    // Baaki purane getter/setters (id, name, email, password) waise hi rahenge...
    // Password Getters & Setters
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    // Id, Name aur Email ke bhi add kar lo agar nahi hain:
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}