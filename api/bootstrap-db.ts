/**
 * Creates database tables if they do not exist yet.
 * Runs at server startup; failures are logged but never crash the app,
 * so the landing page still renders even if the DB is temporarily down.
 */
import mysql from "mysql2/promise";
import { env } from "./lib/env";

const DDL = [
  `CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    comment TEXT,
    status ENUM('new','in_progress','awaiting_feedback','in_revision','completed') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    sender ENUM('customer','studio') NOT NULL,
    text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (order_id),
    CONSTRAINT messages_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS files (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    message_id BIGINT UNSIGNED NULL,
    kind ENUM('input','result','attachment') NOT NULL DEFAULT 'input',
    file_name VARCHAR(512) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size INT NOT NULL,
    storage_path VARCHAR(1024) NOT NULL,
    caption TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (order_id),
    INDEX (message_id),
    CONSTRAINT files_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT files_message_fk FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS examples (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS example_photos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    example_id BIGINT UNSIGNED NOT NULL,
    storage_path VARCHAR(1024) NOT NULL,
    mime_type VARCHAR(255) NOT NULL DEFAULT 'image/jpeg',
    caption TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (example_id),
    CONSTRAINT example_photos_example_fk FOREIGN KEY (example_id) REFERENCES examples(id) ON DELETE CASCADE
  )`,
];

export async function ensureSchema(): Promise<void> {
  if (!env.databaseUrl) {
    console.log("[db] DATABASE_URL not set — skipping schema ensure");
    return;
  }
  try {
    const conn = await mysql.createConnection(env.databaseUrl);
    for (const stmt of DDL) {
      await conn.query(stmt);
    }
    await conn.end();
    console.log("[db] schema ensured");
  } catch (err) {
    console.error("[db] schema ensure failed (non-fatal):", (err as Error).message);
  }
}
