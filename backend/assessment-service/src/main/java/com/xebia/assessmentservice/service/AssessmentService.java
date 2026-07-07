package com.xebia.assessmentservice.service;

import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.repository.AssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssessmentService {
    @Autowired
    private AssessmentRepository assessmentRepository;

    public List<Assessment> getAllAssessments() {
        return assessmentRepository.findAll();
    }

    public Assessment createAssessment(Assessment assessment) {
        return assessmentRepository.save(assessment);
    }

    public Assessment updateAssessment(String id, Assessment updated) {
        java.util.Optional<Assessment> existingOpt = assessmentRepository.findById(id);
        if (existingOpt.isPresent()) {
            Assessment existing = existingOpt.get();
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
            if (updated.getShuffleQuestions() != null) existing.setShuffleQuestions(updated.getShuffleQuestions());
            if (updated.getRandomizeOptions() != null) existing.setRandomizeOptions(updated.getRandomizeOptions());
            if (updated.getNegativeMarking() != null) existing.setNegativeMarking(updated.getNegativeMarking());
            if (updated.getNegativeMarksValue() != null) existing.setNegativeMarksValue(updated.getNegativeMarksValue());
            if (updated.getAutoSubmit() != null) existing.setAutoSubmit(updated.getAutoSubmit());
            if (updated.getBatches() != null) existing.setBatches(updated.getBatches());
            if (updated.getQuestions() != null) existing.setQuestions(updated.getQuestions());
            return assessmentRepository.save(existing);
        }
        return assessmentRepository.save(updated);
    }

    public void deleteAssessment(String id) {
        assessmentRepository.deleteById(id);
    }
}
