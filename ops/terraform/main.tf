terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.75"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.45"
    }
  }

  backend "azurerm" {
    resource_group_name  = "lydian-terraform-state"
    storage_account_name = "lydiansastate"
    container_name       = "tfstate"
    key                  = "lydian-iq-v3.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

# Variables
variable "environment" {
  type    = string
  default = "production"
}

variable "location" {
  type    = string
  default = "westeurope"
}

variable "app_version" {
  type    = string
  default = "3.0.1"
}

# Resource Group
resource "azurerm_resource_group" "lydian_iq" {
  name     = "rg-lydian-iq-${var.environment}"
  location = var.location

  tags = {
    Environment = var.environment
    Application = "lydian-iq"
    Version     = var.app_version
    ManagedBy   = "terraform"
  }
}

# Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "ailydianacr"
  resource_group_name = azurerm_resource_group.lydian_iq.name
  location            = azurerm_resource_group.lydian_iq.location
  sku                 = "Premium"
  admin_enabled       = false

  georeplications {
    location = "eastus"
    tags     = {}
  }

  network_rule_set {
    default_action = "Deny"

    ip_rule {
      action   = "Allow"
      ip_range = "0.0.0.0/0" # Restrict in production
    }
  }

  tags = azurerm_resource_group.lydian_iq.tags
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "db" {
  name                = "lydian-iq-db-${var.environment}"
  resource_group_name = azurerm_resource_group.lydian_iq.name
  location            = azurerm_resource_group.lydian_iq.location

  version                      = "15"
  administrator_login          = "lydiansuperuser"
  administrator_password       = var.db_admin_password

  sku_name   = "GP_Standard_D4s_v3"
  storage_mb = 131072 # 128GB

  backup_retention_days        = 30
  geo_redundant_backup_enabled = true

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  tags = azurerm_resource_group.lydian_iq.tags
}

resource "azurerm_postgresql_flexible_server_database" "lydian_iq" {
  name      = "lydian_iq_v3"
  server_id = azurerm_postgresql_flexible_server.db.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

resource "azurerm_postgresql_flexible_server_configuration" "pgvector" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.db.id
  value     = "VECTOR,PGCRYPTO"
}

# Redis Cache
resource "azurerm_redis_cache" "cache" {
  name                = "lydian-iq-cache-${var.environment}"
  resource_group_name = azurerm_resource_group.lydian_iq.name
  location            = azurerm_resource_group.lydian_iq.location

  capacity            = 2
  family              = "P"
  sku_name            = "Premium"

  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
    maxmemory_reserved = 100
    maxfragmentationmemory_reserved = 100
  }

  tags = azurerm_resource_group.lydian_iq.tags
}

# Key Vault
resource "azurerm_key_vault" "kv" {
  name                = "lydian-iq-kv-${var.environment}"
  resource_group_name = azurerm_resource_group.lydian_iq.name
  location            = azurerm_resource_group.lydian_iq.location
  tenant_id           = data.azurerm_client_config.current.tenant_id

  sku_name = "premium"

  purge_protection_enabled   = true
  soft_delete_retention_days = 90

  network_acls {
    bypass         = "AzureServices"
    default_action = "Deny"
  }

  tags = azurerm_resource_group.lydian_iq.tags
}

data "azurerm_client_config" "current" {}

# Container App Environment
resource "azurerm_container_app_environment" "env" {
  name                = "cae-lydian-iq-${var.environment}"
  resource_group_name = azurerm_resource_group.lydian_iq.name
  location            = azurerm_resource_group.lydian_iq.location

  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id

  tags = azurerm_resource_group.lydian_iq.tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "log-lydian-iq-${var.environment}"
  resource_group_name = azurerm_resource_group.lydian_iq.name
  location            = azurerm_resource_group.lydian_iq.location
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = azurerm_resource_group.lydian_iq.tags
}

# Container App
resource "azurerm_container_app" "api" {
  name                         = "ca-lydian-iq-api"
  resource_group_name          = azurerm_resource_group.lydian_iq.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Multiple"

  template {
    min_replicas = 2
    max_replicas = 10

    container {
      name   = "lydian-iq-api"
      image  = "${azurerm_container_registry.acr.login_server}/lydian-iq-api:${var.app_version}"
      cpu    = 1.0
      memory = "2Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 3100
        path      = "/health"

        initial_delay = 30
        interval_seconds = 10
        timeout = 5
        failure_threshold = 3
      }

      readiness_probe {
        transport = "HTTP"
        port      = 3100
        path      = "/health"

        initial_delay = 10
        interval_seconds = 5
        timeout = 3
        failure_threshold = 2
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3100

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  secret {
    name  = "database-url"
    value = "postgresql://${azurerm_postgresql_flexible_server.db.administrator_login}:${var.db_admin_password}@${azurerm_postgresql_flexible_server.db.fqdn}:5432/${azurerm_postgresql_flexible_server_database.lydian_iq.name}?sslmode=require"
  }

  secret {
    name  = "redis-url"
    value = "rediss://:${azurerm_redis_cache.cache.primary_access_key}@${azurerm_redis_cache.cache.hostname}:6380"
  }

  tags = azurerm_resource_group.lydian_iq.tags
}

# DNS Zone
resource "azurerm_dns_zone" "ailydian" {
  name                = "ailydian.com"
  resource_group_name = azurerm_resource_group.lydian_iq.name

  tags = azurerm_resource_group.lydian_iq.tags
}

resource "azurerm_dns_a_record" "iq" {
  name                = "iq"
  zone_name           = azurerm_dns_zone.ailydian.name
  resource_group_name = azurerm_resource_group.lydian_iq.name
  ttl                 = 300
  records             = [azurerm_container_app.api.outbound_ip_addresses[0]]

  tags = azurerm_resource_group.lydian_iq.tags
}

# Outputs
output "api_url" {
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
  description = "API URL"
}

output "database_fqdn" {
  value       = azurerm_postgresql_flexible_server.db.fqdn
  description = "Database FQDN"
  sensitive   = true
}

output "redis_hostname" {
  value       = azurerm_redis_cache.cache.hostname
  description = "Redis hostname"
}

output "acr_login_server" {
  value       = azurerm_container_registry.acr.login_server
  description = "Container registry login server"
}
