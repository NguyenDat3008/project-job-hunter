package vn.demo.jobhunter.service;

import io.minio.*;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Service
public class MinioService {
    private MinioClient minioClient;
    private final String bucketName;
    private boolean isReady = false;

    public MinioService(
        @Value("${demo.minio.url}") String url,
        @Value("${demo.minio.access-key}") String accessKey,
        @Value("${demo.minio.secret-key}") String secretKey,
        @Value("${demo.minio.bucket-name}") String bucketName
    ) {
        this.bucketName = bucketName;
        // BUG FIX #5: Bọc trong try-catch để app không crash khi MinIO chưa khởi động
        try {
            this.minioClient = MinioClient.builder()
                    .endpoint(url)
                    .credentials(accessKey, secretKey)
                    .build();

            if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build())) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
            this.isReady = true;
            System.out.println(">>> MinIO connected successfully. Bucket: " + bucketName);
        } catch (Exception e) {
            // Chỉ log warning — app vẫn start, nhưng các endpoint liên quan đến file sẽ trả lỗi rõ ràng
            System.err.println(">>> [WARNING] MinIO connection failed: " + e.getMessage());
            System.err.println(">>> File upload/download features will be unavailable until MinIO is running.");
        }
    }

    public void uploadFile(String fileName, InputStream inputStream, long size, String contentType) throws Exception {
        if (!isReady) {
            throw new RuntimeException("MinIO service không khả dụng. Vui lòng kiểm tra kết nối MinIO.");
        }
        minioClient.putObject(PutObjectArgs.builder()
                .bucket(bucketName)
                .object(fileName)
                .stream(inputStream, size, -1)
                .contentType(contentType)
                .build());
    }

    public String getFileUrl(String fileName) {
        if (!isReady) {
            throw new RuntimeException("MinIO service không khả dụng. Vui lòng kiểm tra kết nối MinIO.");
        }
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucketName)
                    .object(fileName)
                    .expiry(1, TimeUnit.HOURS)
                    .build());
        } catch (Exception e) {
            throw new RuntimeException("Error generating presigned URL: " + e.getMessage(), e);
        }
    }

    public boolean isReady() {
        return isReady;
    }
}

