package com.example.analysisservice.service;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    private static final DateTimeFormatter KEY_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH-mm-ss");

    @PostConstruct
    public void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Bucket '{}' created", bucket);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Cannot connect to MinIO or create bucket: " + e.getMessage(), e);
        }
    }

    public String upload(Long projectId, MultipartFile file) {
        String timestamp = LocalDateTime.now().format(KEY_FORMAT);
        String key = "projects/" + projectId + "/" + timestamp + "-source.zip";

        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType("application/zip")
                    .build());
            log.info("Uploaded {} ({} bytes) → {}", file.getOriginalFilename(), file.getSize(), key);
            return key;
        } catch (Exception e) {
            throw new RuntimeException("Upload failed: " + e.getMessage(), e);
        }
    }

    public void delete(String key) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build());
            log.info("Deleted {}", key);
        } catch (Exception e) {
            log.warn("Could not delete {}: {}", key, e.getMessage());
        }
    }
}
