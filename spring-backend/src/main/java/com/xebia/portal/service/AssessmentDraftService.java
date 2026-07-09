package com.xebia.portal.service;

import com.xebia.portal.dto.request.DraftRequests;
import com.xebia.portal.dto.response.DraftResponse;

import java.util.UUID;

public interface AssessmentDraftService {
    DraftResponse saveDraft(UUID studentId, UUID assessmentId, DraftRequests.SaveDraftRequest request);
    DraftResponse getDraft(UUID studentId, UUID assessmentId);
}
