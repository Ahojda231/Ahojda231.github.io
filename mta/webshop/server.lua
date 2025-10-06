-- MTA: Web Shop Processor
-- Grants items purchased on the website to the correct character using exports.global:giveItem

local cfg = {
  -- DB connection is provided by exports.mysql; no credentials here
  pollIntervalMs = 5000,
  batchSize = 10,
  characterIdElementData = "dbid",
  fallbackToDBInsert = true
}

-- Load overrides from config.lua if present
local function loadConfig()
  if fileExists("config.lua") then
    local ok, confOrErr = pcall(dofile, "config.lua")
    if ok and type(confOrErr) == "table" then
      for k, v in pairs(confOrErr) do
        cfg[k] = v
      end
    else
      outputDebugString("[webshop] Failed to load config.lua: " .. tostring(confOrErr), 1)
    end
  end
  -- Resource settings can override config
  local sPoll = get("pollIntervalMs")
  if sPoll then cfg.pollIntervalMs = tonumber(sPoll) or cfg.pollIntervalMs end
  local sBatch = get("batchSize")
  if sBatch then cfg.batchSize = tonumber(sBatch) or cfg.batchSize end
  local sKey = get("characterIdElementData")
  if sKey and sKey ~= "" then cfg.characterIdElementData = sKey end
  local sFallback = get("fallbackToDBInsert")
  if sFallback ~= nil then
    local v = tostring(sFallback):lower()
    cfg.fallbackToDBInsert = (v == "1" or v == "true" or v == "yes")
  end
end

local db -- connection handle
local mysql = exports and exports.mysql or nil

local function connectDB()
  db = nil
  if mysql then
    -- Try common helpers exposed by mysql resource
    if mysql.getConnection then
      db = mysql:getConnection()
    elseif mysql.getConn then
      local ok, res = pcall(function() return mysql:getConn() end)
      if ok and res then db = res end
      if not db then
        ok, res = pcall(function() return mysql:getConn("mta") end)
        if ok and res then db = res end
      end
    end
  end
  if db then
    outputDebugString("[webshop] Using exports.mysql connection.")
  else
    outputDebugString("[webshop] Failed to get MySQL connection from exports.mysql!", 1)
  end
  return db ~= nil
end

local function getPlayerByCharacterId(charId)
  local key = cfg.characterIdElementData
  for _, plr in ipairs(getElementsByType("player")) do
    if tonumber(getElementData(plr, key)) == tonumber(charId) then
      return plr
    end
  end
  return nil
end

local function markDone(id)
  dbExec(db, "UPDATE web_purchase_queue SET status='done', processed_at=NOW(), error_text=NULL WHERE id=?", id)
end

local function markFailed(id, err)
  dbExec(db, "UPDATE web_purchase_queue SET status='failed', processed_at=NOW(), error_text=? WHERE id=?", tostring(err):sub(1, 255), id)
end

local function giveOrInsert(row)
  -- row: { id, account_id, character_id, item_id, item_value }
  local player = getPlayerByCharacterId(row.character_id)
  if isElement(player) then
    local ok, res = pcall(function()
      return exports.global:giveItem(player, tonumber(row.item_id), tostring(row.item_value or 1))
    end)
    if ok and res then
      return true, "gave_online"
    else
      return false, "give_failed: " .. tostring(res)
    end
  else
    if not cfg.fallbackToDBInsert then
      return false, "player_offline"
    end
    -- Fallback: Direct DB insert into items
    -- Use NULL slot_x/slot_y so inventory loader auto-assigns a free position
    local qok = dbExec(db, [[
      INSERT INTO items
        (`type`, `owner`, `itemID`, `itemValue`, `metadata`, `slot_x`, `slot_y`)
      VALUES
        (1, ?, ?, ?, NULL, NULL, NULL)
    ]], row.character_id, row.item_id, tostring(row.item_value or 1))
    if qok then
      return true, "inserted_offline"
    else
      return false, "db_insert_failed"
    end
  end
end

local processing = false
local function processQueue()
  if processing then return end
  processing = true
  if not db and not connectDB() then
    processing = false
    return
  end

  local qh = dbQuery(db, [[
    SELECT id, account_id, character_id, item_id, item_value
    FROM web_purchase_queue
    WHERE status = 'pending'
    ORDER BY id ASC
    LIMIT ?
  ]], cfg.batchSize)
  local rows = dbPoll(qh, -1)
  if rows and #rows > 0 then
    for _, row in ipairs(rows) do
      local ok, howOrErr = giveOrInsert(row)
      if ok then
        markDone(row.id)
        outputDebugString(string.format("[webshop] Processed id=%d char=%s item=%s (%s)", row.id, tostring(row.character_id), tostring(row.item_id), howOrErr))
      else
        markFailed(row.id, howOrErr)
        outputDebugString(string.format("[webshop] FAILED id=%d: %s", row.id, tostring(howOrErr)), 1)
      end
    end
  end
  processing = false
end

addEventHandler("onResourceStart", resourceRoot, function()
  loadConfig()
  if connectDB() then
    outputDebugString("[webshop] Resource started; polling every " .. tostring(cfg.pollIntervalMs) .. " ms")
  end
  setTimer(processQueue, cfg.pollIntervalMs, 0)
end)

addCommandHandler("webshop.process", function(player)
  if isElement(player) then return end -- server console only
  processQueue()
end)
