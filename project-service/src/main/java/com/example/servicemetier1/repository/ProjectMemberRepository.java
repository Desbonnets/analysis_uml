package com.example.servicemetier1.repository;

import com.example.servicemetier1.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    List<ProjectMember> findByProjectId(Long projectId);

    Optional<ProjectMember> findByProjectIdAndUserEmail(Long projectId, String userEmail);

    boolean existsByProjectIdAndUserEmail(Long projectId, String userEmail);

    void deleteByProjectIdAndUserEmail(Long projectId, String userEmail);
}
