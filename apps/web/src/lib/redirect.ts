export function getSafeRedirect(searchParams: URLSearchParams): string | null {
  const redirect = searchParams.get('redirect');
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return null;
  }
  return redirect;
}
