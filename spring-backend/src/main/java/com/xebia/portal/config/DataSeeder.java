package com.xebia.portal.config;

import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.entity.User;
import com.xebia.portal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUser("teacher@example.com", "Teacher Demo", Role.TEACHER, "Training");
        seedUser("student@example.com", "Student Demo", Role.STUDENT, "Learning");
    }

    private void seedUser(String email, String name, Role role, String department) {
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            return;
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(role);
        user.setDepartment(department);
        user.setActive(true);
        userRepository.save(user);
    }
}
