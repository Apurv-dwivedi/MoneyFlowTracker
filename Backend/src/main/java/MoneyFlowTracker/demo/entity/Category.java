package MoneyFlowTracker.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type; // "income" ya "expense"

    // Ek user ki bahut saari categories ho sakti hain
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Category() {}

    public Category(String name, String type, User user) {
        this.name = name;
        this.type = type;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}