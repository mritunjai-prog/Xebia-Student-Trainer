package com.xebia.assessmentservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;
import java.util.Map;

@Service
public class AssessmentCacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // Cache active submission draft (auto-save during exam)
    public void saveDraft(String studentId, String assessmentId, Map<String, Object> draftData) {
        String key = "draft:" + studentId + ":" + assessmentId;
        redisTemplate.opsForValue().set(key, draftData, 24, TimeUnit.HOURS);
    }

    public Object getDraft(String studentId, String assessmentId) {
        String key = "draft:" + studentId + ":" + assessmentId;
        return redisTemplate.opsForValue().get(key);
    }
    
    public void deleteDraft(String studentId, String assessmentId) {
        String key = "draft:" + studentId + ":" + assessmentId;
        redisTemplate.delete(key);
    }
}
