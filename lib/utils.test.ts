import { expect, test, describe } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
    test('merges class names correctly', () => {
        expect(cn('c-1', 'c-2')).toBe('c-1 c-2')
    })

    test('handles conditional classes', () => {
        expect(cn('c-1', true && 'c-2', false && 'c-3')).toBe('c-1 c-2')
    })

    test('merges tailwind classes conflict', () => {
        expect(cn('p-2 p-4')).toBe('p-4')
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    test('handles arrays and objects', () => {
        expect(cn('c-1', ['c-2', 'c-3'])).toBe('c-1 c-2 c-3')
        expect(cn('c-1', { 'c-2': true, 'c-3': false })).toBe('c-1 c-2')
    })
})
