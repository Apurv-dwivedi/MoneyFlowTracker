package MoneyFlowTracker.demo.controller;

import MoneyFlowTracker.demo.entity.Transaction;
import MoneyFlowTracker.demo.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*") // Ye CORS error ko completely block karega
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    // 1. Asli fix yahan hai: User-specific data lane ki API
    @GetMapping("/user/{userId}")
    public List<Transaction> getUserTransactions(@PathVariable String userId) {
        return transactionRepository.findByUserId(userId);
    }

    // 2. Transaction Add karna
    @PostMapping
    public Transaction addTransaction(@RequestBody Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    // 3. Vault me Hide karna
    @PutMapping("/{id}/hide")
    public Transaction hideTransaction(@PathVariable Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found!"));
        transaction.setHidden(true);
        return transactionRepository.save(transaction);
    }

    // 4. Vault se Unhide karna
    @PutMapping("/{id}/unhide")
    public Transaction unhideTransaction(@PathVariable Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found!"));
        transaction.setHidden(false);
        return transactionRepository.save(transaction);
    }

    // 5. Delete karna
    @DeleteMapping("/{id}")
    public void deleteTransaction(@PathVariable Long id) {
        transactionRepository.deleteById(id);
    }
}