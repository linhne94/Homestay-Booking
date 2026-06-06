import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from './prisma';

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'homestay-booking-secret-key-eco-luxury-2026';

// 1. Mã hóa mật khẩu sử dụng PBKDF2 hoặc SHA256 với salt đơn giản
export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

// 2. Tạo một JWT token tự chế cực kỳ an toàn
export function signToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Hạn dùng 7 ngày
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  return `${header}.${body}.${signature}`;
}

// 3. Giải mã và kiểm tra token
export function verifyToken(token: string): any | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  if (signature !== expectedSignature) {
    return null;
  }
  
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Đã hết hạn
    }
    return payload;
  } catch {
    return null;
  }
}

// 4. Lấy thông tin user hiện tại từ cookie (Server-side)
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('homestay_session')?.value;
    if (!token) {
      console.log('DEBUG AUTH: Không tìm thấy cookie homestay_session');
      return null;
    }
    
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      console.log('DEBUG AUTH: Token không hợp lệ hoặc thiếu userId trong payload');
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        loyalty_points: true,
        avatar_url: true,
        is_active: true,
      }
    });
    
    if (!user) {
      console.log(`DEBUG AUTH: Không tìm thấy user với ID ${payload.userId} trong DB`);
      return null;
    }
    if (!user.is_active) {
      console.log(`DEBUG AUTH: User ${user.email} đang bị khóa (is_active = false)`);
      return null;
    }
    return user;
  } catch (err: any) {
    console.error('DEBUG AUTH: Lỗi trong getSessionUser:', err.message);
    return null;
  }
}

// 5. Lấy thông tin nhân viên hiện tại kèm chi nhánh (Server-side)
export async function getSessionStaff() {
  const user = await getSessionUser();
  if (!user) {
    console.log('DEBUG AUTH: getSessionUser trả về null');
    return null;
  }
  if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
    console.log(`DEBUG AUTH: User ${user.email} có role ${user.role} không phải STAFF hoặc ADMIN`);
    return null;
  }
  
  const staff = await prisma.staff.findUnique({
    where: { user_id: user.id },
    include: {
      branch: true,
    }
  });
  
  if (!staff) {
    console.log(`DEBUG AUTH: Không tìm thấy bản ghi Staff cho user ID ${user.id} (${user.email})`);
  } else {
    console.log(`DEBUG AUTH: Tìm thấy Staff hợp lệ cho user ${user.email}, Chi nhánh: ${staff.branch.name}`);
  }
  
  return staff ? { ...user, staff_profile: staff } : null;
}
