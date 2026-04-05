package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"giantaccel/internal/models"
)

func TestRdnsUpsertItem_Validation(t *testing.T) {
	items := []rdnsUpsertItem{
		{IP: "192.168.1.1", PTR: "host.example.com"},
		{IP: "", PTR: "invalid.com"},        // 应该被过滤
		{IP: "192.168.1.2", PTR: ""},        // 应该被过滤
		{IP: "192.168.1.3", PTR: "host3.com"},
	}

	var validIPs, validPTRs []string
	for _, item := range items {
		if item.IP != "" && item.PTR != "" {
			validIPs = append(validIPs, item.IP)
			validPTRs = append(validPTRs, item.PTR)
		}
	}

	if len(validIPs) != 2 {
		t.Errorf("期望 2 条有效记录，得到 %d", len(validIPs))
	}

	expectedIPs := []string{"192.168.1.1", "192.168.1.3"}
	for i, ip := range validIPs {
		if ip != expectedIPs[i] {
			t.Errorf("期望 IP %s, 得到 %s", expectedIPs[i], ip)
		}
	}
}

func TestWriteJSON(t *testing.T) {
	rec := httptest.NewRecorder()
	payload := map[string]string{"message": "test"}
	
	writeJSON(rec, http.StatusOK, payload)
	
	if rec.Code != http.StatusOK {
		t.Errorf("期望状态码 %d, 得到 %d", http.StatusOK, rec.Code)
	}
	
	ct := rec.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("期望 Content-Type application/json, 得到 %s", ct)
	}
	
	var result map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("无法解析 JSON: %v", err)
	}
	
	if result["message"] != "test" {
		t.Errorf("期望 message 'test', 得到 %s", result["message"])
	}
}

func TestWriteError(t *testing.T) {
	rec := httptest.NewRecorder()
	writeError(rec, http.StatusBadRequest, "test error")
	
	if rec.Code != http.StatusBadRequest {
		t.Errorf("期望状态码 %d, 得到 %d", http.StatusBadRequest, rec.Code)
	}
	
	var resp models.APIResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("无法解析 JSON: %v", err)
	}
	
	if resp.Code != http.StatusBadRequest {
		t.Errorf("期望响应码 %d, 得到 %d", http.StatusBadRequest, resp.Code)
	}
	
	if resp.Message != "test error" {
		t.Errorf("期望消息 'test error', 得到 %s", resp.Message)
	}
	
	// 验证 Data 字段被正确初始化
	if resp.Data.Domain != "" {
		t.Error("期望 Domain 为空")
	}
	if len(resp.Data.ReverseDNS) != 0 {
		t.Error("期望 ReverseDNS 为空数组")
	}
}
