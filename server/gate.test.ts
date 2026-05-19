import { describe, expect, it, afterEach } from 'vitest'
import { verifyGateUnlock } from './gate.cjs'

describe('verifyGateUnlock', () => {
  const originalSecret = process.env.GATE_SECRET

  afterEach(() => {
    process.env.GATE_SECRET = originalSecret
  })

  it('accepts matching password secret', () => {
    process.env.GATE_SECRET = 'TEST123'
    expect(() => verifyGateUnlock({ method: 'password', secret: 'test123' })).not.toThrow()
  })

  it('rejects invalid password secret', () => {
    process.env.GATE_SECRET = 'TEST123'
    expect(() => verifyGateUnlock({ method: 'password', secret: 'wrong' })).toThrow(
      'Invalid gate secret',
    )
  })

  it('allows shortcut when enabled', () => {
    process.env.GATE_ALLOW_SHORTCUT = 'true'
    expect(() => verifyGateUnlock({ method: 'shortcut' })).not.toThrow()
  })
})
