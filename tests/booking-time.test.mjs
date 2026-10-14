import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { bookingInputToUtc, formatDateTime, toBookingInputValue } from '../src/format.js'

test('booking time and display stay in Tashkent in different phone zones', () => {
  const moduleUrl = new URL('../src/format.js', import.meta.url).href
  for (const TZ of ['UTC', 'Asia/Tashkent', 'Europe/Berlin', 'America/Los_Angeles', 'Pacific/Auckland']) {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import { bookingInputToUtc, formatDateTime, toBookingInputValue } from ${JSON.stringify(moduleUrl)}
      console.log(JSON.stringify({
        utc: bookingInputToUtc('2026-10-15T00:30'),
        input: toBookingInputValue(new Date('2026-10-14T19:30:00Z')),
        display: formatDateTime('2026-10-14T19:30:00Z'),
        summer: bookingInputToUtc('2026-07-15T10:00'),
      }))
    `], { encoding: 'utf8', env: { ...process.env, TZ } })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout), {
      utc: '2026-10-14T19:30:00.000Z',
      input: '2026-10-15T00:30',
      display: '15.10.2026, 00:30',
      summer: '2026-07-15T05:00:00.000Z',
    }, TZ)
  }
})

test('round trip preserves selected time at midnight and on leap day', () => {
  for (const input of ['2026-12-31T23:59', '2028-02-29T00:00', '2026-01-01T00:00']) {
    assert.equal(toBookingInputValue(new Date(bookingInputToUtc(input))), input)
  }
  assert.equal(formatDateTime('2026-10-15T00:30:00+05:00'), '15.10.2026, 00:30')
})

test('invalid input is rejected before submitting a booking', () => {
  for (const value of ['', 'invalid', '2026-02-29T10:00', '2026-13-01T10:00', '2026-10-15T24:00', '2026-10-15T10:00Z']) {
    assert.throws(() => bookingInputToUtc(value), /Проверьте дату/)
  }
})
