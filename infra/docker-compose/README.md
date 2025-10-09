# 🐳 LYDIAN SDK - DOCKER COMPOSE

Local development environment with all required services.

## 📦 Services

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **Postgres** | 5432 | Database | `pg_isready -U lydian` |
| **Redis** | 6379 | Cache | `redis-cli ping` |
| **Vault** | 8200 | Secrets | `vault status` |
| **Kafka** | 9092 | Events | `kafka-topics.sh --list` |
| **Temporal** | 7233, 8088 | Workflows | `tctl cluster health` |
| **Prometheus** | 9090 | Metrics | `/-/healthy` |
| **Grafana** | 3003 | Dashboards | `/api/health` |
| **PgAdmin** | 5050 | DB UI | - |

## 🚀 Quick Start

```bash
# 1. Start all services
cd infra/docker-compose
docker-compose up -d

# 2. Check status
docker-compose ps

# 3. View logs
docker-compose logs -f

# 4. Stop all services
docker-compose down

# 5. Stop and remove volumes
docker-compose down -v
```

## 🔑 Default Credentials

### Postgres
- **Host:** localhost:5432
- **Database:** lydian
- **User:** lydian
- **Password:** lydian_dev_password

### Redis
- **Host:** localhost:6379
- **Password:** lydian_dev_redis

### Vault
- **URL:** http://localhost:8200
- **Token:** lydian-dev-root-token

### Grafana
- **URL:** http://localhost:3003
- **User:** admin
- **Password:** lydian_dev_grafana

### PgAdmin
- **URL:** http://localhost:5050
- **Email:** admin@ailydian.com
- **Password:** lydian_dev_pgadmin

## 📊 Access URLs

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3003
- **Temporal UI:** http://localhost:8088
- **Vault:** http://localhost:8200
- **PgAdmin:** http://localhost:5050

## 🔧 Configuration

### Prometheus

Config: `./prometheus/prometheus.yml`

Scrapes:
- Gateway API (host.docker.internal:3100/metrics)
- Orchestrator (host.docker.internal:3200/metrics)
- Chat UI (host.docker.internal:3001/api/metrics)
- Console (host.docker.internal:3000/api/metrics)

### Grafana

Provisioning:
- Datasources: `./grafana/provisioning/datasources/`
- Dashboards: `./grafana/provisioning/dashboards/`

Dashboards location: `./grafana/dashboards/`

### Postgres

Init scripts: `./init-scripts/`

Automatically executed on first startup:
- Creates extensions (uuid-ossp, pg_trgm, btree_gin)
- Creates schemas (lydian_app, lydian_temporal, lydian_audit)
- Creates audit log table and trigger

## 🔍 Health Checks

```bash
# Check all services health
docker-compose ps

# Check specific service
docker-compose exec postgres pg_isready -U lydian
docker-compose exec redis redis-cli ping
docker-compose exec vault vault status

# Check logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs kafka
```

## 🧹 Maintenance

### Clean up

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Prune system
docker system prune -a --volumes
```

### Restart single service

```bash
docker-compose restart postgres
docker-compose restart redis
docker-compose restart kafka
```

### View resource usage

```bash
docker stats
```

## 🐛 Troubleshooting

### Port already in use

```bash
# Find process using port 5432
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Service won't start

```bash
# Check logs
docker-compose logs <service-name>

# Recreate service
docker-compose up -d --force-recreate <service-name>
```

### Out of disk space

```bash
# Check docker disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

## 📝 Notes

- **Dev only:** These credentials are for local development ONLY
- **No production secrets:** Never use these in production
- **Volumes:** Data persists in Docker volumes
- **Network:** All services on `lydian-network` bridge
- **Health checks:** Automatic retry on failure

## 🔐 Security

- All passwords are in `.env.example`
- Vault in dev mode (NOT for production)
- No TLS/SSL (local only)
- No authentication on some services (local only)

## 📚 References

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Postgres](https://www.postgresql.org/docs/)
- [Redis](https://redis.io/documentation)
- [Vault](https://www.vaultproject.io/docs)
- [Kafka](https://kafka.apache.org/documentation/)
- [Temporal](https://docs.temporal.io/)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)
