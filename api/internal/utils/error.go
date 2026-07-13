package utils

import (
	"errors"
	"fmt"
)

// 定义常见的业务错误类型
type ErrorCode int

const (
	ErrCodeUnknown ErrorCode = iota
	ErrCodeInvalidInput
	ErrCodeNotFound
	ErrCodeRateLimit
	ErrCodeInternal
	ErrCodeExternalService
)

func (c ErrorCode) String() string {
	switch c {
	case ErrCodeInvalidInput:
		return "INVALID_INPUT"
	case ErrCodeNotFound:
		return "NOT_FOUND"
	case ErrCodeRateLimit:
		return "RATE_LIMIT"
	case ErrCodeInternal:
		return "INTERNAL_ERROR"
	case ErrCodeExternalService:
		return "EXTERNAL_SERVICE_ERROR"
	default:
		return "UNKNOWN_ERROR"
	}
}

// AppError 应用错误结构
type AppError struct {
	Code    ErrorCode
	Message string
	Err     error
	Details map[string]any
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code.String(), e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Code.String(), e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// NewAppError 创建新的应用错误
func NewAppError(code ErrorCode, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Details: make(map[string]any),
	}
}

// WithError 添加原始错误
func (e *AppError) WithError(err error) *AppError {
	e.Err = err
	return e
}

// WithDetail 添加详细信息
func (e *AppError) WithDetail(key string, value any) *AppError {
	e.Details[key] = value
	return e
}

// IsNotFound 检查是否为未找到错误
func IsNotFound(err error) bool {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr.Code == ErrCodeNotFound
	}
	return false
}

// IsInvalidInput 检查是否为输入错误
func IsInvalidInput(err error) bool {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr.Code == ErrCodeInvalidInput
	}
	return false
}

// Wrap 包装错误
func Wrap(err error, message string) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", message, err)
}

// Wrapf 格式化包装错误
func Wrapf(err error, format string, args ...any) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", fmt.Sprintf(format, args...), err)
}
