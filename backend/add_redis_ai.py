import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.strip() + '\n')

BASE_DIR = r"d:\Xebia-LMS-Backend"
ASS_PKG = os.path.join(BASE_DIR, "assessment-service/src/main/java/com/xebia/assessmentservice")

create_file(os.path.join(ASS_PKG, "config/RedisConfig.java"), """
package com.xebia.assessmentservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
""")

create_file(os.path.join(ASS_PKG, "service/AssessmentCacheService.java"), """
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
""")

create_file(os.path.join(ASS_PKG, "controller/DraftController.java"), """
package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.service.AssessmentCacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/assessments/drafts")
@CrossOrigin(origins = "*")
public class DraftController {

    @Autowired
    private AssessmentCacheService cacheService;

    @PostMapping("/{studentId}/{assessmentId}")
    public void saveDraft(@PathVariable String studentId, @PathVariable String assessmentId, @RequestBody Map<String, Object> draftData) {
        cacheService.saveDraft(studentId, assessmentId, draftData);
    }

    @GetMapping("/{studentId}/{assessmentId}")
    public Object getDraft(@PathVariable String studentId, @PathVariable String assessmentId) {
        return cacheService.getDraft(studentId, assessmentId);
    }
}
""")

create_file(os.path.join(ASS_PKG, "service/AIService.java"), """
package com.xebia.assessmentservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIService {

    @Value("${groq.api.key}")
    private String apiKey;
    
    @Value("${groq.api.url}")
    private String apiUrl;

    public String generateAssessmentDescription(String topic) {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", "Generate a professional assessment description and instructions for a test on: " + topic);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.7);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
                    return (String) msg.get("content");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "AI Generation Failed.";
    }
}
""")

create_file(os.path.join(ASS_PKG, "controller/AIController.java"), """
package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/assessments/ai")
@CrossOrigin(origins = "*")
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/generate-description")
    public Map<String, String> generateDescription(@RequestBody Map<String, String> request) {
        String topic = request.get("topic");
        String result = aiService.generateAssessmentDescription(topic);
        return Map.of("content", result);
    }
}
""")

print("Added Redis Cache and AI Service successfully!")
