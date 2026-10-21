package MoneyFlowTracker.demo.controller;

import MoneyFlowTracker.demo.entity.Category;
import MoneyFlowTracker.demo.entity.User;
import MoneyFlowTracker.demo.repository.CategoryRepository;
import MoneyFlowTracker.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*") // CORS error se bachne ke liye
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. Ek specific user ki saari categories fetch karne ke liye API
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserCategories(@PathVariable Long userId) {
        List<Category> categories = categoryRepository.findByUserId(userId);
        return ResponseEntity.ok(categories);
    }

    // 2. User ke liye nayi custom category add karne ki API
    @PostMapping("/{userId}")
    public ResponseEntity<?> addCategory(@PathVariable Long userId, @RequestBody Category category) {
        Optional<User> userOpt = userRepository.findById(userId);

        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body("User not found!");
        }

        // Category ko current user ke sath link karke save karna
        category.setUser(userOpt.get());
        categoryRepository.save(category);

        return ResponseEntity.ok(category);
    }
    // 3. Custom category delete karne ki API
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long categoryId) {
        if (categoryRepository.existsById(categoryId)) {
            categoryRepository.deleteById(categoryId);
            return ResponseEntity.ok("Category deleted successfully!");
        }
        return ResponseEntity.status(404).body("Category not found!");
    }
}