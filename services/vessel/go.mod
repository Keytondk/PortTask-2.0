module github.com/navo/services/vessel

go 1.22

require (
	github.com/go-chi/chi/v5 v5.0.12
	github.com/go-redis/redis/v8 v8.11.5
	github.com/jackc/pgx/v5 v5.5.5
	github.com/navo/pkg v0.0.0
	github.com/rs/xid v1.5.0
)

replace github.com/navo/pkg => ../../pkg
