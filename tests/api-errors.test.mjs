import assert from 'node:assert/strict'
import { after, test } from 'node:test'

const originalFetch = globalThis.fetch
globalThis.window = { Telegram: { WebApp: { initData: 'test-init-data' } } }
const { ApiError, getProfile, createRequest, cancelRequest } = await import('../src/api.js')
after(() => { globalThis.fetch = originalFetch; delete globalThis.window })

test('API errors retain the request ID, business code and metadata', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.Authorization, 'tma test-init-data')
    return new Response(JSON.stringify({ detail: 'Conflict', error_code: 'BOOKING_TIME_IN_PAST', metadata: { field: 'start_time_est' } }), {
      status: 409, headers: { 'X-Request-ID': 'miniapp-conflict-123' },
    })
  }
  await assert.rejects(createRequest({ tenant_id: 1 }), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.requestId, 'miniapp-conflict-123')
    assert.equal(error.code, 'BOOKING_TIME_IN_PAST')
    assert.equal(error.metadata.field, 'start_time_est')
    assert.equal(error.message, 'Conflict')
    return true
  })
})

test('request ID survives empty and non-JSON server error responses', async () => {
  for (const body of ['', '<html>Gateway error</html>']) {
    globalThis.fetch = async () => new Response(body, { status: 502, headers: { 'X-Request-ID': 'gateway-error-123' } })
    await assert.rejects(getProfile(), (error) => error.requestId === 'gateway-error-123' && error.status === 502)
  }
})

test('older API errors and network failures do not invent a request ID', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 403 })
  await assert.rejects(cancelRequest(1), (error) => error.requestId === undefined && error.status === 403)
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await assert.rejects(getProfile(), (error) => error instanceof TypeError && error.requestId === undefined)
})

test('successful API responses still return the payload', async () => {
  globalThis.fetch = async () => new Response('{"id":7}', { headers: { 'X-Request-ID': 'success-123' } })
  assert.deepEqual(await getProfile(), { id: 7 })
})
