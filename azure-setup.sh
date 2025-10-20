#!/bin/bash
# =======================
# 🌐 Ailydian Azure API Key Setup – Sprint Prompt
# Mode: White-Hat / 0 Error / Auto
# =======================

set -e  # Exit on error

echo "🚀 Ailydian Azure Setup Script"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Azure CLI
echo -e "${BLUE}🔍 Checking Azure CLI installation...${NC}"
if ! command -v az &> /dev/null; then
    echo -e "${YELLOW}⚠️  Azure CLI not found. Install with: brew install azure-cli${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Azure CLI found${NC}"
echo ""

# 2. Azure CLI login (interactive)
echo -e "${BLUE}🔐 Step 1: Azure Login${NC}"
echo "Please complete the login process..."
az login --use-device-code

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Login failed. Please try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

# 3. Get subscription info
echo -e "${BLUE}📋 Step 2: Getting subscription info...${NC}"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
echo -e "Subscription ID: ${GREEN}$SUBSCRIPTION_ID${NC}"
echo -e "Tenant ID: ${GREEN}$TENANT_ID${NC}"
az account set --subscription $SUBSCRIPTION_ID
echo ""

# 4. Create App Registration
echo -e "${BLUE}🏗️  Step 3: Creating App Registration (Ailydian-Gateway)...${NC}"
APP_NAME="Ailydian-Gateway"

# Check if app already exists
EXISTING_APP=$(az ad app list --display-name $APP_NAME --query "[0].appId" -o tsv 2>/dev/null)

if [ -z "$EXISTING_APP" ]; then
    echo "Creating new app registration..."
    az ad app create \
      --display-name $APP_NAME \
      --sign-in-audience "AzureADMyOrg" \
      --enable-id-token-issuance true \
      --enable-access-token-issuance true

    APP_ID=$(az ad app list --display-name $APP_NAME --query "[0].appId" -o tsv)
    echo -e "${GREEN}✅ App created: $APP_ID${NC}"
else
    APP_ID=$EXISTING_APP
    echo -e "${YELLOW}⚠️  App already exists: $APP_ID${NC}"
fi
echo ""

# 5. Create Client Secret
echo -e "${BLUE}🔑 Step 4: Creating Client Secret...${NC}"
SECRET=$(az ad app credential reset \
  --id $APP_ID \
  --append \
  --display-name "Ailydian-Secret-$(date +%Y%m%d)" \
  --years 2 \
  --query password -o tsv)
echo -e "${GREEN}✅ Secret created (will be saved to .env.local)${NC}"
echo ""

# 6. Add API Permissions
echo -e "${BLUE}🔐 Step 5: Adding API permissions...${NC}"
# Microsoft Graph - User.Read
az ad app permission add --id $APP_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope 2>/dev/null || echo "Permission already added"
# Cognitive Services - user_impersonation
az ad app permission add --id $APP_ID --api 00000002-0000-0000-c000-000000000000 --api-permissions user_impersonation=Scope 2>/dev/null || echo "Permission already added"

echo "Granting admin consent (may require tenant admin)..."
az ad app permission grant --id $APP_ID --api 00000003-0000-0000-c000-000000000000 2>/dev/null || echo "Grant may require admin approval in portal"
echo -e "${GREEN}✅ Permissions configured${NC}"
echo ""

# 7. Get Azure OpenAI Resource Keys (if exists)
echo -e "${BLUE}🤖 Step 6: Checking Azure OpenAI resources...${NC}"
RESOURCE_GROUP="Ailydian-RG"
RESOURCE_NAME="Ailydian-OpenAI"

# List all resource groups
echo "Available resource groups:"
az group list --query "[].name" -o tsv

# Check if resource exists
ENDPOINT=""
API_KEY=""

RESOURCE_EXISTS=$(az cognitiveservices account list --query "[?name=='$RESOURCE_NAME'].name" -o tsv 2>/dev/null)

