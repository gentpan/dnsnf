package utils

import (
	"testing"
)

func TestNormalizeDomain(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"example.com", "example.com"},
		{"EXAMPLE.COM", "example.com"},
		{" Example.Com ", "example.com"},
		{"example.com.", "example.com"},
		{"sub.example.com", "sub.example.com"},
	}
	
	for _, tt := range tests {
		got := NormalizeDomain(tt.input)
		if got != tt.expected {
			t.Errorf("NormalizeDomain(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestValidateDomain(t *testing.T) {
	tests := []struct {
		domain   string
		wantErr  bool
	}{
		{"example.com", false},
		{"sub.example.com", false},
		{"a.b.co", false},
		{"", true},
		{"invalid", true}, // 没有 TLD
		{"-example.com", true}, // 以 - 开头
		{"example-.com", true}, // 以 - 结尾
	}
	
	for _, tt := range tests {
		err := ValidateDomain(tt.domain)
		if (err != nil) != tt.wantErr {
			t.Errorf("ValidateDomain(%q) error = %v, wantErr %v", tt.domain, err, tt.wantErr)
		}
	}
}

func TestNormalizeRecordType(t *testing.T) {
	tests := []struct {
		input    string
		expected string
		wantErr  bool
	}{
		{"a", "A", false},
		{"A", "A", false},
		{"aaaa", "AAAA", false},
		{"mx", "MX", false},
		{"ALL", "ALL", false},
		{"", "ALL", false}, // 默认
		{"invalid", "", true},
	}
	
	for _, tt := range tests {
		got, err := NormalizeRecordType(tt.input)
		if (err != nil) != tt.wantErr {
			t.Errorf("NormalizeRecordType(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			continue
		}
		if got != tt.expected {
			t.Errorf("NormalizeRecordType(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestAllRecordTypes(t *testing.T) {
	types := AllRecordTypes()
	
	if len(types) == 0 {
		t.Error("AllRecordTypes 不应返回空切片")
	}
	
	// 检查是否包含常见的记录类型
	expectedTypes := []string{"A", "AAAA", "MX", "NS", "TXT"}
	for _, expected := range expectedTypes {
		found := false
		for _, typ := range types {
			if typ == expected {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("AllRecordTypes 应包含 %s", expected)
		}
	}
}
