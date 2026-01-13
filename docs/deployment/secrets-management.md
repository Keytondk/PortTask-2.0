# Secrets Management

This guide covers secure secrets management for the Navo platform in production environments.

---

## Table of Contents

1. [Overview](#overview)
2. [Required Secrets](#required-secrets)
3. [Local Development](#local-development)
4. [Production Options](#production-options)
5. [AWS Secrets Manager](#aws-secrets-manager)
6. [HashiCorp Vault](#hashicorp-vault)
7. [Kubernetes Native Secrets](#kubernetes-native-secrets)
8. [Secret Rotation](#secret-rotation)
9. [Best Practices](#best-practices)

---

## Overview

Navo requires several secrets for secure operation:

- **Authentication**: JWT signing secrets
- **Database**: Connection credentials
- **Integrations**: API keys for external services
- **Storage**: Cloud provider credentials

**Security Requirements:**

- Never commit secrets to version control
- Use external secrets management in production
- Rotate secrets regularly
- Audit secret access
- Use least-privilege access

---

## Required Secrets

| Secret | Description | Minimum Requirements |
|--------|-------------|---------------------|
| `JWT_SECRET` | JWT signing key | 32+ characters, cryptographically random |
| `DB_PASSWORD` | PostgreSQL password | 16+ characters, complex |
| `REDIS_PASSWORD` | Redis authentication | 16+ characters (if enabled) |
| `SMTP_PASSWORD` | Email service password | Provider-specific |
| `AIS_API_KEY` | AIS provider API key | Provider-specific |
| `AWS_ACCESS_KEY_ID` | S3 storage access | IAM credentials |
| `AWS_SECRET_ACCESS_KEY` | S3 storage secret | IAM credentials |

### Generating Secure Secrets

```bash
# Generate a 64-character random secret
openssl rand -base64 48

# Generate a 32-byte hex secret
openssl rand -hex 32

# Using /dev/urandom
head -c 32 /dev/urandom | base64
```

---

## Local Development

For local development, use environment variables or `.env` files:

```bash
# .env.local (gitignored)
JWT_SECRET=dev-secret-min-32-characters-long
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/navo?sslmode=disable
REDIS_URL=redis://localhost:6379
```

**Important:** Never use development secrets in production.

---

## Production Options

### Recommended: External Secrets Operator

The [External Secrets Operator](https://external-secrets.io/) syncs secrets from external providers to Kubernetes.

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets \
  --create-namespace
```

Supported providers:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager
- 1Password

---

## AWS Secrets Manager

### Setup

1. **Create secrets in AWS Secrets Manager:**

```bash
# Create application secrets
aws secretsmanager create-secret \
  --name navo/production/secrets \
  --secret-string '{
    "jwt_secret": "your-super-secure-jwt-secret-min-32-chars",
    "db_password": "your-database-password",
    "smtp_password": "your-smtp-password",
    "ais_api_key": "your-ais-api-key"
  }'

# Create database connection secret
aws secretsmanager create-secret \
  --name navo/production/database \
  --secret-string '{
    "connection_string": "postgresql://navo:password@db.example.com:5432/navo?sslmode=require"
  }'
```

2. **Create IAM policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:navo/*"
      ]
    }
  ]
}
```

3. **Create IAM role for IRSA (EKS):**

```bash
eksctl create iamserviceaccount \
  --name external-secrets-sa \
  --namespace external-secrets \
  --cluster your-cluster-name \
  --attach-policy-arn arn:aws:iam::ACCOUNT:policy/NavoSecretsReadPolicy \
  --approve
```

4. **Apply External Secrets configuration:**

```bash
kubectl apply -f deploy/k8s/external-secrets/aws-secrets-store.yaml
```

### Verification

```bash
# Check ExternalSecret status
kubectl get externalsecret -n navo

# Check synced secret
kubectl get secret navo-secrets -n navo -o yaml
```

---

## HashiCorp Vault

### Setup

1. **Configure Vault Kubernetes authentication:**

```bash
# Enable Kubernetes auth method
vault auth enable kubernetes

# Configure auth method
vault write auth/kubernetes/config \
  kubernetes_host="https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_SERVICE_PORT" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt

# Create policy
vault policy write navo-app - <<EOF
path "secret/data/navo/*" {
  capabilities = ["read"]
}
EOF

# Create role
vault write auth/kubernetes/role/navo-app \
  bound_service_account_names=vault-auth-sa \
  bound_service_account_namespaces=external-secrets \
  policies=navo-app \
  ttl=1h
```

2. **Store secrets in Vault:**

```bash
# Store application secrets
vault kv put secret/navo/secrets \
  jwt_secret="your-super-secure-jwt-secret" \
  smtp_password="your-smtp-password" \
  ais_api_key="your-ais-api-key"

# Store database credentials
vault kv put secret/navo/database \
  username="navo" \
  password="your-db-password" \
  host="db.example.com" \
  port="5432" \
  name="navo"
```

3. **Apply External Secrets configuration:**

```bash
kubectl apply -f deploy/k8s/external-secrets/vault-secrets-store.yaml
```

---

## Kubernetes Native Secrets

For simple deployments without external secrets management:

### Using kubectl

```bash
# Create secret from literals
kubectl create secret generic navo-secrets -n navo \
  --from-literal=JWT_SECRET=$(openssl rand -base64 48) \
  --from-literal=DB_PASSWORD=your-db-password \
  --from-literal=SMTP_PASSWORD=your-smtp-password

# Create secret from file
kubectl create secret generic navo-secrets -n navo \
  --from-env-file=.env.production
```

### Using Sealed Secrets

[Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) allows encrypting secrets for GitOps:

```bash
# Install kubeseal
brew install kubeseal

# Seal a secret
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# Apply sealed secret (controller decrypts it)
kubectl apply -f sealed-secret.yaml
```

---

## Secret Rotation

### Automated Rotation with AWS

```bash
# Enable rotation for a secret
aws secretsmanager rotate-secret \
  --secret-id navo/production/database \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotation-function \
  --rotation-rules AutomaticallyAfterDays=30
```

### Manual Rotation Process

1. Generate new secret value
2. Update secret in external provider
3. Wait for External Secrets Operator to sync (default: 1h)
4. Verify application uses new secret
5. Invalidate old secret value

### JWT Secret Rotation

```bash
# 1. Generate new JWT secret
NEW_SECRET=$(openssl rand -base64 48)

# 2. Update in secrets manager
aws secretsmanager update-secret \
  --secret-id navo/production/secrets \
  --secret-string "{\"jwt_secret\": \"$NEW_SECRET\", ...}"

# 3. Rolling restart deployments
kubectl rollout restart deployment -n navo

# 4. Monitor for errors
kubectl logs -l app=gateway -n navo --tail=100 -f
```

**Note:** JWT rotation will invalidate all existing tokens. Plan for user re-authentication.

---

## Best Practices

### Do

- Use external secrets management in production
- Rotate secrets regularly (90 days max for credentials)
- Use separate secrets for each environment
- Audit secret access
- Use service accounts with minimal permissions
- Encrypt secrets at rest and in transit
- Use managed database credentials (RDS IAM auth, etc.)

### Don't

- Commit secrets to version control
- Log secret values
- Share secrets between environments
- Use the same secret for multiple purposes
- Store secrets in ConfigMaps
- Hardcode secrets in application code

### Environment Separation

| Environment | Secrets Source | Rotation |
|-------------|---------------|----------|
| Local Dev | `.env.local` file | N/A |
| CI/CD | GitHub/GitLab secrets | On change |
| Staging | AWS Secrets Manager | 90 days |
| Production | AWS Secrets Manager | 30 days |

### Monitoring & Alerts

Set up alerts for:

- Secret access from unexpected sources
- Failed secret retrieval
- Secrets approaching rotation deadline
- ExternalSecret sync failures

```yaml
# Example Prometheus alert
- alert: ExternalSecretSyncFailed
  expr: externalsecret_status_condition{condition="Ready",status="False"} == 1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "ExternalSecret {{ $labels.name }} sync failed"
```

---

## Troubleshooting

### External Secret Not Syncing

```bash
# Check ExternalSecret status
kubectl describe externalsecret navo-secrets -n navo

# Check operator logs
kubectl logs -n external-secrets -l app.kubernetes.io/name=external-secrets

# Force sync
kubectl annotate externalsecret navo-secrets -n navo \
  force-sync=$(date +%s) --overwrite
```

### Permission Denied

1. Verify IAM role/policy permissions
2. Check service account annotations
3. Verify Vault policy allows access
4. Check secret path is correct

### Secret Not Found

1. Verify secret exists in provider
2. Check secret name/path matches configuration
3. Verify region/endpoint is correct

---

## Related Documentation

- [Production Deployment](./production.md)
- [Security Architecture](../architecture/security.md)
- [Incident Response](../runbooks/incident-response.md)
