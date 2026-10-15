import { describe, expect, it } from 'vitest';
import { requestCookies, responseCookies } from './cookie-policy';

describe('Session cookie boundary', () => {
  it('Limits backend cookies to expected names and paths', () => {
    expect(
      responseCookies(
        ['access_token=value; Path=/unexpected; HttpOnly', 'other=value; Path=/'],
        false,
        ['access_token'],
      ),
    ).toEqual([]);
  });

  it('Makes production cookies secure and host-only', () => {
    expect(
      responseCookies(['access_token=value; Domain=api.example.test; Path=/; Max-Age=60'], true, [
        'access_token',
      ]),
    ).toEqual(['access_token=value; Path=/; Max-Age=60; HttpOnly; SameSite=Lax; Secure']);
  });

  it('Prevents refresh and unrelated cookies from reaching catalog requests', () => {
    expect(
      requestCookies('refresh_token=secret; access_token=session; other=value', ['access_token']),
    ).toBe('access_token=session');
  });
});
