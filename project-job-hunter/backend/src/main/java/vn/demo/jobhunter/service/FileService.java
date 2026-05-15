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
        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename();
        String finalName = System.currentTimeMillis() + "-" + originalName;

        // Nếu là hình ảnh, thực hiện tối ưu hóa
        if (contentType != null && contentType.startsWith("image/")) {
            return storeOptimizedImage(file, finalName);
        }

        minioService.uploadFile(finalName, file.getInputStream(), file.getSize(), contentType);
        return finalName;
    }

    private String storeOptimizedImage(MultipartFile file, String fileName) throws Exception {
        java.awt.image.BufferedImage originalImage = javax.imageio.ImageIO.read(file.getInputStream());
        if (originalImage == null) {
            // Không đọc được image, upload file gốc
            minioService.uploadFile(fileName, file.getInputStream(), file.getSize(), file.getContentType());
            return fileName;
        }

        // 1. Resize nếu quá lớn (max width 800px)
        int targetWidth = 800;
        int targetHeight = (int) (originalImage.getHeight() * ((double) targetWidth / originalImage.getWidth()));
        if (originalImage.getWidth() < targetWidth) {
            targetWidth = originalImage.getWidth();
            targetHeight = originalImage.getHeight();
        }

        java.awt.Image resultingImage = originalImage.getScaledInstance(targetWidth, targetHeight, java.awt.Image.SCALE_SMOOTH);
        java.awt.image.BufferedImage outputImage = new java.awt.image.BufferedImage(targetWidth, targetHeight, java.awt.image.BufferedImage.TYPE_INT_RGB);
        outputImage.getGraphics().drawImage(resultingImage, 0, 0, null);

        // 2. Nén JPEG (0.7 quality) để tiết kiệm dung lượng
        java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream();
        javax.imageio.IIOImage iioImage = new javax.imageio.IIOImage(outputImage, null, null);
        javax.imageio.ImageWriter writer = javax.imageio.ImageIO.getImageWritersByFormatName("jpg").next();
        javax.imageio.ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(0.7f);

        try (javax.imageio.stream.ImageOutputStream ios = javax.imageio.ImageIO.createImageOutputStream(os)) {
            writer.setOutput(ios);
            writer.write(null, iioImage, param);
        }
        writer.dispose();

        byte[] imageBytes = os.toByteArray();
        minioService.uploadFile(fileName, new java.io.ByteArrayInputStream(imageBytes), imageBytes.length, "image/jpeg");
        
        return fileName;
    }

    public java.io.InputStream download(String fileName) throws Exception {
        return minioService.getFileStream(fileName);
    }

    public String getFileUrl(String fileName) {
        return minioService.getFileUrl(fileName);
    }
}
