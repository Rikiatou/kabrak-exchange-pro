$body = @{
    secretToken = "KABRAK_MIGRATION_2024"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://kabrak-exchange-pro-production.up.railway.app/api/migration/migrate-old-data" -Method POST -Body $body -ContentType "application/json"

Write-Host "=== RÉSULTAT MIGRATION ===" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10
Write-Host ""

if ($response.success) {
    Write-Host "Migration reussie !" -ForegroundColor Green
    Write-Host "Total migre: $($response.results.totalMigrated)" -ForegroundColor Cyan
} else {
    Write-Host "Erreur: $($response.message)" -ForegroundColor Red
}
