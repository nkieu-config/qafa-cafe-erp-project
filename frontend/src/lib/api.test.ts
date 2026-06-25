import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAPI } from './api';

describe('fetchAPI', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws with helpful message when network fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    await expect(fetchAPI('/health')).rejects.toThrow(/Unable to reach the API/);
  });

  it('throws on non-ok responses with server message', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response);

    await expect(fetchAPI('/auth/login', { method: 'POST' })).rejects.toThrow(
      'Invalid credentials',
    );
  });

  it('returns parsed JSON on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ status: 'ok' }),
    } as Response);

    await expect(fetchAPI('/health')).resolves.toEqual({ status: 'ok' });
  });

  it('attaches bearer token from localStorage', async () => {
    localStorage.setItem('token', 'test-jwt');
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => '{}',
    } as Response);

    await fetchAPI('/branches');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt',
        }),
      }),
    );
  });
});
