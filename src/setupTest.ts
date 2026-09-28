import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

export const server = setupServer()

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
