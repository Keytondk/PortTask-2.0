package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"path"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// StorageProvider defines the interface for storage operations
type StorageProvider interface {
	// Upload uploads a file and returns the storage key
	Upload(ctx context.Context, key string, reader io.Reader, contentType string, metadata map[string]string) (*UploadResult, error)

	// Download downloads a file by key
	Download(ctx context.Context, key string) (io.ReadCloser, *FileInfo, error)

	// Delete deletes a file by key
	Delete(ctx context.Context, key string) error

	// GetPresignedURL generates a pre-signed URL for direct access
	GetPresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error)

	// GetPresignedUploadURL generates a pre-signed URL for direct upload
	GetPresignedUploadURL(ctx context.Context, key, contentType string, expiry time.Duration) (string, error)

	// List lists files with a given prefix
	List(ctx context.Context, prefix string, maxKeys int32) ([]FileInfo, error)

	// Exists checks if a file exists
	Exists(ctx context.Context, key string) (bool, error)

	// Copy copies a file
	Copy(ctx context.Context, sourceKey, destKey string) error

	// GetBucketName returns the bucket name
	GetBucketName() string
}

// S3Config holds S3 configuration
type S3Config struct {
	Region          string
	Bucket          string
	AccessKeyID     string
	SecretAccessKey string
	Endpoint        string // For S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
	UsePathStyle    bool   // Use path-style URLs (required for some S3-compatible services)
	PublicBaseURL   string // Optional base URL for public access
}

// S3Storage implements StorageProvider for S3-compatible storage
type S3Storage struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	bucket        string
	publicBaseURL string
}

