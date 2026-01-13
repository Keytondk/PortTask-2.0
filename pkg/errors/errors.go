package errors

import (
	"fmt"
	"net/http"
)

// AppError represents an application error
type AppError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
	Err        error  `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// Common error codes
const (
	CodeBadRequest          = "BAD_REQUEST"
	CodeUnauthorized        = "UNAUTHORIZED"
	CodeForbidden           = "FORBIDDEN"
	CodeNotFound            = "NOT_FOUND"
	CodeConflict            = "CONFLICT"
	CodeValidation          = "VALIDATION_ERROR"
	CodeInternal            = "INTERNAL_ERROR"
	CodeServiceUnavailable  = "SERVICE_UNAVAILABLE"
	CodeRateLimited         = "RATE_LIMITED"
)

// NewBadRequest creates a bad request error
func NewBadRequest(message string) *AppError {
	return &AppError{
		Code:       CodeBadRequest,
		Message:    message,
		StatusCode: http.StatusBadRequest,
	}
}

// NewUnauthorized creates an unauthorized error
func NewUnauthorized(message string) *AppError {
	return &AppError{
		Code:       CodeUnauthorized,
		Message:    message,
		StatusCode: http.StatusUnauthorized,
	}
}

// NewForbidden creates a forbidden error
func NewForbidden(message string) *AppError {
	return &AppError{
		Code:       CodeForbidden,
		Message:    message,
		StatusCode: http.StatusForbidden,
	}
}

// NewNotFound creates a not found error
func NewNotFound(resource string) *AppError {
	return &AppError{
		Code:       CodeNotFound,
		Message:    fmt.Sprintf("%s not found", resource),
		StatusCode: http.StatusNotFound,
	}
}

// NewConflict creates a conflict error
func NewConflict(message string) *AppError {
	return &AppError{
		Code:       CodeConflict,
		Message:    message,
		StatusCode: http.StatusConflict,
	}
}

// NewValidation creates a validation error
func NewValidation(message string) *AppError {
	return &AppError{
		Code:       CodeValidation,
		Message:    message,
		StatusCode: http.StatusBadRequest,
	}
}

// NewInternal creates an internal server error
func NewInternal(err error) *AppError {
	return &AppError{
		Code:       CodeInternal,
		Message:    "An internal error occurred",
		StatusCode: http.StatusInternalServerError,
		Err:        err,
	}
}

// NewServiceUnavailable creates a service unavailable error
func NewServiceUnavailable(message string) *AppError {
	return &AppError{
		Code:       CodeServiceUnavailable,
		Message:    message,
		StatusCode: http.StatusServiceUnavailable,
	}
}

// NewRateLimited creates a rate limited error
func NewRateLimited() *AppError {
	return &AppError{
		Code:       CodeRateLimited,
		Message:    "Too many requests, please try again later",
		StatusCode: http.StatusTooManyRequests,
	}
}

// Wrap wraps an error with additional context
func Wrap(err error, message string) *AppError {
	if appErr, ok := err.(*AppError); ok {
		appErr.Message = fmt.Sprintf("%s: %s", message, appErr.Message)
		return appErr
	}
	return &AppError{
		Code:       CodeInternal,
		Message:    message,
		StatusCode: http.StatusInternalServerError,
		Err:        err,
	}
}
