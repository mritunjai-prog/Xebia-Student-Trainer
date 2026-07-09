package com.xebia.portal.service.impl;

import com.xebia.portal.dto.response.FileUploadResponse;
import com.xebia.portal.entity.FileUpload;
import com.xebia.portal.exception.BadRequestException;
import com.xebia.portal.mapper.PortalMapper;
import com.xebia.portal.repository.FileUploadRepository;
import com.xebia.portal.service.CurrentUserService;
import com.xebia.portal.service.FileUploadService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileUploadServiceImpl implements FileUploadService {
    private final FileUploadRepository fileUploadRepository;
    private final CurrentUserService currentUserService;
    private final PortalMapper mapper;

    public FileUploadServiceImpl(FileUploadRepository fileUploadRepository, CurrentUserService currentUserService, PortalMapper mapper) {
        this.fileUploadRepository = fileUploadRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @Override
    public FileUploadResponse upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file must not be empty");
        }
        // TODO: Store bytes in local/object storage and replace this metadata-only placeholder URL.
        FileUpload upload = new FileUpload();
        upload.setOwnerUser(currentUserService.requireCurrentUser());
        upload.setFileName(file.getOriginalFilename());
        upload.setContentType(file.getContentType());
        upload.setSizeBytes(file.getSize());
        upload.setStorageUrl("TODO_STORAGE/" + file.getOriginalFilename());
        return mapper.toFileUploadResponse(fileUploadRepository.save(upload));
    }
}
