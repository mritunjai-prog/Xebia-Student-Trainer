package com.xebia.assessmentservice.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;
import java.util.Map;

@Service
public class AssessmentCacheService {

    private Map<String, Object> cache = new java.util.concurrent.ConcurrentHashMap<>();

    // Cache active submission draft (auto-save during exam)
    public void saveDraft(String studentId, String assessmentId, Map<String, Object> draftData) {
        String key = "draft:" + studentId + ":" + assessmentId;
        cache.put(key, draftData);
    }

    public Object getDraft(String studentId, String assessmentId) {
        String key = "draft:" + studentId + ":" + assessmentId;
        return cache.get(key);
    }
    
    public void deleteDraft(String studentId, String assessmentId) {
        String key = "draft:" + studentId + ":" + assessmentId;
        cache.remove(key);
    }
}
