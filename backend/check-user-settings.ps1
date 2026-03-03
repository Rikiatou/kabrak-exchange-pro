# Script pour vérifier les settings d'un utilisateur via l'API

# Fonction pour faire une requête authentifiée
function Get-UserSettings {
    param($email, $password)
    
    # Login
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "https://kabrak-exchange-pro-production.up.railway.app/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success) {
        $token = $loginResponse.data.token
        Write-Host "✅ Login réussi pour $email" -ForegroundColor Green
        
        # Get settings
        $headers = @{
            Authorization = "Bearer $token"
        }
        
        $settings = Invoke-RestMethod -Uri "https://kabrak-exchange-pro-production.up.railway.app/api/settings" -Method GET -Headers $headers
        
        Write-Host "`n📋 Settings pour $email :" -ForegroundColor Cyan
        Write-Host "  BusinessName: $($settings.data.businessName)" -ForegroundColor Yellow
        Write-Host "  BusinessLogo: $($settings.data.businessLogo)" -ForegroundColor Yellow
        Write-Host "  BusinessPhone: $($settings.data.businessPhone)" -ForegroundColor Yellow
        
        return $settings.data
    } else {
        Write-Host "❌ Login échoué pour $email" -ForegroundColor Red
        return $null
    }
}

# Tester avec inoua10@gmail.com
Write-Host "=== VÉRIFICATION DES SETTINGS ===" -ForegroundColor Magenta
Write-Host ""

# Demander le mot de passe
$password = Read-Host "Entrez le mot de passe pour inoua10@gmail.com"

Get-UserSettings -email "inoua10@gmail.com" -password $password