if [ -n "$RESOURCE_EXISTS" ]; then
    echo -e "${GREEN}✅ Found Azure OpenAI resource: $RESOURCE_NAME${NC}"

    ENDPOINT=$(az cognitiveservices account show \
      --name $RESOURCE_NAME \
      --resource-group $RESOURCE_GROUP \
      --query properties.endpoint -o tsv)

    API_KEY=$(az cognitiveservices account keys list \
      --name $RESOURCE_NAME \
      --resource-group $RESOURCE_GROUP \
      --query key1 -o tsv)
else
    echo -e "${YELLOW}⚠️  No Azure OpenAI resource named '$RESOURCE_NAME' found${NC}"
    echo "You can create one in Azure Portal or use existing resources"

    # Try to find any OpenAI resource
    ANY_OPENAI=$(az cognitiveservices account list --query "[?kind=='OpenAI'] | [0]" -o json 2>/dev/null)
    if [ "$ANY_OPENAI" != "null" ] && [ -n "$ANY_OPENAI" ]; then
        FOUND_NAME=$(echo $ANY_OPENAI | jq -r '.name')
        FOUND_RG=$(echo $ANY_OPENAI | jq -r '.resourceGroup')
        echo -e "${BLUE}Found alternative OpenAI resource: $FOUND_NAME in $FOUND_RG${NC}"

        ENDPOINT=$(az cognitiveservices account show \
          --name $FOUND_NAME \
          --resource-group $FOUND_RG \
          --query properties.endpoint -o tsv)

        API_KEY=$(az cognitiveservices account keys list \
          --name $FOUND_NAME \
          --resource-group $FOUND_RG \
          --query key1 -o tsv)
    fi
fi
echo ""

# 8. Create .env.local file
echo -e "${BLUE}📝 Step 7: Creating .env.local file...${NC}"
cat <<EOT > .env.local
# ===================================================================
# AILYDIAN AZURE CONFIGURATION - AUTO-GENERATED $(date)
# ===================================================================

# Azure App Registration (Ailydian-Gateway)
AZURE_TENANT_ID=$TENANT_ID
AZURE_CLIENT_ID=$APP_ID
AZURE_CLIENT_SECRET=$SECRET
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=${ENDPOINT:-"https://your-resource.openai.azure.com"}
AZURE_OPENAI_API_KEY=${API_KEY:-"your-api-key-here"}
AZURE_OPENAI_DEPLOYMENT_GPT4=gpt-4-turbo
AZURE_OPENAI_DEPLOYMENT_GPT35=gpt-35-turbo

# ===================================================================
# NEXT STEPS:
# 1. If AZURE_OPENAI_ENDPOINT is still a placeholder, create an
#    Azure OpenAI resource in portal.azure.com
# 2. Copy values from .env.local to your main .env file
# 3. Update deployment names if different
# 4. Test with: node test-azure-openai.js
# ===================================================================
EOT

echo -e "${GREEN}✅ Configuration saved to .env.local${NC}"
echo ""

# 9. Summary
echo "================================"
echo -e "${GREEN}🎉 Azure Setup Complete!${NC}"
echo "================================"
echo ""
echo "📋 Summary:"
echo "  • App Registration ID: $APP_ID"
echo "  • Tenant ID: $TENANT_ID"
echo "  • Subscription ID: $SUBSCRIPTION_ID"
if [ -n "$ENDPOINT" ]; then
    echo "  • OpenAI Endpoint: $ENDPOINT"
fi
echo ""
echo "📁 Files created:"
echo "  • .env.local (with all credentials)"
echo ""
echo "🔄 Next steps:"
echo "  1. Review .env.local file"
echo "  2. Copy Azure credentials to main .env file"
echo "  3. If no Azure OpenAI endpoint, create one at portal.azure.com"
echo "  4. Test integration with your application"
echo ""
echo "⚠️  SECURITY: Never commit .env.local to version control!"
echo ""
