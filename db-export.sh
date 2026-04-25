#!/bin/sh
set -e

# Load .env variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found!"
  exit 1
fi

echo "=== WAIT MYSQL READY ==="
sleep 5

echo "=== 1. ENSURE DATABASE EXISTS ==="
docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

echo "=== 2. SETUP USER PRIVILEGES ==="
# Gunakan DB_USER dan DB_PASSWORD dari env
docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" -e "
DROP USER IF EXISTS '$DB_USER'@'%';
CREATE USER '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
"

echo "=== 3. RUN ALL MIGRATIONS IN ORDER ==="
# Buat tabel pencatat migrasi jika belum ada
docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME" -e "
CREATE TABLE IF NOT EXISTS _migration_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"

for migration in $(find prisma/migrations -name "migration.sql" | sort); do
  migration_name=$(basename $(dirname "$migration"))
  
  # Cek apakah migrasi ini sudah pernah dijalankan
  is_applied=$(docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME" -N -s -e "SELECT COUNT(*) FROM _migration_log WHERE migration_name='$migration_name';")
  
  if [ "$is_applied" -eq "0" ]; then
    echo "Applying migration: $migration_name"
    cat "$migration" | docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"
    # Catat ke log bahwa migrasi berhasil
    docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME" -e "INSERT INTO _migration_log (migration_name) VALUES ('$migration_name');"
  else
    echo "Skipping already applied migration: $migration_name"
  fi
done

echo "=== 4. RUN SEEDER ==="
if [ -f prisma/seeder.sql ]; then
  cat prisma/seeder.sql | docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"
else
  echo "Seeder file not found, skipping..."
fi

echo "=== 5. VERIFY TABLES ==="
docker compose exec -T mysql mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES;"

echo "=== DONE SUCCESS ==="