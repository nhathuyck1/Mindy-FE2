const paths: Record<string, string> = {
  access_token: '/',
  refresh_token: '/api/v1/auth/refresh',
};

export function requestCookies(header: string | null, names: readonly string[]) {
  return (header ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => names.includes(part.split('=')[0]))
    .join('; ');
}

export function responseCookies(values: string[], secure: boolean, allowed: readonly string[]) {
  return values.flatMap((value) => {
    const [pair, ...attributes] = value.split(';').map((part) => part.trim());
    const name = pair.split('=')[0];
    if (!allowed.includes(name) || !Object.hasOwn(paths, name)) return [];
    const path = attributes.find((part) => /^path=/i.test(part))?.slice(5);
    if (path !== paths[name]) return [];
    const retained = attributes.filter((part) => /^(max-age|expires)=/i.test(part));
    return [
      [
        pair,
        `Path=${paths[name]}`,
        ...retained,
        'HttpOnly',
        'SameSite=Lax',
        ...(secure ? ['Secure'] : []),
      ].join('; '),
    ];
  });
}
