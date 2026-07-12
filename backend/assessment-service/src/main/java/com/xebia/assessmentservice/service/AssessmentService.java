package com.xebia.assessmentservice.service;

import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.model.AssessmentHistory;
import com.xebia.assessmentservice.repository.AssessmentHistoryRepository;
import com.xebia.assessmentservice.repository.AssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssessmentService {
    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentHistoryRepository assessmentHistoryRepository;

    public List<Assessment> getAllAssessments() {
        return assessmentRepository.findAll();
    }

    private void sanitizeQuestionIds(Assessment assessment) {
        if (assessment.getQuestions() != null) {
            for (com.xebia.assessmentservice.model.Question q : assessment.getQuestions()) {
                if (q.getId() != null) {
                    try {
                        java.util.UUID.fromString(q.getId());
                    } catch (IllegalArgumentException e) {
                        q.setId(null);
                    }
                }
            }
        }
    }

    private void validateStateTransition(Assessment assessment) {
        if (com.xebia.assessmentservice.model.AssessmentStatus.PUBLISHED.equals(assessment.getStatus())) {
            if (assessment.getQuestions() == null || assessment.getQuestions().isEmpty()) {
                throw new IllegalStateException("Cannot publish an assessment without questions.");
            }
            if (assessment.getBatches() == null || assessment.getBatches().isEmpty()) {
                throw new IllegalStateException("Cannot publish an assessment without allocating to at least one batch.");
            }
        }
    }

    public Assessment createAssessment(Assessment assessment) {
        sanitizeQuestionIds(assessment);
        validateStateTransition(assessment);
        return assessmentRepository.save(assessment);
    }

    public Assessment updateAssessment(String id, Assessment updated) {
        java.util.Optional<Assessment> existingOpt = assessmentRepository.findById(id);
        if (existingOpt.isPresent()) {
            Assessment existing = existingOpt.get();

            // Create edit history snapshot of existing state before editing
            try {
                AssessmentHistory history = new AssessmentHistory();
                history.setAssessmentId(existing.getId());
                history.setTitle(existing.getTitle());
                history.setDescription(existing.getDescription());
                history.setTopic(existing.getTopic());
                history.setDifficulty(existing.getDifficulty());
                history.setMarks(existing.getMarks());
                history.setDuration(existing.getDuration());
                history.setLastModifiedBy(existing.getLastModifiedBy() != null ? existing.getLastModifiedBy() : "Trainer");
                history.setModificationReason(existing.getModificationReason() != null ? existing.getModificationReason() : "Initial Configuration");
                history.setModifiedAt(java.time.LocalDateTime.now());

                int currentVersion = assessmentHistoryRepository.findByAssessmentId(existing.getId()).size() + 1;
                history.setVersion(currentVersion);
                assessmentHistoryRepository.save(history);
            } catch (Exception e) {
                System.err.println("Failed to write assessment history log: " + e.getMessage());
            }

            // Now apply updates
            if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            if (updated.getInstructions() != null) existing.setInstructions(updated.getInstructions());
            if (updated.getDifficulty() != null) existing.setDifficulty(updated.getDifficulty());
            if (updated.getMarks() != null) existing.setMarks(updated.getMarks());
            if (updated.getPassingMarks() != null) existing.setPassingMarks(updated.getPassingMarks());
            if (updated.getDuration() != null) existing.setDuration(updated.getDuration());
            if (updated.getStartDate() != null) existing.setStartDate(updated.getStartDate());
            if (updated.getStartTime() != null) existing.setStartTime(updated.getStartTime());
            if (updated.getEndDate() != null) existing.setEndDate(updated.getEndDate());
            if (updated.getEndTime() != null) existing.setEndTime(updated.getEndTime());
            if (updated.getAttemptsAllowed() != null) existing.setAttemptsAllowed(updated.getAttemptsAllowed());
            if (updated.getAutoGrade() != null) existing.setAutoGrade(updated.getAutoGrade());
            if (updated.getManualGrade() != null) existing.setManualGrade(updated.getManualGrade());
            if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
            if (updated.getType() != null) existing.setType(updated.getType());
            if (updated.getTopic() != null) existing.setTopic(updated.getTopic());
            if (updated.getCourse() != null) existing.setCourse(updated.getCourse());
            if (updated.getSubject() != null) existing.setSubject(updated.getSubject());
            if (updated.getShuffleQuestions() != null) existing.setShuffleQuestions(updated.getShuffleQuestions());
            if (updated.getRandomizeOptions() != null) existing.setRandomizeOptions(updated.getRandomizeOptions());
            if (updated.getNegativeMarking() != null) existing.setNegativeMarking(updated.getNegativeMarking());
            if (updated.getNegativeMarksValue() != null) existing.setNegativeMarksValue(updated.getNegativeMarksValue());
            if (updated.getAutoSubmit() != null) existing.setAutoSubmit(updated.getAutoSubmit());
            if (updated.getCertificateEnabled() != null) existing.setCertificateEnabled(updated.getCertificateEnabled());
            if (updated.getCertificateTemplate() != null) existing.setCertificateTemplate(updated.getCertificateTemplate());
            if (updated.getCertificateTitle() != null) existing.setCertificateTitle(updated.getCertificateTitle());
            if (updated.getCertificateSignatory() != null) existing.setCertificateSignatory(updated.getCertificateSignatory());
            if (updated.getCertificateSignatoryTitle() != null) existing.setCertificateSignatoryTitle(updated.getCertificateSignatoryTitle());
            if (updated.getCertificateCorporateLine() != null) existing.setCertificateCorporateLine(updated.getCertificateCorporateLine());
            if (updated.getCertificateCustomBg() != null) existing.setCertificateCustomBg(updated.getCertificateCustomBg());
            if (updated.getCertificateTitleColor() != null) existing.setCertificateTitleColor(updated.getCertificateTitleColor());
            if (updated.getCertificateNameColor() != null) existing.setCertificateNameColor(updated.getCertificateNameColor());
            if (updated.getCertificateBorderColor() != null) existing.setCertificateBorderColor(updated.getCertificateBorderColor());
            if (updated.getCertificateSealColor() != null) existing.setCertificateSealColor(updated.getCertificateSealColor());
            if (updated.getCertificateSealText() != null) existing.setCertificateSealText(updated.getCertificateSealText());
            if (updated.getLastModifiedBy() != null) existing.setLastModifiedBy(updated.getLastModifiedBy());
            if (updated.getModificationReason() != null) existing.setModificationReason(updated.getModificationReason());
            if (updated.getBatches() != null) {
                if (existing.getBatches() != null) {
                    existing.getBatches().clear();
                    existing.getBatches().addAll(updated.getBatches());
                } else {
                    existing.setBatches(updated.getBatches());
                }
            }
            if (updated.getQuestions() != null) {
                if (existing.getQuestions() != null) {
                    existing.getQuestions().clear();
                    existing.getQuestions().addAll(updated.getQuestions());
                } else {
                    existing.setQuestions(updated.getQuestions());
                }
            }
            sanitizeQuestionIds(existing);
            validateStateTransition(existing);
            return assessmentRepository.save(existing);
        }
        sanitizeQuestionIds(updated);
        validateStateTransition(updated);
        return assessmentRepository.save(updated);
    }

    public List<AssessmentHistory> getAssessmentHistory(String id) {
        return assessmentHistoryRepository.findByAssessmentIdOrderByVersionDesc(id);
    }

    @org.springframework.transaction.annotation.Transactional
    public Assessment allocateAssessment(String id, List<String> batches, String course) {
        java.util.Optional<Assessment> existingOpt = assessmentRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new IllegalArgumentException("Assessment not found");
        }
        Assessment assessment = existingOpt.get();
        if (batches == null || batches.isEmpty()) {
            throw new IllegalArgumentException("At least one batch must be provided for allocation");
        }
        
        assessment.setBatches(batches);
        if (course != null && !course.isEmpty()) {
            assessment.setCourse(course);
            assessment.setSubject(course);
        }
        
        return assessmentRepository.save(assessment);
    }

    public void deleteAssessment(String id) {
        assessmentRepository.deleteById(id);
    }
}
