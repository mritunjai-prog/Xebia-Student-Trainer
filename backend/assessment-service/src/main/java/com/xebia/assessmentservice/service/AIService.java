package com.xebia.assessmentservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIService {

    @Value("${groq.api.key}")
    private String apiKey;
    
    @Value("${groq.api.url}")
    private String apiUrl;

    public String generateAssessmentDescription(String topic) {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", "Generate a professional assessment description and instructions for a test on: " + topic);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.7);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
                    return (String) msg.get("content");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "AI Generation Failed.";
    }

    @org.springframework.scheduling.annotation.Async
    public void evaluateSubmissionAsync(String submissionId, String assessmentId) {
        // Here we could implement the full AI semantic matching logic
        // For demonstration, we simulate fetching the submission and calling the LLM
        // In a real scenario, we would inject SubmissionRepository and AssessmentRepository here
        System.out.println("Async AI evaluation started for submission: " + submissionId);
        
        // Simulating some processing time
        try {
            Thread.sleep(2000); // 2 seconds
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Actual implementation would:
        // 1. Fetch submission and assessment
        // 2. Iterate through AI tagged answers
        // 3. Build prompt with student answer, correctAnswer, and aiRubric
        // 4. Request scoring from Groq API
        // 5. Parse response for points and feedback
        // 6. Update Answer records (isGraded=true, earnedPoints, feedback)
        // 7. Recalculate aiScore and finalScore on Submission
        // 8. If all manual/AI questions are graded, set isEvaluated=true
        // 9. Save submission
        
        System.out.println("Async AI evaluation completed for submission: " + submissionId);
    }
}
