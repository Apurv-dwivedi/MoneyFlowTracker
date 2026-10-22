package MoneyFlowTracker.demo.controller; // Apna package name check kar lena

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/status")
    public String checkStatus() {
        return "Bhai, Money Flow Tracker ka Backend Render par ekdum zordaar chal raha hai!";
    }
}