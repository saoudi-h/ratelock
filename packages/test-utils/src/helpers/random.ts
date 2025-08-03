export const randomKey = (prefix = 'k') => `${prefix}:${Math.random().toString(36).slice(2, 8)}`
