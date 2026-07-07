package com.xebia.batchservice.service;

import com.xebia.batchservice.model.Batch;
import com.xebia.batchservice.repository.BatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BatchService {
    @Autowired
    private BatchRepository batchRepository;

    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    public Batch createBatch(Batch batch) {
        return batchRepository.save(batch);
    }

    public Batch updateBatch(String id, Batch updated) {
        Optional<Batch> existing = batchRepository.findById(id);
        if (existing.isPresent()) {
            Batch batch = existing.get();
            if (updated.getName() != null) batch.setName(updated.getName());
            if (updated.getCourse() != null) batch.setCourse(updated.getCourse());
            if (updated.getStatus() != null) batch.setStatus(updated.getStatus());
            if (updated.getStudents() != null) batch.setStudents(updated.getStudents());
            if (updated.getStudentCount() != null) batch.setStudentCount(updated.getStudentCount());
            if (updated.getIcon() != null) batch.setIcon(updated.getIcon());
            return batchRepository.save(batch);
        }
        return batchRepository.save(updated);
    }

    public void deleteBatch(String id) {
        batchRepository.deleteById(id);
    }
}
