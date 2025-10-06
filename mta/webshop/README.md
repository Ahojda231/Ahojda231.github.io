# Webshop (MTA Resource)

Grants items purchased on the web to the selected character using `exports.global:giveItem`.

## How it works
- Web app enqueues purchases into `web_purchase_queue` table.
- This resource polls the table periodically and for each `pending` row:
  - If the character's player is online, gives the item using `exports.global:giveItem`.
  - If offline and `fallbackToDBInsert = true`, inserts into `items` table directly.
  - Marks row as `done` or `failed` with an error message.

## Setup
1. Import SQL schema:
   - Run `web_purchase_queue.sql` against your game database.
2. Configure (optional):
   - Copy `config.lua.example` to `config.lua` and adjust polling or behavior.
3. Ensure mysql and global resources are running and exported:
   - `exports.mysql` must provide a DB connection via `getConnection()` or `getConn()`.
   - `exports.global:giveItem(element, itemId, itemValue)` must exist.
4. Start the resource:
   - Add `start webshop` to your server's resources or start in admin panel.

## Table: web_purchase_queue
- `id` INT PK AI
- `account_id` INT NOT NULL (web account id)
- `character_id` INT NOT NULL (target character id)
- `item_id` INT NOT NULL
- `item_value` VARCHAR(255) DEFAULT '1'
- `status` ENUM('pending','done','failed') DEFAULT 'pending'
- `error_text` VARCHAR(255) NULL
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- `processed_at` DATETIME NULL

## Manual processing
- Command `webshop.process` (server console) will trigger an immediate processing cycle.
