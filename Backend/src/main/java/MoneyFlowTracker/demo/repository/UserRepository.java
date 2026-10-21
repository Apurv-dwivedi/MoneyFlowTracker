package MoneyFlowTracker.demo.repository;

import MoneyFlowTracker.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA apne aap is method ka SQL query bana lega
    Optional<User> findByEmail(String email);

}