import { vi, afterEach, afterAll } from 'vitest'

// Mock console methods to reduce test output noise
vi.spyOn(console, 'debug').mockImplementation(() => {})
vi.spyOn(console, 'info').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Reset mocks after all tests
afterAll(() => {
  vi.restoreAllMocks()
})