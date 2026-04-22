-- ============================================================
--  CertiVerifier – MySQL Schema
--  Run once:  mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS certiverifier
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE certiverifier;

-- ── users ────────────────────────────────────────────────────────────────────
-- Stores all user profiles (Admin / Verifier / Student).
-- wallet_address is the unique identifier; name + role used for simple login.
CREATE TABLE IF NOT EXISTS users (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42)  NOT NULL UNIQUE,
    name           VARCHAR(255) NOT NULL,
    role           ENUM('ADMIN','VERIFIER','STUDENT') NOT NULL,
    organization   VARCHAR(255),                      -- Admin / Verifier only
    student_id     VARCHAR(100),                      -- Student only
    joined_date    BIGINT       NOT NULL,              -- JS Date.now()
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_users_wallet (wallet_address),
    INDEX idx_users_role   (role)
) ENGINE=InnoDB;

-- ── certificates ─────────────────────────────────────────────────────────────
-- Stores full certificate metadata.
-- certificate_hash is also recorded on the Sepolia blockchain (source of truth).
-- tx_hash is the Sepolia transaction that anchored this certificate on-chain.
CREATE TABLE IF NOT EXISTS certificates (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id   VARCHAR(20)  NOT NULL UNIQUE,     -- e.g. "CV-ABC12345"
    student_id       VARCHAR(100) NOT NULL,
    student_name     VARCHAR(255) NOT NULL,
    course           VARCHAR(255) NOT NULL,
    year             VARCHAR(10)  NOT NULL,
    issuer_id        VARCHAR(42)  NOT NULL,             -- admin wallet address
    issuer_name      VARCHAR(255) NOT NULL,
    issue_date       BIGINT       NOT NULL,             -- JS Date.now()
    certificate_hash VARCHAR(66)  NOT NULL UNIQUE,      -- 0x + 64 hex chars (SHA-256)
    ipfs_link        VARCHAR(500),
    template_image   LONGTEXT,                          -- base64 background image
    qr_config        JSON,                              -- { x, y, size }
    tx_hash          VARCHAR(66),                       -- Sepolia tx hash (filled after on-chain confirmation)
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_certs_student   (student_id),
    INDEX idx_certs_issuer    (issuer_id),
    INDEX idx_certs_hash      (certificate_hash),
    INDEX idx_certs_tx        (tx_hash)
) ENGINE=InnoDB;

-- ── verification_logs ────────────────────────────────────────────────────────
-- Every verification attempt (successful or not) is logged here.
CREATE TABLE IF NOT EXISTS verification_logs (
    id               VARCHAR(50)  NOT NULL PRIMARY KEY,
    verifier_id      VARCHAR(42)  NOT NULL,
    certificate_hash VARCHAR(66)  NOT NULL,
    timestamp        BIGINT       NOT NULL,
    is_valid         BOOLEAN      NOT NULL,
    notes            TEXT,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_vlogs_verifier (verifier_id),
    INDEX idx_vlogs_hash     (certificate_hash)
) ENGINE=InnoDB;

-- ── student_uploads ──────────────────────────────────────────────────────────
-- Student self-uploaded documents (internship letters, workshop certificates, etc.)
CREATE TABLE IF NOT EXISTS student_uploads (
    id          VARCHAR(50)  NOT NULL PRIMARY KEY,
    student_id  VARCHAR(100) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    category    ENUM('INTERNSHIP','WORKSHOP','COURSE','OTHER') NOT NULL,
    issuer      VARCHAR(255) NOT NULL,
    date        VARCHAR(50)  NOT NULL,
    description TEXT,
    timestamp   BIGINT       NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_uploads_student (student_id)
) ENGINE=InnoDB;
