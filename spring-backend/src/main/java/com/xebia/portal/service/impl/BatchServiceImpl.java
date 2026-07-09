package com.xebia.portal.service.impl;

import com.xebia.portal.dto.request.BatchRequests;
import com.xebia.portal.dto.response.BatchResponse;
import com.xebia.portal.entity.Batch;
import com.xebia.portal.entity.BatchStudent;
import com.xebia.portal.entity.Enums.BatchStatus;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.exception.BadRequestException;
import com.xebia.portal.exception.ResourceNotFoundException;
import com.xebia.portal.mapper.PortalMapper;
import com.xebia.portal.repository.BatchRepository;
import com.xebia.portal.repository.UserRepository;
import com.xebia.portal.service.BatchService;
import com.xebia.portal.service.CurrentUserService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BatchServiceImpl implements BatchService {
    private final BatchRepository batchRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final PortalMapper mapper;

    public BatchServiceImpl(BatchRepository batchRepository, UserRepository userRepository,
                            CurrentUserService currentUserService, PortalMapper mapper) {
        this.batchRepository = batchRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<BatchResponse> getBatches() {
        return batchRepository.findAll().stream().map(mapper::toBatchResponse).toList();
    }

    @Override
    @Transactional
    public BatchResponse createBatch(BatchRequests.BatchRequest request) {
        ensureBatchNameAvailable(request.name(), null);
        Batch batch = new Batch();
        apply(batch, request);
        batch.setCreatedBy(currentUserService.requireCurrentUser());
        Batch saved = batchRepository.save(batch);
        replaceStudents(saved.getId(), new BatchRequests.BatchStudentsRequest(request.studentIds()));
        return mapper.toBatchResponse(batchRepository.findById(saved.getId()).orElseThrow());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public BatchResponse getBatch(UUID id) {
        return mapper.toBatchResponse(findBatch(id));
    }

    @Override
    @Transactional
    public BatchResponse updateBatch(UUID id, BatchRequests.BatchRequest request) {
        Batch batch = findBatch(id);
        ensureBatchNameAvailable(request.name(), id);
        apply(batch, request);
        batchRepository.save(batch);
        if (request.studentIds() != null) {
            replaceStudents(id, new BatchRequests.BatchStudentsRequest(request.studentIds()));
        }
        return mapper.toBatchResponse(findBatch(id));
    }

    @Override
    @Transactional
    public void deleteBatch(UUID id) {
        batchRepository.delete(findBatch(id));
    }

    @Override
    @Transactional
    public BatchResponse replaceStudents(UUID id, BatchRequests.BatchStudentsRequest request) {
        Batch batch = findBatch(id);
        batch.getStudents().clear();
        if (request.studentIds() != null) {
            Set<UUID> uniqueStudentIds = new LinkedHashSet<>(request.studentIds());
            for (UUID studentId : uniqueStudentIds) {
                var student = userRepository.findById(studentId)
                        .filter(user -> user.getRole() == Role.STUDENT)
                        .orElseThrow(() -> new BadRequestException("Invalid student id: " + studentId));
                BatchStudent link = new BatchStudent();
                link.setBatch(batch);
                link.setStudent(student);
                batch.getStudents().add(link);
            }
        }
        return mapper.toBatchResponse(batchRepository.save(batch));
    }

    private Batch findBatch(UUID id) {
        return batchRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Batch not found"));
    }

    private void apply(Batch batch, BatchRequests.BatchRequest request) {
        batch.setName(request.name().trim());
        batch.setCourse(request.course().trim());
        batch.setIcon(request.icon());
        batch.setStatus(request.status() == null ? BatchStatus.ACTIVE : request.status());
    }

    private void ensureBatchNameAvailable(String name, UUID currentBatchId) {
        batchRepository.findByNameIgnoreCase(name.trim())
                .filter(existing -> currentBatchId == null || !existing.getId().equals(currentBatchId))
                .ifPresent(existing -> {
                    throw new BadRequestException("Batch name already exists");
                });
    }
}
