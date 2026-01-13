module github.com/navo/services/notification

go 1.22

require (
	github.com/go-chi/chi/v5 v5.0.12
	github.com/go-redis/redis/v8 v8.11.5
	github.com/navo/pkg v0.0.0
)

require (
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
)

replace github.com/navo/pkg => ../../pkg
