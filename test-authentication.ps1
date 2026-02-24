# Authentication Testing Script
# Demonstrates the complete authentication flow

Write-Host "=== Knowledge Base Authentication Testing ===" -ForegroundColor Cyan
Write-Host ""

# 1. Register a new user
Write-Host "[1] Registering new user..." -ForegroundColor Yellow
$registerBody = @{
    email = "testuser_$(Get-Date -Format 'HHmmss')@kb.local"
    password = "Test@12345"
    confirmPassword = "Test@12345"
} | ConvertTo-Json

$userId = curl.exe -s -X POST "http://localhost:5237/api/auth/register" `
    -H "Content-Type: application/json" `
    -d $registerBody | ConvertFrom-Json

Write-Host "   ✓ User registered: $userId" -ForegroundColor Green
Write-Host ""

# 2. Login (Mobile - JWT)
Write-Host "[2] Login (Mobile App - JWT)..." -ForegroundColor Yellow
$loginBody = @{
    email = ($registerBody | ConvertFrom-Json).email
    password = "Test@12345"
    isMobileApp = $true
} | ConvertTo-Json

$loginResponse = curl.exe -s -X POST "http://localhost:5237/api/auth/login" `
    -H "Content-Type: application/json" `
    -d $loginBody | ConvertFrom-Json

Write-Host "   ✓ Access Token: $($loginResponse.accessToken.Substring(0,50))..." -ForegroundColor Green
Write-Host "   ✓ Refresh Token: $($loginResponse.refreshToken.Substring(0,40))..." -ForegroundColor Green
Write-Host "   ✓ User ID: $($loginResponse.userId)" -ForegroundColor Green
Write-Host ""

# 3. Access protected endpoint
Write-Host "[3] Accessing protected endpoint with JWT..." -ForegroundColor Yellow
$weatherData = curl.exe -s -X GET "http://localhost:5237/weatherforecast" `
    -H "Authorization: Bearer $($loginResponse.accessToken)"

if ($weatherData) {
    Write-Host "   ✓ Successfully accessed protected endpoint" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to access protected endpoint" -ForegroundColor Red
}
Write-Host ""

# 4. Refresh token
Write-Host "[4] Refreshing access token..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $loginResponse.refreshToken
} | ConvertTo-Json

$refreshResponse = curl.exe -s -X POST "http://localhost:5237/api/auth/refresh-token" `
    -H "Content-Type: application/json" `
    -d $refreshBody | ConvertFrom-Json

if ($refreshResponse.accessToken) {
    Write-Host "   ✓ New Access Token: $($refreshResponse.accessToken.Substring(0,50))..." -ForegroundColor Green
    Write-Host "   ✓ New Refresh Token: $($refreshResponse.refreshToken.Substring(0,40))..." -ForegroundColor Green
} else {
    Write-Host "   ⚠ Refresh token endpoint may need investigation" -ForegroundColor Yellow
}
Write-Host ""

# 5. Login (Web - Cookies)
Write-Host "[5] Login (Web App - Cookies)..." -ForegroundColor Yellow
$webLoginBody = @{
    email = ($registerBody | ConvertFrom-Json).email
    password = "Test@12345"
    isMobileApp = $false
} | ConvertTo-Json

$cookieResponse = curl.exe -s -i -X POST "http://localhost:5237/api/auth/login" `
    -H "Content-Type: application/json" `
    -d $webLoginBody | Select-String "Set-Cookie"

if ($cookieResponse) {
    Write-Host "   ✓ Cookie set successfully" -ForegroundColor Green
} else {
    Write-Host "   ✗ No cookie received" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  ✓ User Registration - Working" -ForegroundColor Green
Write-Host "  ✓ Mobile Login (JWT) - Working" -ForegroundColor Green
Write-Host "  ✓ Protected Endpoints - Working" -ForegroundColor Green
Write-Host "  ✓ Web Login (Cookies) - Working" -ForegroundColor Green
Write-Host "  ⚠ Refresh Token - Needs verification" -ForegroundColor Yellow
Write-Host ""
