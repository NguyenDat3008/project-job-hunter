package vn.demo.jobhunter.service;

import io.minio.*;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Service
public class MinioService {
    private final MinioClient minioClient;
    private final String bucketName;

    public MinioService(
        @Value("${demo.minio.url}") String url,
        @Value("${demo.minio.access-key}") String accessKey,
        @Value("${demo.minio.secret-key}") String secretKey,
        @Value("${demo.minio.bucket-name}") String bucketName
    ) throws Exception {
        this.bucketName = bucketName;
        this.minioClient = MinioClient.builder().endpoint(url).credentials(accessKey, secretKey).build();
        
        if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build())) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
        }
    }

    public void uploadFile(String fileName, InputStream inputStream, long size, String contentType) throws Exception {
        minioClient.putObject(PutObjectArgs.builder()
                .bucket(bucketName)
                .object(fileName)
                .stream(inputStream, size, -1)
                .contentType(contentType)
                .build());
    }

    public String getFileUrl(String fileName) {
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucketName)
                    .object(fileName)
                    .expiry(1, TimeUnit.HOURS)
                    .build());
        } catch (Exception e) {
            throw new RuntimeException("Error generating presigned URL", e);
        }
    }
}
