import { afterEach, beforeEach, vi } from 'vitest'

export function setupFactoryTest() {
    return {
        beforeEach: () => {
            beforeEach(() => {
                vi.clearAllMocks()
            })
        },
        afterEach: () => {
            afterEach(() => {
                vi.clearAllMocks()
            })
        },
    }
}
