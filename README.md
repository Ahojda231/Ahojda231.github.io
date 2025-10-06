# MTA Server Web Interface

A modern web interface for MTA (Multi Theft Auto) server built with Next.js.

Last updated: 2025-08-18 04:52 loginem napojeným na MTA `accounts` tabulku (bcrypt `$2y$` hash). Připraveno pro Vercel.

## Deploy na Vercel
1. Commit/push kód do repozitáře `saukrr/MTA-WEB` (branch `main`).
2. Na Vercel přidejte projekt z tohoto repa.
3. V sekci Environment Variables nastavte:
   - `DB_HOST`
   - `DB_PORT` (např. 3306)
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
   - `NEXTAUTH_SECRET` (silný náhodný string)
   - `NEXTAUTH_URL` (Vercel production URL)
4. Redeploy.

## Struktura
- `app/` App router, stránky `/`, `/login`, `/dashboard`
- `app/api/auth/[...nextauth]/route.ts` NextAuth Credentials
- `lib/db.ts` MySQL pool
- `lib/auth.ts` NextAuth options (bcrypt normalizace `$2y$` -> `$2b$`)
- `middleware.ts` ochrana `/dashboard`

## Poznámky k bcrypt `$2y$`
Node bcrypt/bcryptjs porovnání řešíme normalizací prefixu `$2y$` na `$2b$` před `compare()`.
