FROM golang:1.26-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/giantaccel-server ./cmd/server

FROM alpine:3.22
WORKDIR /app
RUN adduser -D -u 10001 appuser
COPY --from=builder /out/giantaccel-server /app/giantaccel-server
COPY migrations /app/migrations
USER appuser
EXPOSE 8080
CMD ["/app/giantaccel-server"]
