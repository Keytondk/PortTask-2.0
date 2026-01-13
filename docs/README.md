# Navo Documentation

Welcome to the Navo Maritime Operations Platform documentation.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture Overview](./architecture/overview.md) | System architecture and design |
| [Getting Started](./development/getting-started.md) | Developer onboarding guide |
| [API Reference](./api/README.md) | REST and WebSocket API docs |
| [Local Setup](./deployment/local-setup.md) | Development environment setup |

---

## Documentation Structure

### Architecture

Technical architecture and design documentation.

- [**Overview**](./architecture/overview.md) - System architecture, technology stack, and design principles
- [**Services**](./architecture/services.md) - Detailed documentation for each microservice
- [**Security**](./architecture/security.md) - Security architecture, authentication, and authorization
- [**Data Model**](./architecture/data-model.md) - Database schema and entity relationships

### API Reference

API documentation for developers.

- [**API Reference**](./api/README.md) - REST API endpoints, authentication, and examples
- [**OpenAPI Spec**](./api/openapi.yaml) - OpenAPI 3.1 specification

### Development

Guides for developers.

- [**Getting Started**](./development/getting-started.md) - Developer onboarding and workflow

### Deployment

Deployment and operations guides.

- [**Local Setup**](./deployment/local-setup.md) - Setting up local development environment
- [**Production**](./deployment/production.md) - Production deployment guide

### Runbooks

Operational procedures.

- [**Incident Response**](./runbooks/incident-response.md) - Incident response procedures

### Reference

Additional documentation.

- [**Executive Summary**](./executive-summary.md) - Platform overview for stakeholders
- [**Technical Specification**](./technical-specification.md) - Detailed technical requirements
- [**Frontend Design**](./frontend-design.md) - UI/UX design guidelines

---

## Platform Overview

Navo is an enterprise-grade maritime operations SaaS platform designed for:

- **Port Call Management** - Track vessel arrivals, departures, and berth assignments
- **Service Ordering** - Request and manage port services
- **Vendor Management** - RFQ workflow and vendor relationships
- **Vessel Tracking** - Real-time AIS integration and fleet monitoring
- **Analytics** - Operational insights and reporting

### Applications

| App | Purpose | Users |
|-----|---------|-------|
| **Key** | Main operations platform | Operators, agents, dispatchers |
| **Portal** | Customer-facing portal | Ship owners, charterers |
| **Vendor** | Service provider interface | Vendors, suppliers |

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Go 1.22, Chi router |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Real-time | WebSockets |
| Storage | S3-compatible |

---

## Getting Help

- **Documentation Issues**: Create a PR or issue in the repository
- **Development Questions**: #navo-dev Slack channel
- **Production Issues**: See [Incident Response](./runbooks/incident-response.md)

---

## Contributing to Documentation

1. Fork the repository
2. Create a branch for your changes
3. Follow the existing documentation style
4. Submit a PR for review

### Documentation Style Guide

- Use Markdown with GitHub-flavored extensions
- Include code examples where helpful
- Keep content up-to-date with code changes
- Use diagrams (Mermaid or ASCII) for complex concepts
- Link to related documentation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial documentation |
