package MoneyFlowTracker.demo.repository;

import MoneyFlowTracker.demo.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // User ki ID se uski saari categories fetch karne ke liye
    List<Category> findByUserId(Long userId);

}