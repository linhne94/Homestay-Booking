import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("đang áp dụng chính sách bảo mật cho Supabase Storage...");

  // 1. Kích hoạt RLS cho bảng storage.objects (nếu chưa kích hoạt)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  `);

  // 2. Xóa các chính sách cũ (nếu có) để tránh xung đột trùng lặp
  const policies = [
    "Allow public SELECT on homestay-images",
    "Allow public INSERT on homestay-images",
    "Allow public UPDATE on homestay-images",
    "Allow public DELETE on homestay-images"
  ];

  for (const policyName of policies) {
    try {
      await prisma.$executeRawUnsafe(`
        DROP POLICY IF EXISTS "${policyName}" ON storage.objects;
      `);
    } catch (e) {
      // Bỏ qua nếu chính sách chưa tồn tại
    }
  }

  // 3. Tạo chính sách SELECT (Đọc công khai)
  await prisma.$executeRawUnsafe(`
    CREATE POLICY "Allow public SELECT on homestay-images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'homestay-images');
  `);

  // 4. Tạo chính sách INSERT (Tải lên)
  await prisma.$executeRawUnsafe(`
    CREATE POLICY "Allow public INSERT on homestay-images"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'homestay-images');
  `);

  // 5. Tạo chính sách UPDATE (Cập nhật)
  await prisma.$executeRawUnsafe(`
    CREATE POLICY "Allow public UPDATE on homestay-images"
    ON storage.objects FOR UPDATE
    TO public
    USING (bucket_id = 'homestay-images');
  `);

  // 6. Tạo chính sách DELETE (Xóa)
  await prisma.$executeRawUnsafe(`
    CREATE POLICY "Allow public DELETE on homestay-images"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'homestay-images');
  `);

  console.log("✅ Áp dụng chính sách bảo mật thành công cho bucket 'homestay-images'!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi áp dụng chính sách bảo mật:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
