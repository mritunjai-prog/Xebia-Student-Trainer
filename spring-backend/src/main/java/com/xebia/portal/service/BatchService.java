package com.xebia.portal.service;

import com.xebia.portal.dto.request.BatchRequests;
import com.xebia.portal.dto.response.BatchResponse;

import java.util.List;
import java.util.UUID;

public interface BatchService {
    List<BatchResponse> getBatches();
    BatchResponse createBatch(BatchRequests.BatchRequest request);
    BatchResponse getBatch(UUID id);
    BatchResponse updateBatch(UUID id, BatchRequests.BatchRequest request);
    void deleteBatch(UUID id);
    BatchResponse replaceStudents(UUID id, BatchRequests.BatchStudentsRequest request);
}
