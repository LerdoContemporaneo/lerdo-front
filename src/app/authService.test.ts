import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginApi, checkMeApi, logoutApi } from './services/authService';

describe('authService', () => {
  const OLD = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test';
    // @ts-ignore
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = OLD;
    vi.restoreAllMocks();
  });

  it('loginApi returns data on success', async () => {
    // @ts-ignore
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uuid: '1', name: 'Test', email: 'a@b', role: 'admin' }),
    });

    const res = await loginApi('a@b', 'pass');
    expect(res).toHaveProperty('uuid', '1');
  });

  it('loginApi throws on error', async () => {
    // @ts-ignore
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ msg: 'credenciales invalidas' }),
    });

    await expect(loginApi('a','b')).rejects.toThrow('credenciales invalidas');
  });

  it('checkMeApi returns data when ok', async () => {
    // @ts-ignore
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ uuid:'1', name:'x', email:'e', role:'user' }) });
    const res = await checkMeApi();
    expect(res?.email).toBe('e');
  });

  it('logoutApi calls endpoint', async () => {
    // @ts-ignore
    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    await logoutApi();
    expect(global.fetch).toHaveBeenCalledWith('http://api.test/logout', { method: 'DELETE', credentials: 'include' });
  });
});
