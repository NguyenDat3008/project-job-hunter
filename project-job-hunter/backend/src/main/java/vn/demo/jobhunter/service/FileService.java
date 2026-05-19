package vn.demo.jobhunter.service;

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

        // 1. Tối ưu hóa Hình ảnh (Logo, Blog Banner)
        if (contentType != null && contentType.startsWith("image/")) {
            return storeOptimizedImage(file, finalName);
        }

        // 2. Tối ưu hóa PDF (CV)
        if (contentType != null && contentType.equals("application/pdf")) {
            return storeOptimizedPdf(file, finalName);
        }

        minioService.uploadFile(finalName, file.getInputStream(), file.getSize(), contentType);
        return finalName;
    }

    private String storeOptimizedImage(MultipartFile file, String fileName) throws Exception {
        java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream();
        
        // Dùng Thumbnailator để resize và nén
        // Max width 1200px cho blog, 400px cho logo (tạm thời để 1000px chung)
        net.coobird.thumbnailator.Thumbnails.of(file.getInputStream())
            .size(1200, 1200)
            .outputQuality(0.75) // Chất lượng 75% là điểm cân bằng tốt nhất
            .outputFormat("jpg")
            .toOutputStream(os);

        byte[] imageBytes = os.toByteArray();
        minioService.uploadFile(fileName, new java.io.ByteArrayInputStream(imageBytes), imageBytes.length, "image/jpeg");
        
        System.out.println("[STORAGE] Optimized image: " + fileName + " (" + file.getSize() + " -> " + imageBytes.length + " bytes)");
        return fileName;
    }

    private String storeOptimizedPdf(MultipartFile file, String fileName) throws Exception {
        // PDFBox 3.0 optimization
        try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(file.getBytes())) {
            // Đặt version về 1.4 để tương thích rộng
            document.setVersion(1.4f);
            
            java.io.ByteArrayOutputStream os = new java.io.ByteArrayOutputStream();
            document.save(os);
            
            byte[] pdfBytes = os.toByteArray();
            
            // Nếu nén xong mà to hơn gốc thì lấy gốc
            if (pdfBytes.length >= file.getSize()) {
                minioService.uploadFile(fileName, file.getInputStream(), file.getSize(), "application/pdf");
                return fileName;
            }

            minioService.uploadFile(fileName, new java.io.ByteArrayInputStream(pdfBytes), pdfBytes.length, "application/pdf");
            System.out.println("[STORAGE] Optimized PDF: " + fileName + " (" + file.getSize() + " -> " + pdfBytes.length + " bytes)");
            return fileName;
        } catch (Exception e) {
            // Lỗi thì cứ upload bản gốc cho an toàn
            minioService.uploadFile(fileName, file.getInputStream(), file.getSize(), "application/pdf");
            return fileName;
        }
    }

    public java.io.InputStream download(String fileName) throws Exception {
        return minioService.getFileStream(fileName);
    }

    public String getFileUrl(String fileName) {
        return minioService.getFileUrl(fileName);
    }
}
