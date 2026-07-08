package com.xebia.assessmentservice;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DbUpdater implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DbUpdater.class);
    private final JdbcTemplate jdbcTemplate;
    
    public DbUpdater(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @Override
    public void run(String... args) {
        logger.info("Running DB updates to alter columns to TEXT...");
        try { jdbcTemplate.execute("ALTER TABLE assessments ALTER COLUMN description TYPE TEXT"); } catch(Exception e) { logger.warn("description: " + e.getMessage()); }
        try { jdbcTemplate.execute("ALTER TABLE assessments ALTER COLUMN instructions TYPE TEXT"); } catch(Exception e) { logger.warn("instructions: " + e.getMessage()); }
        try { jdbcTemplate.execute("ALTER TABLE questions ALTER COLUMN explanation TYPE TEXT"); } catch(Exception e) { logger.warn("explanation: " + e.getMessage()); }
        try { jdbcTemplate.execute("ALTER TABLE questions ALTER COLUMN correct_answer TYPE TEXT"); } catch(Exception e) { logger.warn("correct_answer: " + e.getMessage()); }
        try { jdbcTemplate.execute("ALTER TABLE questions ALTER COLUMN question TYPE TEXT"); } catch(Exception e) { logger.warn("question: " + e.getMessage()); }
        try { jdbcTemplate.execute("ALTER TABLE question_options ALTER COLUMN options TYPE TEXT"); } catch(Exception e) { logger.warn("options: " + e.getMessage()); }
        logger.info("DB updates complete.");
    }
}
