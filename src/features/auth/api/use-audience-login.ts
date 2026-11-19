'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { loginSchema } from '@/lib/api/contracts';
import { loginDestination, type LoginAudience } from '../lib/login-destination';
import { safeReturnPath } from '../lib/return-path';
import { useLogin, useLogout } from './auth-queries';

// Signs in, then signs out again when the role belongs to the other login page.
export function useAudienceLogin(audience: LoginAudience) {
  const login = useLogin();
  const logout = useLogout();
  const router = useRouter();
  const returnTo = safeReturnPath(useSearchParams().get('returnTo'));
  const [validationError, setValidationError] = useState('');
  const [wrongRole, setWrongRole] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: String(data.get('email') ?? '').trim(),
      password: data.get('password'),
    });
    setWrongRole(false);
    if (!result.success) {
      setValidationError('Vui lòng nhập email hợp lệ và mật khẩu từ 1 đến 128 ký tự.');
      return;
    }
    setValidationError('');
    try {
      const response = await login.mutateAsync(result.data);
      const destination = loginDestination(audience, response.user.role, returnTo);
      if (destination) {
        router.replace(destination);
        return;
      }
      setWrongRole(true);
      await logout.mutateAsync();
    } catch {
      /* Mutation renders its error in the form. */
    }
  }

  return {
    submit,
    returnTo,
    wrongRole,
    pending: login.isPending || logout.isPending,
    error:
      validationError ||
      (login.error instanceof ApiError && login.error.status === 429
        ? 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau khoảng 15 phút.'
        : login.isError
          ? 'Đăng nhập chưa thành công. Vui lòng kiểm tra email, mật khẩu và trạng thái xác thực tài khoản.'
          : ''),
  };
}
