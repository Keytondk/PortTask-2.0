package repository

import (
	"context"
	"database/sql"
)

// DBTX defines the interface for database operations
// satisfied by *sql.DB and *sql.Tx
type DBTX interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

type contextKey string

const (
	// TxKey is the key for storing transaction in context
	TxKey contextKey = "db_tx"
)

// GetDB returns the transaction from context if available, otherwise dataDB
func GetDB(ctx context.Context, defaultDB DBTX) DBTX {
	if tx, ok := ctx.Value(TxKey).(DBTX); ok {
		return tx
	}
	return defaultDB
}
