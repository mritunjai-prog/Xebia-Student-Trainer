package com.xebia.assessmentservice.service;

import com.xebia.assessmentservice.model.Answer;
import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.model.Question;
import com.xebia.assessmentservice.model.Submission;
import com.xebia.assessmentservice.repository.AssessmentRepository;
import com.xebia.assessmentservice.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Service
public class SubmissionService {
    @Autowired
    private SubmissionRepository submissionRepository;
    
    @Autowired
    private AssessmentRepository assessmentRepository;
    
    @Autowired
    private AIService aiService;

    @Autowired
    private com.xebia.assessmentservice.repository.CertificateRepository certificateRepository;

    public List<Submission> getAllSubmissions() {
        return submissionRepository.findAll();
    }
    
    public List<Submission> getSubmissionsByStudent(String studentId) {
        return submissionRepository.findByStudentId(studentId);
    }
    
    public Submission getSubmissionByIdMasked(String id, String role) {
        Optional<Submission> opt = submissionRepository.findById(id);
        if (opt.isEmpty()) return null;
        
        Submission submission = opt.get();
        if ("student".equalsIgnoreCase(role)) {
            Optional<Assessment> assessmentOpt = assessmentRepository.findById(submission.getAssessmentId());
            if (assessmentOpt.isPresent()) {
                Assessment assessment = assessmentOpt.get();
                if ("MANUAL_RELEASE_BY_TRAINER".equals(assessment.getScoreReleasePolicy())) {
                    // Masking scores and points
                    submission.setAutoScore(null);
                    submission.setAiScore(null);
                    submission.setManualScore(null);
                    submission.setFinalScore(null);
                    submission.setPercentage(null);
                    submission.setScore(null);
                    
                    if (submission.getAnswers() != null) {
                        for (Answer answer : submission.getAnswers()) {
                            answer.setEarnedPoints(null);
                            answer.setFeedback(null);
                        }
                    }
                }
            }
        }
        return submission;
    }

    public Submission createSubmission(Submission submission) {
        boolean hasAiQuestions = false;
        Assessment assessment = null;
        
        if ("submitted".equals(submission.getStatus())) {
            Optional<Assessment> assessmentOpt = assessmentRepository.findById(submission.getAssessmentId());
            if (assessmentOpt.isPresent()) {
                assessment = assessmentOpt.get();
                hasAiQuestions = evaluateSubmission(submission, assessment);
            }
        }
        
        Submission savedSubmission = submissionRepository.save(submission);
        
        if (assessment != null) {
            checkAndGenerateCertificate(savedSubmission, assessment);
        }
        
        if (hasAiQuestions && assessment != null) {
            aiService.evaluateSubmissionAsync(savedSubmission.getId(), assessment.getId());
        }
        
        return savedSubmission;
    }
    
    private boolean evaluateSubmission(Submission submission, Assessment assessment) {
        double autoScore = 0.0;
        boolean hasAiQuestions = false;
        boolean hasManualQuestions = false;
        
        if (submission.getAnswers() != null && assessment.getQuestions() != null) {
            for (Answer answer : submission.getAnswers()) {
                Question question = assessment.getQuestions().stream()
                        .filter(q -> q.getId().equals(answer.getQuestionId()))
                        .findFirst()
                        .orElse(null);
                        
                if (question == null) continue;
                
                String evalType = question.getEvaluationType();
                if (evalType == null) {
                    evalType = "AUTO";
                }
                
                if ("AUTO".equals(evalType)) {
                    double points = evaluateAuto(question, answer.getAnswer());
                    answer.setIsGraded(true);
                    answer.setEarnedPoints(points);
                    autoScore += points;
                } else if ("AI".equals(evalType)) {
                    answer.setIsGraded(false);
                    answer.setEarnedPoints(0.0);
                    hasAiQuestions = true;
                } else if ("MANUAL".equals(evalType)) {
                    answer.setIsGraded(false);
                    answer.setEarnedPoints(0.0);
                    hasManualQuestions = true;
                }
            }
        }
        
        submission.setAutoScore(autoScore);
        submission.setAiScore(0.0);
        submission.setManualScore(0.0);
        submission.setFinalScore(autoScore);
        
        if (assessment.getMarks() != null && assessment.getMarks() > 0) {
            submission.setPercentage((int) Math.round((autoScore / assessment.getMarks()) * 100));
        } else {
            submission.setPercentage(0);
        }
        
        // If there are no AI or Manual questions, it's fully evaluated
        if (!hasAiQuestions && !hasManualQuestions) {
            submission.setIsEvaluated(true);
            submission.setStatus("GRADED");
        } else {
            submission.setIsEvaluated(false);
        }
        
        return hasAiQuestions;
    }
    
    private void checkAndGenerateCertificate(Submission submission, Assessment assessment) {
        if (Boolean.TRUE.equals(assessment.getIsCertificateEnabled()) && "GRADED".equals(submission.getStatus()) && submission.getFinalScore() != null) {
            double maxMarks = assessment.getMarks() != null ? assessment.getMarks() : 0.0;
            double percentage = maxMarks > 0 ? (submission.getFinalScore() / maxMarks) * 100 : 0;
            
            double threshold = assessment.getCertificateThreshold() != null ? assessment.getCertificateThreshold() : 60.0;
            
            if (percentage >= threshold) {
                if (!certificateRepository.existsBySubmissionId(submission.getId())) {
                    com.xebia.assessmentservice.model.Certificate cert = new com.xebia.assessmentservice.model.Certificate();
                    cert.setCertificateUuid(java.util.UUID.randomUUID().toString());
                    
                    String assessIdStr = assessment.getId().length() > 5 ? assessment.getId().substring(0, 5).toUpperCase() : assessment.getId().toUpperCase();
                    String hash = submission.getId().length() > 4 ? submission.getId().substring(submission.getId().length() - 4).toUpperCase() : submission.getId().toUpperCase();
                    String dateStr = LocalDateTime.now().toLocalDate().toString();
                    
                    cert.setSerialNumber("XEB-" + assessIdStr + "-" + dateStr + "-" + hash);
                    cert.setUserId(submission.getStudentId());
                    cert.setAssessmentId(assessment.getId());
                    cert.setSubmissionId(submission.getId());
                    cert.setIssuedAt(LocalDateTime.now());
                    cert.setFinalScore(percentage);
                    cert.setStatus(com.xebia.assessmentservice.model.CertificateStatus.ACTIVE);
                    
                    certificateRepository.save(cert);
                }
            }
        }
    }
    
    private double evaluateAuto(Question question, String studentAnswer) {
        if (studentAnswer == null || question.getCorrectAnswer() == null) return 0.0;
        
        String correct = question.getCorrectAnswer().trim().toLowerCase();
        String student = studentAnswer.trim().toLowerCase();
        
        if (correct.equals(student)) {
            return question.getMarks() != null ? question.getMarks().doubleValue() : 0.0;
        }
        
        return 0.0;
    }
}
