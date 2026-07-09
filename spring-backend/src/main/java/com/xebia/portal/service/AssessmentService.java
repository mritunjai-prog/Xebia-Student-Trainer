package com.xebia.portal.service;

import com.xebia.portal.dto.request.AssessmentRequests;
import com.xebia.portal.dto.response.AssessmentResponse;

import java.util.List;
import java.util.UUID;

public interface AssessmentService {
    List<AssessmentResponse> getAssessments();
    AssessmentResponse createAssessment(AssessmentRequests.AssessmentRequest request);
    AssessmentResponse getAssessment(UUID id);
    AssessmentResponse updateAssessment(UUID id, AssessmentRequests.AssessmentRequest request);
    void deleteAssessment(UUID id);
    AssessmentResponse publish(UUID id);
    AssessmentResponse duplicate(UUID id);
    List<AssessmentResponse> getCurrentStudentAssessments();
}
