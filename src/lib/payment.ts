import crypto from 'crypto';

interface VnpayParams {
  amount: number;
  txnRef: string;
  orderInfo: string;
  returnUrl: string;
  ipAddress: string;
}

/**
 * Sinh link thanh toán VNPAY Sandbox
 */
export function createVnpayPaymentUrl(params: VnpayParams): string {
  const tmnCode = process.env.VNPAY_TMN_CODE || 'your-vnpay-tmn-code';
  const hashSecret = process.env.VNPAY_HASH_SECRET || 'your-vnpay-hash-secret';
  let vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  
  const date = new Date();
  const createDate = formatDateToVnpay(date);

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.txnRef,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: String(params.amount * 100), // VNPAY yêu cầu nhân 100
    vnp_ReturnUrl: params.returnUrl,
    vnp_IpAddr: params.ipAddress,
    vnp_CreateDate: createDate,
  };

  // Sắp xếp các tham số theo thứ tự alphabet của key
  const sortedParams = sortObject(vnpParams);

  // Tạo chuỗi query string ban đầu
  const signData = new URLSearchParams(sortedParams).toString();

  // Tạo mã băm HMAC-SHA512
  const hmac = crypto.createHmac('sha512', hashSecret);
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  // Nối thêm secure hash vào url
  return `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
}

interface MomoParams {
  amount: number;
  orderId: string;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
}

export interface MomoResponse {
  payUrl?: string;
  resultCode: number;
  message: string;
}

/**
 * Gọi API sinh link thanh toán Momo Sandbox
 */
export async function createMomoPaymentUrl(params: MomoParams): Promise<MomoResponse> {
  const partnerCode = process.env.MOMO_PARTNER_CODE || 'your-momo-partner-code';
  const accessKey = process.env.MOMO_ACCESS_KEY || 'your-momo-access-key';
  const secretKey = process.env.MOMO_SECRET_KEY || 'your-momo-secret-key';
  const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

  const requestId = params.orderId;
  const extraData = '';
  const requestType = 'captureWallet';

  // Tạo chuỗi signature chuẩn Momo
  const rawSignature = `accessKey=${accessKey}&amount=${params.amount}&extraData=${extraData}&ipnUrl=${params.ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${partnerCode}&redirectUrl=${params.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    redirectUrl: params.redirectUrl,
    ipnUrl: params.ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'vi',
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return {
      payUrl: data.payUrl,
      resultCode: data.resultCode,
      message: data.message,
    };
  } catch (error: any) {
    return {
      resultCode: -99,
      message: error.message || 'Lỗi kết nối với cổng thanh toán Momo.',
    };
  }
}

/**
 * Định dạng Date sang định dạng YYYYMMDDHHmmss yêu cầu của VNPAY
 */
function formatDateToVnpay(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0');
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/**
 * Helper sắp xếp object theo thứ tự bảng chữ cái của keys
 */
function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}
