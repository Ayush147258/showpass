import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Upload folder per type
const FOLDERS: Record<string, string> = {
  banner: "showpass/banners",
  avatar: "showpass/avatars",
  logo: "showpass/logos",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) ?? "banner";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Convert File to base64 data URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const folder = FOLDERS[type] ?? FOLDERS.banner;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder,
      transformation:
        type === "banner"
          ? [{ width: 1400, height: 600, crop: "fill", gravity: "center", quality: "auto:good", fetch_format: "auto" }]
          : type === "avatar"
          ? [{ width: 200, height: 200, crop: "fill", gravity: "face", quality: "auto:good", fetch_format: "auto" }]
          : [{ width: 400, height: 400, crop: "fit", quality: "auto:good", fetch_format: "auto" }],
      public_id: `${session.user.id}_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (err) {
    console.error("[Upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

// DELETE /api/upload — delete an uploaded image by publicId
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { publicId } = await req.json();
    if (!publicId) return NextResponse.json({ error: "publicId required" }, { status: 400 });

    // Security: only allow deletion of own uploads
    if (!publicId.includes(session.user.id) && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Upload/DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
