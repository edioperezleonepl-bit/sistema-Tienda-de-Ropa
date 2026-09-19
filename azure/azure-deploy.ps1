param (
    [string]$ResourceGroup = "rg-fashionstore-prod",
    [string]$Location = "eastus",
    [string]$AcrName = "acrfashionstore$((Get-Random -Minimum 1000 -Maximum 9999))",
    [string]$DbServerName = "psql-fashionstore-$((Get-Random -Minimum 1000 -Maximum 9999))",
    [string]$DbAdminUser = "fashionadmin",
    [string]$DbAdminPassword = "FashionStore2026Password!",
    [string]$AppServiceName = "app-fashionstore-$((Get-Random -Minimum 1000 -Maximum 9999))"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Despliegue de FashionStore en Microsoft Azure" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Crear Grupo de Recursos
Write-Host "[1/6] Creando Grupo de Recursos '$ResourceGroup' en '$Location'..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location

# 2. Crear Azure Database for PostgreSQL Flexible Server
Write-Host "[2/6] Creando Servidor PostgreSQL Flexible '$DbServerName'..." -ForegroundColor Yellow
az postgres flexible-server create `
    --resource-group $ResourceGroup `
    --name $DbServerName `
    --location $Location `
    --admin-user $DbAdminUser `
    --admin-password $DbAdminPassword `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 32 `
    --version 16 `
    --public-access 0.0.0.0

# Crear base de datos fashionstore
Write-Host "Creando base de datos 'fashionstore' en el servidor..." -ForegroundColor Yellow
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $DbServerName `
    --database-name fashionstore

# 3. Crear Azure Container Registry (ACR)
Write-Host "[3/6] Creando Azure Container Registry '$AcrName'..." -ForegroundColor Yellow
az acr create `
    --resource-group $ResourceGroup `
    --name $AcrName `
    --sku Basic `
    --admin-enabled true

$AcrLoginServer = (az acr show --name $AcrName --query loginServer --output tsv)
$AcrPassword = (az acr credential show --name $AcrName --query "passwords[0].value" --output tsv)

# 4. Construir y Subir Imágenes Docker a Azure ACR
Write-Host "[4/6] Construyendo y subiendo imagen Backend NestJS a ACR..." -ForegroundColor Yellow
az acr build --registry $AcrName --image fashionstore-backend:latest ./backend

Write-Host "Construyendo y subiendo imagen Frontend React a ACR..." -ForegroundColor Yellow
az acr build --registry $AcrName --image fashionstore-frontend:latest ./frontend

# 5. Desplegar Azure App Service Plan Linux
Write-Host "[5/6] Creando App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name "plan-fashionstore" `
    --resource-group $ResourceGroup `
    --location $Location `
    --is-linux `
    --sku B1

# Desplegar Web App para Backend
Write-Host "Desplegando Web App para Backend NestJS..." -ForegroundColor Yellow
az webapp create `
    --resource-group $ResourceGroup `
    --plan "plan-fashionstore" `
    --name "$AppServiceName-api" `
    --deployment-container-image-name "$AcrLoginServer/fashionstore-backend:latest"

az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name "$AppServiceName-api" `
    --settings `
        DB_HOST="$DbServerName.postgres.database.azure.com" `
        DB_PORT="5432" `
        DB_USERNAME="$DbAdminUser" `
        DB_PASSWORD="$DbAdminPassword" `
        DB_DATABASE="fashionstore" `
        DB_SSL="true" `
        PORT="3000" `
        JWT_SECRET="FashionStoreAzureSecret2026Key!"

# Desplegar Web App para Frontend React
Write-Host "Desplegando Web App para Frontend React..." -ForegroundColor Yellow
az webapp create `
    --resource-group $ResourceGroup `
    --plan "plan-fashionstore" `
    --name "$AppServiceName-web" `
    --deployment-container-image-name "$AcrLoginServer/fashionstore-frontend:latest"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " ¡DESPLIEGUE EN AZURE COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host " Backend API: https://$AppServiceName-api.azurewebsites.net/api" -ForegroundColor Green
Write-Host " Swagger Docs: https://$AppServiceName-api.azurewebsites.net/api/docs" -ForegroundColor Green
Write-Host " Frontend Web: https://$AppServiceName-web.azurewebsites.net" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
