package com.xebia.portal.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xebia.portal.dto.request.DraftRequests;
import com.xebia.portal.dto.response.DraftResponse;
import com.xebia.portal.entity.Assessment;
import com.xebia.portal.entity.AssessmentDraft;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.entity.User;
import com.xebia.portal.exception.BadRequestException;
import com.xebia.portal.exception.ResourceNotFoundException;
import com.xebia.portal.exception.UnauthorizedException;
import com.xebia.portal.repository.AssessmentDraftRepository;
import com.xebia.portal.repository.AssessmentRepository;
import com.xebia.portal.service.AssessmentDraftService;
import com.xebia.portal.service.CurrentUserService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class AssessmentDraftServiceImpl implements AssessmentDraftService {
    private final AssessmentDraftRepository draftRepository;
    private final AssessmentRepository assessmentRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public AssessmentDraftServiceImpl(AssessmentDraftRepository draftRepository,
                                      AssessmentRepository assessmentRepository,
                                      CurrentUserService currentUserService,
                                      ObjectMapper objectMapper) {
        this.draftRepository = draftRepository;
        this.assessmentRepository = assessmentRepository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DraftResponse saveDraft(UUID studentId, UUID assessmentId, DraftRequests.SaveDraftRequest request) {
        User student = requireMatchingStudent(studentId);
        Assessment assessment = requireAvailableAssignedAssessment(assessmentId, student);
        AssessmentDraft draft = draftRepository.findByAssessmentIdAndStudentId(assessmentId, studentId)
                .orElseGet(() -> {
                    AssessmentDraft created = new AssessmentDraft();
                    created.setAssessment(assessment);
                    created.setStudent(student);
                    return created;
                });
        draft.setDraftJson(writeDraftJson(request.draftData()));
        return toResponse(draftRepository.save(draft));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DraftResponse getDraft(UUID studentId, UUID assessmentId) {
        User student = requireMatchingStudent(studentId);
        requireAvailableAssignedAssessment(assessmentId, student);
        return draftRepository.findByAssessmentIdAndStudentId(assessmentId, studentId)
                .map(this::toResponse)
                .orElse(null);
    }

    private User requireMatchingStudent(UUID studentId) {
        User currentUser = currentUserService.requireCurrentUser();
        if (currentUser.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Only students can access assessment drafts");
        }
        if (!currentUser.getId().equals(studentId)) {
            throw new UnauthorizedException("Students can access only their own drafts");
        }
        return currentUser;
    }

    private Assessment requireAvailableAssignedAssessment(UUID assessmentId, User student) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
        if (assessment.getStatus() != AssessmentStatus.PUBLISHED) {
            throw new BadRequestException("Drafts are available only for published assessments");
        }
        Instant now = Instant.now();
        if (assessment.getStartAt() != null && now.isBefore(assessment.getStartAt())) {
            throw new BadRequestException("Assessment has not started yet");
        }
        if (assessment.getEndAt() != null && now.isAfter(assessment.getEndAt())) {
            throw new BadRequestException("Assessment has already ended");
        }
        boolean assigned = assessment.getAssignedBatches().stream()
                .anyMatch(link -> link.getBatch().getStudents().stream()
                        .anyMatch(batchStudent -> batchStudent.getStudent().getId().equals(student.getId())));
        if (!assigned) {
            throw new UnauthorizedException("Student can access drafts only for assigned assessments");
        }
        return assessment;
    }

    private String writeDraftJson(Object draftData) {
        try {
            return objectMapper.writeValueAsString(draftData == null ? Map.of() : draftData);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Draft data must be valid JSON");
        }
    }

    private Object readDraftJson(String draftJson) {
        if (draftJson == null || draftJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(draftJson, Object.class);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Stored draft data is invalid");
        }
    }

    private DraftResponse toResponse(AssessmentDraft draft) {
        return new DraftResponse(draft.getId(), draft.getAssessment().getId(), draft.getStudent().getId(),
                readDraftJson(draft.getDraftJson()), draft.getUpdatedAt());
    }
}
