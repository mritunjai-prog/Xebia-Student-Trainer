package com.xebia.portal.repository;

import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByRole(Role role);
}
