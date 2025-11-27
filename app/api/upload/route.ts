import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import mime from "mime-types"

const {
    R2_BUCKET_NAME,
    R2_ENDPOINT,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_URL,
    USE_SIGNED_URLS,
    CUSTOM_CDN_URL,
    SIGNED_URL_EXPIRY,
} = process.env

if (
    !R2_BUCKET_NAME ||
    !R2_ENDPOINT ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY
) {
    console.warn("Missing Cloudflare R2 environment variables - file uploads will not work")
}

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
})

const getSignedFileUrl = async (bucket: string, key: string): Promise<string> => {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key })
    return getSignedUrl(s3, cmd, {
        expiresIn: parseInt(SIGNED_URL_EXPIRY || "3600", 10),
    })
}

/**
 * POST /api/upload
 * Upload a file to R2 storage
 * Form data:
 *   - file: File to upload
 *   - path: Optional folder path (default: "uploads")
 *   - isPublic: Boolean string ("true" or "false") - whether file should be publicly accessible
 */
export async function POST(req: NextRequest) {
    console.log('[Upload] POST - Starting file upload')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Upload] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!R2_BUCKET_NAME || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
            console.log('[Upload] R2 configuration missing')
            return NextResponse.json({ error: "File upload service not configured" }, { status: 503 })
        }

        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const path = (formData.get("path") as string) || "uploads"
        const isPublic = formData.get("isPublic") === "true"

        if (!file) {
            console.log('[Upload] No file provided')
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        console.log('[Upload] File received:', {
            name: file.name,
            size: file.size,
            type: file.type,
            path,
            isPublic,
        })

        // Save file temporarily
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const tempPath = join(tmpdir(), `upload-${Date.now()}-${file.name}`)
        await writeFile(tempPath, buffer)

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const mimeType = mime.lookup(file.name) || file.type || "application/octet-stream"
        const key = `${path}/${fileName}`

        console.log('[Upload] Uploading to R2:', { bucket: R2_BUCKET_NAME, key })

        // Upload to R2
        const fs = await import("fs")
        const fileStream = fs.createReadStream(tempPath)
        await new Upload({
            client: s3,
            params: {
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: fileStream,
                ContentType: mimeType,
            },
        }).done()

        // Clean up temp file
        await unlink(tempPath).catch(() => {})

        console.log('[Upload] File uploaded successfully')

        // Build URL based on public/private setting
        let url: string

        if (isPublic) {
            // Public file - use public URL
            if (CUSTOM_CDN_URL) {
                url = `${CUSTOM_CDN_URL.replace(/\/+$/, "")}/${key}`
            } else if (R2_PUBLIC_URL) {
                const needsBucketInPath = /cloudflarestorage\.com/.test(R2_PUBLIC_URL)
                url = needsBucketInPath
                    ? `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${R2_BUCKET_NAME}/${key}`
                    : `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}`
            } else {
                // Fallback to signed URL even for public files if no public URL configured
                url = await getSignedFileUrl(R2_BUCKET_NAME, key)
            }
        } else {
            // Private file - always use signed URL
            url = await getSignedFileUrl(R2_BUCKET_NAME, key)
        }

        console.log('[Upload] File URL generated:', { url, isPublic })

        return NextResponse.json({
            filePath: url,
            key,
            isPublic,
            mimeType,
            size: file.size,
        })
    } catch (error) {
        console.error("[Upload] ERROR:", error)
        return NextResponse.json(
            { error: "File upload failed", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

