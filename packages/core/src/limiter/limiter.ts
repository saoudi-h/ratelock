import type { BaseResult } from 'strategy/base'
import type { Storage } from '../storage/storage'
import type { Strategy } from '../strategy/strategy'

export interface Limiter<T extends BaseResult = BaseResult> {
    check(identifier: string): Promise<T>
}

export interface LimiterOptions<S extends Strategy<any> = Strategy<any>> {
    strategy: S
    storage: Storage
    errorPolicy?: 'throw' | 'allow' | 'deny'
    prefix?: string
}
