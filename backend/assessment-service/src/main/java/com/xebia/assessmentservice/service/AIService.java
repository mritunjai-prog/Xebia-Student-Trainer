package com.xebia.assessmentservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.xebia.assessmentservice.repository.SubmissionRepository;
import com.xebia.assessmentservice.repository.AssessmentRepository;
import com.xebia.assessmentservice.model.Submission;
import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.model.Answer;
import com.xebia.assessmentservice.model.Question;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class AIService {

    @Autowired
    private SubmissionRepository submissionRepository;
    
    @Autowired
    private AssessmentRepository assessmentRepository;
    
    @Autowired
    @org.springframework.context.annotation.Lazy
    private CertificateService certificateService;

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
        System.out.println("Async AI evaluation started for submission: " + submissionId);
        
        try {
            Thread.sleep(2000); // simulate delay
            
            Optional<Submission> subOpt = submissionRepository.findById(submissionId);
            Optional<Assessment> assOpt = assessmentRepository.findById(assessmentId);
            
            if (subOpt.isPresent() && assOpt.isPresent()) {
                Submission submission = subOpt.get();
                Assessment assessment = assOpt.get();
                
                double aiScore = 0.0;
                boolean allGraded = true;
                
                if (submission.getAnswers() != null && assessment.getQuestions() != null) {
                    for (Answer answer : submission.getAnswers()) {
                        Question question = assessment.getQuestions().stream()
                                .filter(q -> q.getId().equals(answer.getQuestionId()))
                                .findFirst()
                                .orElse(null);
                        
                        if (question == null) continue;
                        
                        if ("AI".equals(question.getEvaluationType()) && !Boolean.TRUE.equals(answer.getIsGraded())) {
                            // Dummy AI Scoring for now (full marks)
                            double marks = question.getMarks() != null ? question.getMarks().doubleValue() : 0.0;
                            answer.setEarnedPoints(marks);
                            answer.setIsGraded(true);
                            answer.setFeedback("AI Evaluation completed: Good response.");
                            aiScore += marks;
                        } else if ("MANUAL".equals(question.getEvaluationType()) && !Boolean.TRUE.equals(answer.getIsGraded())) {
                            allGraded = false;
                        } else if (!Boolean.TRUE.equals(answer.getIsGraded())) {
                            allGraded = false;
                        }
                    }
                }
                
                submission.setAiScore(submission.getAiScore() != null ? submission.getAiScore() + aiScore : aiScore);
                double totalScore = (submission.getAutoScore() != null ? submission.getAutoScore() : 0.0)
                                  + (submission.getAiScore() != null ? submission.getAiScore() : 0.0)
                                  + (submission.getManualScore() != null ? submission.getManualScore() : 0.0);
                
                submission.setFinalScore(totalScore);
                
                if (assessment.getMarks() != null && assessment.getMarks() > 0) {
                    submission.setPercentage((int) Math.round((totalScore / assessment.getMarks()) * 100));
                } else {
                    submission.setPercentage(0);
                }
                
                if (allGraded) {
                    submission.setIsEvaluated(true);
                }
                
                Submission savedSub = submissionRepository.save(submission);
                
                if (Boolean.TRUE.equals(savedSub.getIsEvaluated())) {
                    if (assessment.getCertificateEnabled() == null || assessment.getCertificateEnabled()) {
                        certificateService.generateCertificate(savedSub, assessment);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        System.out.println("Async AI evaluation completed for submission: " + submissionId);
    }
}
