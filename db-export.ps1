Set-Location $PSScriptRoot

# 0. Load .env variables
if (Test-Path .env) {
    Get-Content .env | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        # Menghapus whitespace dan tanda kutip jika ada
        $cleanName = $name.Trim()
        $cleanValue = $value.Trim().Trim('"').Trim("'")
        Set-Item -Path "Env:\$cleanName" -Value $cleanValue
    }
} else {
    Write-Host ".env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "=== WAIT MYSQL READY ==="
Start-Sleep -Seconds 5

Write-Host "=== 1. ENSURE DATABASE EXISTS ==="
docker compose exec mysql mysql -u root "-p$env:DB_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $env:DB_NAME;"

if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "=== 2. SETUP USER PRIVILEGES ==="
docker compose exec mysql mysql -u root "-p$env:DB_ROOT_PASSWORD" -e "
DROP USER IF EXISTS '$env:DB_USER'@'%';
CREATE USER '$env:DB_USER'@'%' IDENTIFIED BY '$env:DB_PASSWORD';
GRANT ALL PRIVILEGES ON $env:DB_NAME.* TO '$env:DB_USER'@'%';
FLUSH PRIVILEGES;
"

if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "=== 3. RUN ALL MIGRATIONS IN ORDER ==="
# Buat tabel pencatat migrasi jika belum ada
docker compose exec -T mysql mysql -u root "-p$env:DB_ROOT_PASSWORD" $env:DB_NAME -e "
CREATE TABLE IF NOT EXISTS _migration_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"

# Mencari semua migration.sql dan mengurutkannya berdasarkan nama folder
$migrations = Get-ChildItem -Path "prisma/migrations" -Filter "migration.sql" -Recurse | Sort-Object FullName
foreach ($m in $migrations) {
    $migration_name = $m.Directory.Name
    
    # Cek apakah migrasi ini sudah pernah dijalankan
    $is_applied = docker compose exec -T mysql mysql -u root "-p$env:DB_ROOT_PASSWORD" $env:DB_NAME -N -s -e "SELECT COUNT(*) FROM _migration_log WHERE migration_name='$migration_name';"
    
    if ($is_applied.Trim() -eq "0") {
        Write-Host "Applying migration: $migration_name" -ForegroundColor Cyan
        Get-Content $m.FullName | docker compose exec -T mysql mysql -u root "-p$env:DB_ROOT_PASSWORD" $env:DB_NAME
        if ($LASTEXITCODE -ne 0) { exit 1 }
        
        # Catat ke log bahwa migrasi berhasil
        docker compose exec -T mysql mysql -u root "-p$env:DB_ROOT_PASSWORD" $env:DB_NAME -e "INSERT INTO _migration_log (migration_name) VALUES ('$migration_name');"
    } else {
        Write-Host "Skipping already applied migration: $migration_name" -ForegroundColor Gray
    }
}

Write-Host "=== 4. RUN SEEDER ==="
if (Test-Path "prisma/seeder.sql") {
    Get-Content "prisma/seeder.sql" | docker compose exec -T mysql mysql -u root "-p$env:DB_ROOT_PASSWORD" $env:DB_NAME
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

Write-Host "=== 5. VERIFY TABLES ==="
docker compose exec mysql mysql -u "$env:DB_USER" "-p$env:DB_PASSWORD" $env:DB_NAME -e "SHOW TABLES;"

Write-Host "=== DONE SUCCESS ===" -ForegroundColor Green