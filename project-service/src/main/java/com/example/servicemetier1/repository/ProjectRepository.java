package com.example.servicemetier1.repository;

import com.example.servicemetier1.entity.Project;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOwnerEmail(String ownerEmail);

    @Query("SELECT DISTINCT pm.project FROM ProjectMember pm WHERE pm.userEmail = :email")
    List<Project> findByMemberEmail(@Param("email") String email);
}
