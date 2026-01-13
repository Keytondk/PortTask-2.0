module github.com/navo/services/gateway

go 1.22

require (
	github.com/go-chi/chi/v5 v5.0.12
	github.com/go-chi/cors v1.2.1
	github.com/go-chi/httprate v0.9.0
	github.com/navo/pkg v0.0.0
)

replace github.com/navo/pkg => ../../pkg
