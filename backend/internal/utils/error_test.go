package utils

import (
	"errors"
	"testing"
)

func TestNewAppError(t *testing.T) {
	err := NewAppError(ErrCodeInvalidInput, "invalid domain")
	
	if err.Code != ErrCodeInvalidInput {
		t.Errorf("期望错误码 %v, 得到 %v", ErrCodeInvalidInput, err.Code)
	}
	
	if err.Message != "invalid domain" {
		t.Errorf("期望消息 'invalid domain', 得到 %s", err.Message)
	}
	
	expectedError := "[INVALID_INPUT] invalid domain"
	if err.Error() != expectedError {
		t.Errorf("期望错误字符串 '%s', 得到 '%s'", expectedError, err.Error())
	}
}

func TestAppError_WithError(t *testing.T) {
	originalErr := errors.New("original error")
	err := NewAppError(ErrCodeInternal, "internal error").WithError(originalErr)
	
	if err.Err != originalErr {
		t.Error("期望原始错误被正确设置")
	}
	
	expectedError := "[INTERNAL_ERROR] internal error: original error"
	if err.Error() != expectedError {
		t.Errorf("期望错误字符串 '%s', 得到 '%s'", expectedError, err.Error())
	}
}

func TestAppError_WithDetail(t *testing.T) {
	err := NewAppError(ErrCodeNotFound, "not found").
		WithDetail("domain", "example.com").
		WithDetail("type", "A")
	
	if err.Details["domain"] != "example.com" {
		t.Error("期望 domain 详情被设置")
	}
	
	if err.Details["type"] != "A" {
		t.Error("期望 type 详情被设置")
	}
}

func TestIsNotFound(t *testing.T) {
	appErr := NewAppError(ErrCodeNotFound, "domain not found")
	if !IsNotFound(appErr) {
		t.Error("期望识别为 NotFound 错误")
	}
	
	otherErr := NewAppError(ErrCodeInvalidInput, "invalid input")
	if IsNotFound(otherErr) {
		t.Error("期望不是 NotFound 错误")
	}
	
	stdErr := errors.New("standard error")
	if IsNotFound(stdErr) {
		t.Error("标准错误不应被识别为 NotFound")
	}
}

func TestIsInvalidInput(t *testing.T) {
	appErr := NewAppError(ErrCodeInvalidInput, "invalid input")
	if !IsInvalidInput(appErr) {
		t.Error("期望识别为 InvalidInput 错误")
	}
	
	otherErr := NewAppError(ErrCodeNotFound, "not found")
	if IsInvalidInput(otherErr) {
		t.Error("期望不是 InvalidInput 错误")
	}
}

func TestWrap(t *testing.T) {
	originalErr := errors.New("original")
	wrapped := Wrap(originalErr, "context")
	
	if wrapped == nil {
		t.Error("包装错误不应为 nil")
	}
	
	if !errors.Is(wrapped, originalErr) {
		t.Error("期望可以通过 errors.Is 识别原始错误")
	}
	
	// 包装 nil 错误应该返回 nil
	if Wrap(nil, "context") != nil {
		t.Error("包装 nil 应该返回 nil")
	}
}

func TestWrapf(t *testing.T) {
	originalErr := errors.New("original")
	wrapped := Wrapf(originalErr, "error in %s", "function")
	
	if wrapped == nil {
		t.Error("包装错误不应为 nil")
	}
	
	expected := "error in function: original"
	if wrapped.Error() != expected {
		t.Errorf("期望 '%s', 得到 '%s'", expected, wrapped.Error())
	}
	
	// 包装 nil 错误应该返回 nil
	if Wrapf(nil, "context %s", "test") != nil {
		t.Error("包装 nil 应该返回 nil")
	}
}

func TestErrorCode_String(t *testing.T) {
	tests := []struct {
		code     ErrorCode
		expected string
	}{
		{ErrCodeUnknown, "UNKNOWN_ERROR"},
		{ErrCodeInvalidInput, "INVALID_INPUT"},
		{ErrCodeNotFound, "NOT_FOUND"},
		{ErrCodeRateLimit, "RATE_LIMIT"},
		{ErrCodeInternal, "INTERNAL_ERROR"},
		{ErrCodeExternalService, "EXTERNAL_SERVICE_ERROR"},
		{ErrorCode(999), "UNKNOWN_ERROR"}, // 未知代码
	}
	
	for _, tt := range tests {
		if got := tt.code.String(); got != tt.expected {
			t.Errorf("ErrorCode(%d).String() = %s, want %s", tt.code, got, tt.expected)
		}
	}
}
