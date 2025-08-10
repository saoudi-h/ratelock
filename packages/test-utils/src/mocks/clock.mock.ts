/**
 * Interface representing a clock with basic time operations.
 */
export interface Clock {
    now(): number
    sleep(ms: number): Promise<void>
}

/**
 * Implementation of the Clock interface for testing purposes.
 */
export class FakeClock implements Clock {
    private t = 0

    now() {
        return this.t
    }

    async sleep(ms: number) {
        this.t += ms
    }
}
