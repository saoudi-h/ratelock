export interface Clock {
    now(): number
    sleep(ms: number): Promise<void>
}

export class FakeClock implements Clock {
    private t = 0
    now() {
        return this.t
    }
    async sleep(ms: number) {
        this.t += ms
    }
}
