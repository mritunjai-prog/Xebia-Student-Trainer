package com.xebia.portal.service;

import com.xebia.portal.dto.response.FileUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface FileUploadService {
    FileUploadResponse upload(MultipartFile file);
}
