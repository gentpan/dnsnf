package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTokenAuthAcceptsXInternalToken(t *testing.T) {
	auth := NewTokenAuth("secret")
	called := false
	handler := auth.Handle(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/v2/dns/history", nil)
	req.Header.Set("X-Internal-Token", "secret")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, rec.Code)
	}
	if !called {
		t.Fatal("expected wrapped handler to be called")
	}
}

func TestTokenAuthAcceptsBearerToken(t *testing.T) {
	auth := NewTokenAuth("secret")
	handler := auth.Handle(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/v2/dns/history", nil)
	req.Header.Set("Authorization", "Bearer secret")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, rec.Code)
	}
}

func TestTokenAuthRejectsMissingToken(t *testing.T) {
	auth := NewTokenAuth("secret")
	handler := auth.Handle(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/v2/dns/history", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}
}
