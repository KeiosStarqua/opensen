import { Hono } from 'hono'
import { authenticate } from './session.js'

/** Mounts `router` behind `authenticate` so every request runs as `userId`. */
export function signedInAs(router: Hono, userId: string) {
  const app = new Hono()
  app.use(authenticate(async () => ({ userId })))
  app.route('/', router)

  return {
    request(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers)
      headers.set('authorization', 'Bearer test-token')
      return app.request(path, { ...init, headers })
    },
  }
}
