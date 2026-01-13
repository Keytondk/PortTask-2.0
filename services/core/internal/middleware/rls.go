package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/navo/pkg/logger"
	"github.com/navo/services/core/internal/repository"
	"go.uber.org/zap"
)

// responseWriter is a wrapper to capture status code
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

// TransactionalRLS middleware wraps the request in a transaction and sets RLS context
func TransactionalRLS(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip for health checks or public routes if needed
			if r.URL.Path == "/health" {
				next.ServeHTTP(w, r)
				return
			}

			// Get context
			ctx := r.Context()
			orgID := GetOrganizationID(ctx)
			userID := GetUserID(ctx)
			isAdmin := IsAdmin(ctx)

			// If no org ID (and not admin specific route?), maybe request doesn't need RLS?
			// But for safety, we allow it to proceed, logic will fail if it tries to access tenant data.
			// Ideally we require OrgID for RLS tables.

			// Begin Transaction
			tx, err := db.BeginTx(ctx, nil)
			if err != nil {
				logger.Error("Failed to begin transaction", zap.Error(err))
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}

			// Defer Rollback (will be ignored if committed)
			defer tx.Rollback()

			// Set RLS variables
			// We MUST use the tx for this
			if orgID != "" {
				_, err = tx.ExecContext(ctx, "SET LOCAL app.current_organization_id = $1", orgID)
				if err != nil {
					logger.Error("Failed to set app.current_organization_id", zap.Error(err))
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
					return
				}
			}

			if userID != "" {
				_, err = tx.ExecContext(ctx, "SET LOCAL app.current_user_id = $1", userID)
				if err != nil {
					logger.Error("Failed to set app.current_user_id", zap.Error(err))
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
					return
				}
			}

			if isAdmin {
				_, err = tx.ExecContext(ctx, "SET LOCAL app.current_user_is_admin = $1", "true")
				if err != nil {
					logger.Error("Failed to set app.current_user_is_admin", zap.Error(err))
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
					return
				}
			}

			// Inject Tx into context
			// We use the key defined in repository package so repos can find it
			ctx = context.WithValue(ctx, repository.TxKey, tx)

			// Wrap writer to catch errors
			rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rw, r.WithContext(ctx))

			// Commit or Rollback based on status
			if rw.status >= 200 && rw.status < 400 {
				if err := tx.Commit(); err != nil {
					logger.Error("Failed to commit transaction", zap.Error(err))
					// Too late to write header? context might be canceled
				}
			}
			// If status >= 400, defer rollback handles it
		})
	}
}
