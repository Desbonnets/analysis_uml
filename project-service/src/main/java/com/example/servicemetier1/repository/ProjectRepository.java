package com.example.servicemetier1.repository;

import com.example.servicemetier1.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerEmail(String ownerEmail);
}
