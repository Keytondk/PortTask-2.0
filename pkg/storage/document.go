package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// DocumentType represents the type of document
type DocumentType string

const (
	DocumentTypePortCall     DocumentType = "port_call"
	DocumentTypeServiceOrder DocumentType = "service_order"
	DocumentTypeVessel       DocumentType = "vessel"
	DocumentTypeRFQ          DocumentType = "rfq"
	DocumentTypeQuote        DocumentType = "quote"
	DocumentTypeInvoice      DocumentType = "invoice"
	DocumentTypeGeneral      DocumentType = "general"
)

// Document represents a stored document
type Document struct {
	ID             string            `json:"id"`
	OrganizationID string            `json:"organization_id"`
	WorkspaceID    string            `json:"workspace_id,omitempty"`
	Type           DocumentType      `json:"type"`
	EntityID       string            `json:"entity_id,omitempty"`
	Name           string            `json:"name"`
	OriginalName   string            `json:"original_name"`
	StorageKey     string            `json:"storage_key"`
	ContentType    string            `json:"content_type"`
	Size           int64             `json:"size"`
	URL            string            `json:"url"`
	Metadata       map[string]string `json:"metadata,omitempty"`
	UploadedBy     string            `json:"uploaded_by"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
}

// DocumentService handles document operations
type DocumentService struct {
	storage StorageProvider
}

// NewDocumentService creates a new document service
func NewDocumentService(storage StorageProvider) *DocumentService {
	return &DocumentService{
		storage: storage,
	}
}

// UploadDocument uploads a document and returns the document record
func (s *DocumentService) UploadDocument(ctx context.Context, opts UploadOptions) (*Document, error) {
	// Generate document ID
	docID := uuid.New().String()

	// Build storage key: org/workspace/type/entity/docid/filename
	key := s.buildStorageKey(opts)

	// Upload to storage
	result, err := s.storage.Upload(ctx, key, opts.Reader, opts.ContentType, opts.Metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to upload document: %w", err)
	}

	now := time.Now().UTC()
	doc := &Document{
		ID:             docID,
		OrganizationID: opts.OrganizationID,
		WorkspaceID:    opts.WorkspaceID,
		Type:           opts.Type,
		EntityID:       opts.EntityID,
		Name:           opts.Name,
		OriginalName:   opts.OriginalName,
		StorageKey:     key,
		ContentType:    opts.ContentType,
		Size:           opts.Size,
		URL:            result.URL,
		Metadata:       opts.Metadata,
		UploadedBy:     opts.UploadedBy,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	return doc, nil
}

// UploadOptions contains options for uploading a document
type UploadOptions struct {
	OrganizationID string
	WorkspaceID    string
	Type           DocumentType
	EntityID       string
	Name           string
	OriginalName   string
	Reader         io.Reader
	ContentType    string
	Size           int64
	Metadata       map[string]string
	UploadedBy     string
}

// buildStorageKey builds the storage key for a document
func (s *DocumentService) buildStorageKey(opts UploadOptions) string {
	parts := []string{
		"documents",
		opts.OrganizationID,
	}

	if opts.WorkspaceID != "" {
		parts = append(parts, opts.WorkspaceID)
	}

	parts = append(parts, string(opts.Type))

	if opts.EntityID != "" {
		parts = append(parts, opts.EntityID)
	}

	// Add timestamp and sanitized filename
	timestamp := time.Now().Format("20060102-150405")
	filename := sanitizeFilename(opts.OriginalName)
	parts = append(parts, fmt.Sprintf("%s-%s", timestamp, filename))

	return strings.Join(parts, "/")
}

// DownloadDocument downloads a document
func (s *DocumentService) DownloadDocument(ctx context.Context, storageKey string) (io.ReadCloser, *FileInfo, error) {
	return s.storage.Download(ctx, storageKey)
}

// DeleteDocument deletes a document
func (s *DocumentService) DeleteDocument(ctx context.Context, storageKey string) error {
	return s.storage.Delete(ctx, storageKey)
}

// GetPresignedURL generates a pre-signed URL for downloading
func (s *DocumentService) GetPresignedURL(ctx context.Context, storageKey string, expiry time.Duration) (string, error) {
	return s.storage.GetPresignedURL(ctx, storageKey, expiry)
}

// GetPresignedUploadURL generates a pre-signed URL for direct upload
func (s *DocumentService) GetPresignedUploadURL(ctx context.Context, opts PresignedUploadOptions) (*PresignedUploadResult, error) {
	key := s.buildStorageKey(UploadOptions{
		OrganizationID: opts.OrganizationID,
		WorkspaceID:    opts.WorkspaceID,
		Type:           opts.Type,
		EntityID:       opts.EntityID,
		OriginalName:   opts.Filename,
	})

	presignedURL, err := s.storage.GetPresignedUploadURL(ctx, key, opts.ContentType, opts.Expiry)
	if err != nil {
		return nil, err
	}

	return &PresignedUploadResult{
		UploadURL:  presignedURL,
		StorageKey: key,
		ExpiresAt:  time.Now().Add(opts.Expiry),
	}, nil
}

// PresignedUploadOptions contains options for generating a presigned upload URL
type PresignedUploadOptions struct {
	OrganizationID string
	WorkspaceID    string
	Type           DocumentType
	EntityID       string
	Filename       string
	ContentType    string
	Expiry         time.Duration
}

// PresignedUploadResult contains the result of generating a presigned upload URL
type PresignedUploadResult struct {
	UploadURL  string    `json:"upload_url"`
	StorageKey string    `json:"storage_key"`
	ExpiresAt  time.Time `json:"expires_at"`
}

// ListDocuments lists documents with a given prefix
func (s *DocumentService) ListDocuments(ctx context.Context, prefix string, maxKeys int32) ([]FileInfo, error) {
	return s.storage.List(ctx, prefix, maxKeys)
}

// sanitizeFilename removes unsafe characters from filename
func sanitizeFilename(filename string) string {
	// Get base name without path
	filename = filepath.Base(filename)

	// Replace unsafe characters
	unsafe := []string{" ", "/", "\\", ":", "*", "?", "\"", "<", ">", "|"}
	result := filename
	for _, char := range unsafe {
		result = strings.ReplaceAll(result, char, "_")
	}

	// Limit length
	if len(result) > 100 {
		ext := filepath.Ext(result)
		name := strings.TrimSuffix(result, ext)
		if len(name) > 90 {
			name = name[:90]
		}
		result = name + ext
	}

	return result
}

// GetContentTypeFromFilename returns content type based on file extension
func GetContentTypeFromFilename(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))

	contentTypes := map[string]string{
		".pdf":  "application/pdf",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls":  "application/vnd.ms-excel",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".ppt":  "application/vnd.ms-powerpoint",
		".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".txt":  "text/plain",
		".csv":  "text/csv",
		".json": "application/json",
		".xml":  "application/xml",
		".zip":  "application/zip",
		".png":  "image/png",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".gif":  "image/gif",
		".webp": "image/webp",
		".svg":  "image/svg+xml",
	}

	if ct, ok := contentTypes[ext]; ok {
		return ct
	}
	return "application/octet-stream"
}

// ValidateContentType checks if the content type is allowed
func ValidateContentType(contentType string, allowedTypes []string) bool {
	if len(allowedTypes) == 0 {
		return true
	}

	for _, allowed := range allowedTypes {
		if contentType == allowed {
			return true
		}
		// Support wildcards like "image/*"
		if strings.HasSuffix(allowed, "/*") {
			prefix := strings.TrimSuffix(allowed, "*")
			if strings.HasPrefix(contentType, prefix) {
				return true
			}
		}
	}
	return false
}
