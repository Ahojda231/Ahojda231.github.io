-- SQL schema for web purchase queue
CREATE TABLE IF NOT EXISTS `web_purchase_queue` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `account_id` INT NOT NULL,
  `character_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `item_value` VARCHAR(255) NOT NULL DEFAULT '1',
  `status` ENUM('pending','done','failed') NOT NULL DEFAULT 'pending',
  `error_text` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status_created` (`status`, `created_at`),
  KEY `idx_character` (`character_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
