import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Do not attach the token for the public endpoints
  const url = new URL(req.url, window.location.origin);
  const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
  if (publicPaths.includes(url.pathname)) {
    return next(req);
  }

  const token = localStorage.getItem('accessToken');
  const activeOrgId = localStorage.getItem('active_org_id');

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (activeOrgId) {
    headers = headers.set('x-organization-id', activeOrgId);
  }

  if (headers !== req.headers) {
    const clonedReq = req.clone({ headers });
    return next(clonedReq);
  }

  return next(req);
};
