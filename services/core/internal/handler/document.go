package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/navo/pkg/storage"
)

// DocumentHandler handles document-related HTTP requests
type DocumentHandler struct {
	documentService *storage.DocumentService
	maxFileSize     int64
	allowedTypes    []string
}

// NewDocumentHandler creates a new document handler
func NewDocumentHandler(documentService *storage.DocumentService) *DocumentHandler {
	return &DocumentHandler{
		documentService: documentService,
		maxFileSize:     50 * 1024 * 1024, // 50MB
		allowedTypes: []string{
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"text/plain",
			"text/csv",
			"image/png",
			"image/jpeg",
			"image/gif",
		},
	}
}

// Upload handles file upload
func (h *DocumentHandler) Upload(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse multipart form
	if err := r.ParseMultipartForm(h.maxFileSize); err != nil {
		writeError(w, http.StatusBadRequest, "File too large or invalid form data")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Get content type
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = storage.GetContentTypeFromFilename(header.Filename)
	}

	// Validate content type
	if !storage.ValidateContentType(contentType, h.allowedTypes) {
		writeError(w, http.StatusBadRequest, "File type not allowed")
		return
	}

	// Get metadata from form
	orgID := r.FormValue("organization_id")
	if orgID == "" {
		writeError(w, http.StatusBadRequest, "organization_id is required")
		return
	}

	docType := storage.DocumentType(r.FormValue("type"))
	if docType == "" {
		docType = storage.DocumentTypeGeneral
	}

	// Build upload options
	opts := storage.UploadOptions{
		OrganizationID: orgID,
		WorkspaceID:    r.FormValue("workspace_id"),
		Type:           docType,
		EntityID:       r.FormValue("entity_id"),
		Name:           r.FormValue("name"),
		OriginalName:   header.Filename,
		Reader:         file,
		ContentType:    contentType,
		Size:           header.Size,
		UploadedBy:     r.FormValue("uploaded_by"),
	}

	if opts.Name == "" {
		opts.Name = header.Filename
	}

	// Parse optional metadata
	if metadataJSON := r.FormValue("metadata"); metadataJSON != "" {
		var metadata map[string]string
		if err := json.Unmarshal([]byte(metadataJSON), &metadata); err == nil {
			opts.Metadata = metadata
		}
	}

	// Upload document
	doc, err := h.documentService.UploadDocument(ctx, opts)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to upload document")
		return
	}

	writeJSON(w, http.StatusCreated, doc)
}

// Download handles file download
func (h *DocumentHandler) Download(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := r.URL.Query().Get("key")
	if key == "" {
		writeError(w, http.StatusBadRequest, "Storage key is required")
		return
	}

	reader, info, err := h.documentService.DownloadDocument(ctx, key)
	if err != nil {
		writeError(w, http.StatusNotFound, "Document not found")
		return
	}
	defer reader.Close()

	// Set headers
	w.Header().Set("Content-Type", info.ContentType)
	w.Header().Set("Content-Length", strconv.FormatInt(info.Size, 10))
	w.Header().Set("Content-Disposition", "attachment")

	// Stream file
	io.Copy(w, reader)
}

// GetPresignedURL generates a pre-signed download URL
func (h *DocumentHandler) GetPresignedURL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := r.URL.Query().Get("key")
	if key == "" {
		writeError(w, http.StatusBadRequest, "Storage key is required")
		return
	}

	expiryStr := r.URL.Query().Get("expiry")
	expiry := 15 * time.Minute
	if expiryStr != "" {
		if minutes, err := strconv.Atoi(expiryStr); err == nil && minutes > 0 && minutes <= 60 {
			expiry = time.Duration(minutes) * time.Minute
		}
	}

	url, err := h.documentService.GetPresignedURL(ctx, key, expiry)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate URL")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"url":        url,
		"expires_in": int(expiry.Seconds()),
	})
}

// GetPresignedUploadURL generates a pre-signed upload URL for direct upload
func (h *DocumentHandler) GetPresignedUploadURL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		OrganizationID string `json:"organization_id"`
		WorkspaceID    string `json:"workspace_id"`
		Type           string `json:"type"`
		EntityID       string `json:"entity_id"`
		Filename       string `json:"filename"`
		ContentType    string `json:"content_type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.OrganizationID == "" || req.Filename == "" {
		writeError(w, http.StatusBadRequest, "organization_id and filename are required")
		return
	}

	contentType := req.ContentType
	if contentType == "" {
		contentType = storage.GetContentTypeFromFilename(req.Filename)
	}

	if !storage.ValidateContentType(contentType, h.allowedTypes) {
		writeError(w, http.StatusBadRequest, "File type not allowed")
		return
	}

	docType := storage.DocumentType(req.Type)
	if docType == "" {
		docType = storage.DocumentTypeGeneral
	}

	result, err := h.documentService.GetPresignedUploadURL(ctx, storage.PresignedUploadOptions{
		OrganizationID: req.OrganizationID,
		WorkspaceID:    req.WorkspaceID,
		Type:           docType,
		EntityID:       req.EntityID,
		Filename:       req.Filename,
		ContentType:    contentType,
		Expiry:         15 * time.Minute,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate upload URL")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// Delete handles document deletion
func (h *DocumentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := chi.URLParam(r, "key")
	if key == "" {
		key = r.URL.Query().Get("key")
	}
	if key == "" {
		writeError(w, http.StatusBadRequest, "Storage key is required")
		return
	}

	if err := h.documentService.DeleteDocument(ctx, key); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete document")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// List lists documents
func (h *DocumentHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	prefix := r.URL.Query().Get("prefix")
	if prefix == "" {
		writeError(w, http.StatusBadRequest, "Prefix is required")
		return
	}

	maxKeys := int32(100)
	if maxKeysStr := r.URL.Query().Get("max_keys"); maxKeysStr != "" {
		if parsed, err := strconv.Atoi(maxKeysStr); err == nil && parsed > 0 && parsed <= 1000 {
			maxKeys = int32(parsed)
		}
	}

	files, err := h.documentService.ListDocuments(ctx, prefix, maxKeys)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list documents")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"items": files,
		"count": len(files),
	})
}
