import { config } from 'dotenv'
import { join } from 'node:path'

/**
 * Load local env files for CLI database scripts.
 * Shell variables win. `.env.local` (neon link) wins over `.env`.
 * Missing files are ignored. Call this from CLI entrypoints only — importing
 * a module must not inject `.env.local` into the test process.
 */
export function loadLocalEnv(cwd = process.cwd()): void {
  config({
    path: [join(cwd, '.env.local'), join(cwd, '.env')],
    quiet: true,
  })
}