// UploadResult contains information about an uploaded file
type UploadResult struct {
	Key         string            `json:"key"`
	Bucket      string            `json:"bucket"`
	ETag        string            `json:"etag"`
	Size        int64             `json:"size"`
	ContentType string            `json:"content_type"`
	URL         string            `json:"url"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// FileInfo contains information about a stored file
type FileInfo struct {
	Key          string            `json:"key"`
	Size         int64             `json:"size"`
	ContentType  string            `json:"content_type"`
	LastModified time.Time         `json:"last_modified"`
	ETag         string            `json:"etag"`
	Metadata     map[string]string `json:"metadata,omitempty"`
}

// NewS3Storage creates a new S3 storage provider
func NewS3Storage(ctx context.Context, cfg S3Config) (*S3Storage, error) {
	// Build AWS config options
	var cfgOpts []func(*config.LoadOptions) error

	cfgOpts = append(cfgOpts, config.WithRegion(cfg.Region))

	// Use static credentials if provided
	if cfg.AccessKeyID != "" && cfg.SecretAccessKey != "" {
		cfgOpts = append(cfgOpts, config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				cfg.AccessKeyID,
				cfg.SecretAccessKey,
				"",
			),
		))
	}

	awsCfg, err := config.LoadDefaultConfig(ctx, cfgOpts...)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	// Build S3 client options
	var s3Opts []func(*s3.Options)

	// Custom endpoint for S3-compatible services
	if cfg.Endpoint != "" {
		s3Opts = append(s3Opts, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
			o.UsePathStyle = cfg.UsePathStyle
		})
	}

	client := s3.NewFromConfig(awsCfg, s3Opts...)
	presignClient := s3.NewPresignClient(client)

	return &S3Storage{
		client:        client,
		presignClient: presignClient,
		bucket:        cfg.Bucket,
		publicBaseURL: cfg.PublicBaseURL,
	}, nil
}

// Upload uploads a file to S3
func (s *S3Storage) Upload(ctx context.Context, key string, reader io.Reader, contentType string, metadata map[string]string) (*UploadResult, error) {
	input := &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        reader,
		ContentType: aws.String(contentType),
	}

	if len(metadata) > 0 {
		input.Metadata = metadata
	}

	result, err := s.client.PutObject(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to upload to S3: %w", err)
	}

	// Build the URL
	fileURL := s.buildURL(key)

	etag := ""
	if result.ETag != nil {
		etag = *result.ETag
	}

	return &UploadResult{
		Key:         key,
		Bucket:      s.bucket,
		ETag:        etag,
		ContentType: contentType,
		URL:         fileURL,
		Metadata:    metadata,
	}, nil
}

// Download downloads a file from S3
func (s *S3Storage) Download(ctx context.Context, key string) (io.ReadCloser, *FileInfo, error) {
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to download from S3: %w", err)
	}

	contentType := ""
	if result.ContentType != nil {
		contentType = *result.ContentType
	}

	etag := ""
	if result.ETag != nil {
		etag = *result.ETag
	}

	lastModified := time.Time{}
	if result.LastModified != nil {
		lastModified = *result.LastModified
	}

	size := int64(0)
	if result.ContentLength != nil {
		size = *result.ContentLength
	}

	info := &FileInfo{
		Key:          key,
		Size:         size,
		ContentType:  contentType,
		LastModified: lastModified,
		ETag:         etag,
		Metadata:     result.Metadata,
	}

	return result.Body, info, nil
}

// Delete deletes a file from S3
func (s *S3Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete from S3: %w", err)
	}
	return nil
}

// GetPresignedURL generates a pre-signed URL for downloading
func (s *S3Storage) GetPresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	result, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiry
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}
	return result.URL, nil
}

// GetPresignedUploadURL generates a pre-signed URL for uploading
func (s *S3Storage) GetPresignedUploadURL(ctx context.Context, key, contentType string, expiry time.Duration) (string, error) {
	result, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiry
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned upload URL: %w", err)
	}
	return result.URL, nil
}

// List lists files with a given prefix
func (s *S3Storage) List(ctx context.Context, prefix string, maxKeys int32) ([]FileInfo, error) {
	input := &s3.ListObjectsV2Input{
		Bucket:  aws.String(s.bucket),
		Prefix:  aws.String(prefix),
		MaxKeys: aws.Int32(maxKeys),
	}

	result, err := s.client.ListObjectsV2(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to list objects: %w", err)
	}

	files := make([]FileInfo, 0, len(result.Contents))
	for _, obj := range result.Contents {
		key := ""
		if obj.Key != nil {
			key = *obj.Key
		}

		etag := ""
		if obj.ETag != nil {
			etag = *obj.ETag
		}

		lastModified := time.Time{}
		if obj.LastModified != nil {
			lastModified = *obj.LastModified
		}

		size := int64(0)
		if obj.Size != nil {
			size = *obj.Size
		}

		files = append(files, FileInfo{
			Key:          key,
			Size:         size,
			LastModified: lastModified,
			ETag:         etag,
		})
	}

	return files, nil
}

// Exists checks if a file exists
func (s *S3Storage) Exists(ctx context.Context, key string) (bool, error) {
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		// Check if it's a "not found" error
		var nsk *types.NotFound
		if ok := err.(*types.NotFound); ok == nsk {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}
	return true, nil
}

// Copy copies a file within S3
func (s *S3Storage) Copy(ctx context.Context, sourceKey, destKey string) error {
	copySource := path.Join(s.bucket, sourceKey)

	_, err := s.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(s.bucket),
		CopySource: aws.String(url.PathEscape(copySource)),
		Key:        aws.String(destKey),
	})
	if err != nil {
		return fmt.Errorf("failed to copy object: %w", err)
	}
	return nil
}

// GetBucketName returns the bucket name
func (s *S3Storage) GetBucketName() string {
	return s.bucket
}

// buildURL builds the public URL for a file
func (s *S3Storage) buildURL(key string) string {
	if s.publicBaseURL != "" {
		return s.publicBaseURL + "/" + key
	}
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucket, key)
}

// DeleteMultiple deletes multiple files
func (s *S3Storage) DeleteMultiple(ctx context.Context, keys []string) error {
	if len(keys) == 0 {
		return nil
	}

	objects := make([]types.ObjectIdentifier, len(keys))
	for i, key := range keys {
		objects[i] = types.ObjectIdentifier{
			Key: aws.String(key),
		}
	}

	_, err := s.client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
		Bucket: aws.String(s.bucket),
		Delete: &types.Delete{
			Objects: objects,
			Quiet:   aws.Bool(true),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete objects: %w", err)
	}
	return nil
}
