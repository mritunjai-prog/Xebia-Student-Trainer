package com.xebia.portal.service;

import com.xebia.portal.dto.request.CodingRequests;
import com.xebia.portal.dto.response.CodingResponses;

import java.util.List;
import java.util.UUID;

public interface CodingSubmissionService {
    CodingResponses.RunCodeResponse run(CodingRequests.RunCodeRequest request);
    CodingResponses.CodingSubmissionResponse submit(CodingRequests.CodingSubmissionRequest request);
    List<CodingResponses.CodingSubmissionResponse> list(UUID assessmentId, UUID studentId, UUID questionId);
}
