import { NextResponse } from 'next/server'
import { generateOtp, hashOtp } from '@/lib/auth/otp'
import { sendOtpEmail } from '@/lib/email/service'
import { getPrisma } from '@/lib/prisma'

export async function POST(request: Request) {
    console.log('[OTP Request] Starting OTP request handler...')
    
    try {
        console.log('[OTP Request] Getting Prisma client...')
        const prisma = getPrisma()
        console.log('[OTP Request] Prisma client obtained successfully')
        
        console.log('[OTP Request] Parsing request body...')
        const body = await request.json()
        console.log('[OTP Request] Request body parsed:', { email: body?.email ? '***' : 'missing' })
        
        const email = body?.email?.trim().toLowerCase()
        console.log('[OTP Request] Email processed:', email ? '***' : 'missing')

        if (!email || !email.includes('@')) {
            console.log('[OTP Request] Invalid email format')
            return NextResponse.json(
                { error: 'Valid email is required' },
                { status: 400 }
            )
        }

        console.log('[OTP Request] Checking if user exists...')
        // Check if user exists
        const user = await prisma.systemUser.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                isActive: true,
            },
        })
        console.log('[OTP Request] User lookup result:', user ? { id: user.id, isActive: user.isActive } : 'not found')

        if (!user) {
            console.log('[OTP Request] User not found')
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        if (!user.isActive) {
            console.log('[OTP Request] User account is inactive')
            return NextResponse.json(
                { error: 'Account is inactive' },
                { status: 403 }
            )
        }

        console.log('[OTP Request] Generating OTP...')
        // Generate OTP
        const otp = generateOtp()
        console.log('[OTP Request] OTP generated (length:', otp.length, ')')
        
        console.log('[OTP Request] Hashing OTP...')
        const otpHash = await hashOtp(otp)
        console.log('[OTP Request] OTP hashed successfully')
        
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        console.log('[OTP Request] OTP expires at:', expiresAt.toISOString())

        console.log('[OTP Request] Starting database transaction...')
        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            console.log('[OTP Request] Transaction started - deleting old OTPs...')
            // Invalidate all previous unverified OTPs for this email
            const deleteResult = await tx.otpVerification.deleteMany({
                where: {
                    email,
                    verified: false,
                },
            })
            console.log('[OTP Request] Deleted', deleteResult.count, 'old OTP records')

            console.log('[OTP Request] Creating new OTP record...')
            // Create new OTP verification record
            await tx.otpVerification.create({
                data: {
                    email,
                    otpHash,
                    expiresAt,
                },
            })
            console.log('[OTP Request] New OTP record created')
        })
        console.log('[OTP Request] Transaction completed successfully')

        console.log('[OTP Request] Sending OTP email...')
        // Send OTP email (don't fail the request if email fails)
        try {
            const emailSent = await sendOtpEmail(email, otp)
            if (!emailSent) {
                console.error('[OTP Request] Failed to send OTP email to:', email)
                // Still return success to avoid revealing if email exists
            } else {
                console.log('[OTP Request] OTP email sent successfully')
            }
        } catch (emailError) {
            console.error('[OTP Request] Error sending OTP email:', emailError)
            // Continue - don't expose email errors to client
        }

        console.log('[OTP Request] Request completed successfully')
        return NextResponse.json({
            message: 'OTP sent successfully',
        })
    } catch (error) {
        console.error('[OTP Request] ERROR in OTP request handler:', error)
        console.error('[OTP Request] Error type:', error?.constructor?.name)
        console.error('[OTP Request] Error message:', error instanceof Error ? error.message : String(error))
        console.error('[OTP Request] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        
        // Don't expose internal errors
        return NextResponse.json(
            { error: 'Failed to process request. Please try again.' },
            { status: 500 }
        )
    }
}
