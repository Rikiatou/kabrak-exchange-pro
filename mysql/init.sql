-- Exchange Management Database Initialization
CREATE DATABASE IF NOT EXISTS exchange_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exchange_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON exchange_db.* TO 'exchange_user'@'%';
FLUSH PRIVILEGES;
