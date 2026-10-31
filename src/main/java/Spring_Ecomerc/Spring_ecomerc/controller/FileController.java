package Spring_Ecomerc.Spring_ecomerc.controller;

import Spring_Ecomerc.Spring_ecomerc.dto.ApiResponse;
import Spring_Ecomerc.Spring_ecomerc.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.InvalidPathException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "") String subFolder) throws IOException {
        String path = fileService.uploadFile(file, subFolder);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", path));
    }

    @GetMapping("/{*filename}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = root.resolve(filename.replaceFirst("^/+", "")).normalize();

            if (!filePath.startsWith(root) || !Files.isRegularFile(filePath)) {
                return ResponseEntity.notFound().build();
            }

            // Determine media type based on file extension
            String mediaType = determineMediaType(filePath.getFileName().toString());
            Resource resource = new FileSystemResource(filePath);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filePath.getFileName() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                    .contentType(MediaType.parseMediaType(mediaType))
                    .body(resource);
        } catch (InvalidPathException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String determineMediaType(String filename) {
        String lowercaseName = filename.toLowerCase();
        if (lowercaseName.endsWith(".jpg") || lowercaseName.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowercaseName.endsWith(".png")) {
            return "image/png";
        } else if (lowercaseName.endsWith(".gif")) {
            return "image/gif";
        } else if (lowercaseName.endsWith(".webp")) {
            return "image/webp";
        } else if (lowercaseName.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lowercaseName.endsWith(".txt")) {
            return "text/plain";
        }
        return "application/octet-stream";
    }
}
