import { NextResponse, type NextRequest } from 'next/server';

function decodeBase64Url(str: string) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    // Dùng atob có sẵn trong Edge Runtime để decode base64
    const decoded = atob(base64);
    // Decode UTF-8 chuẩn
    return decodeURIComponent(
      Array.prototype.map
        .call(decoded, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return null;
  }
}

function getSessionPayload(token: string | undefined) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  try {
    const jsonStr = decodeBase64Url(parts[1]);
    if (!jsonStr) return null;
    const payload = JSON.parse(jsonStr);
    
    // Kiểm tra hết hạn
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('homestay_session')?.value;
  const session = getSessionPayload(token);

  // 1. Bảo vệ các trang quản trị /admin/*
  if (pathname.startsWith('/admin')) {
    // Cho phép truy cập trang login của admin, việc chuyển hướng sẽ do Server Component xử lý an toàn hơn
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    if (!session || (session.role !== 'ADMIN' && session.role !== 'STAFF')) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // 2. Bảo vệ các trang cá nhân thành viên /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn trừ:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - các file ảnh tĩnh
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
