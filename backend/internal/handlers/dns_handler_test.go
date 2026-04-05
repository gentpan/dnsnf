package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDNSHandler_Health(t *testing.T) {
	handler := &DNSHandler{}

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handler.Health(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("期望状态码 %d, 得到 %d", http.StatusOK, rec.Code)
	}

	var resp map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("无法解析响应 JSON: %v", err)
	}

	if resp["status"] != "ok" {
		t.Errorf("期望状态 ok, 得到 %v", resp["status"])
	}

	if _, ok := resp["timestamp"]; !ok {
		t.Error("响应中缺少 timestamp 字段")
	}
}

func TestExtractClientIP(t *testing.T) {
	tests := []struct {
		name       string
		remoteAddr string
		headers    map[string]string
		want       string
	}{
		{
			name:       "使用 X-Forwarded-For",
			remoteAddr: "192.168.1.1:12345",
			headers:    map[string]string{"X-Forwarded-For": "10.0.0.1, 10.0.0.2"},
			want:       "10.0.0.1",
		},
		{
			name:       "没有 X-Forwarded-For",
			remoteAddr: "192.168.1.1:12345",
			headers:    map[string]string{},
			want:       "192.168.1.1",
		},
		{
			name:       "RemoteAddr 没有端口",
			remoteAddr: "192.168.1.1",
			headers:    map[string]string{},
			want:       "192.168.1.1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.RemoteAddr = tt.remoteAddr
			for k, v := range tt.headers {
				req.Header.Set(k, v)
			}

			got := extractClientIP(req)
			if got != tt.want {
				t.Errorf("extractClientIP() = %v, want %v", got, tt.want)
			}
		})
	}
}
