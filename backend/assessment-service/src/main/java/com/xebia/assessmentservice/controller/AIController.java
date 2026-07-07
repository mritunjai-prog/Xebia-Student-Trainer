package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/assessments/ai")
@CrossOrigin(origins = "*")
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/generate-description")
    public Map<String, String> generateDescription(@RequestBody Map<String, String> request) {
        String topic = request.get("topic");
        String result = aiService.generateAssessmentDescription(topic);
        return Map.of("content", result);
    }
}
