package vn.demo.jobhunter.service;

import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {

    private final MinioService minioService;

    public FileService(MinioService minioService) {
        this.minioService = minioService;
    }

    public String store(MultipartFile file, String folder) throws Exception {
        String finalName = System.currentTimeMillis() + "-" + file.getOriginalFilename();
        minioService.uploadFile(finalName, file.getInputStream(), file.getSize(), file.getContentType());
        return finalName;
    }

    public String getFileUrl(String fileName) {
        return minioService.getFileUrl(fileName);
    }
}
