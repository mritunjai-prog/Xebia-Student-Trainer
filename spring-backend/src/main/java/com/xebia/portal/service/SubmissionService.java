package com.xebia.portal.service;

import com.xebia.portal.dto.request.SubmissionRequests;
import com.xebia.portal.dto.response.SubmissionResultResponse;
import com.xebia.portal.dto.response.SubmissionResponse;
import com.xebia.portal.entity.Enums.SubmissionStatus;

import java.util.List;
import java.util.UUID;

public interface SubmissionService {
    SubmissionResponse start(SubmissionRequests.StartSubmissionRequest request);
    SubmissionResponse submit(UUID id, SubmissionRequests.SubmitSubmissionRequest request);
    List<SubmissionResponse> getSubmissions(UUID studentId, UUID assessmentId, SubmissionStatus status);
    SubmissionResultResponse getResult(UUID id);
    SubmissionResponse evaluate(UUID id, SubmissionRequests.EvaluationRequest request);
}
