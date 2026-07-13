FROM golang:1.26-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/dnsnf-api ./cmd/server

FROM alpine:3.22
WORKDIR /app
RUN adduser -D -u 10001 appuser
COPY --from=builder /out/dnsnf-api /app/dnsnf-api
COPY migrations /app/migrations
USER appuser
EXPOSE 8080
CMD ["/app/dnsnf-api"]
