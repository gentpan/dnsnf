// Package docs provides Swagger API documentation
//
// This package contains the OpenAPI 3.0 specification for the DNS.NF API.
// The API provides DNS lookup and reverse DNS intelligence services.
package docs

import (
	_ "embed"
)

//go:embed swagger.json
var SwaggerJSON []byte

// GetSwaggerJSON returns the embedded swagger.json content
func GetSwaggerJSON() []byte {
	return SwaggerJSON
}
