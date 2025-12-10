import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { verifyOtp } from "@/lib/auth/otp"
import { getPrisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    providers: [
        Credentials({
            name: "OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                otp: { label: "OTP", type: "text" },
            },
            authorize: async (credentials) => {
                console.log('[Auth] Starting authorization...')
                console.log('[Auth] Credentials provided:', {
                    email: credentials?.email ? '***' : 'missing',
                    otp: credentials?.otp ? '***' : 'missing'
                })

                try {
                    console.log('[Auth] Getting Prisma client...')
                    const prisma = getPrisma()
                    console.log('[Auth] Prisma client obtained')

                    if (!credentials?.email || !credentials?.otp) {
                        console.log('[Auth] Missing credentials')
                        return null
                    }

                    const email = (credentials.email as string).trim().toLowerCase()
                    const otp = (credentials.otp as string).trim()
                    console.log('[Auth] Processed credentials:', { email: '***', otpLength: otp.length })

                    if (!email.includes('@') || otp.length !== 6) {
                        console.log('[Auth] Invalid credentials format')
                        return null
                    }

                    console.log('[Auth] Looking up OTP record...')
                    // Find the most recent unverified OTP for this email
                    const otpRecord = await prisma.otpVerification.findFirst({
                        where: {
                            email,
                            verified: false,
                            expiresAt: {
                                gte: new Date(),
                            },
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    })
                    console.log('[Auth] OTP record found:', otpRecord ? { id: otpRecord.id, attempts: otpRecord.attempts } : 'not found')

                    if (!otpRecord) {
                        console.log('[Auth] No valid OTP record found')
                        return null
                    }

                    // Check if too many attempts
                    if (otpRecord.attempts >= 5) {
                        console.log('[Auth] Too many attempts, deleting OTP record')
                        await prisma.otpVerification.delete({
                            where: { id: otpRecord.id },
                        })
                        return null
                    }

                    console.log('[Auth] Verifying OTP...')
                    // Verify OTP
                    const isValid = await verifyOtp(otp, otpRecord.otpHash)
                    console.log('[Auth] OTP verification result:', isValid)

                    if (!isValid) {
                        console.log('[Auth] Invalid OTP, incrementing attempts')
                        // Increment attempts
                        await prisma.otpVerification.update({
                            where: { id: otpRecord.id },
                            data: {
                                attempts: {
                                    increment: 1,
                                },
                            },
                        })
                        return null
                    }

                    console.log('[Auth] OTP valid, starting transaction...')
                    // Use transaction to ensure atomicity
                    const result = await prisma.$transaction(async (tx) => {
                        console.log('[Auth] Transaction started, fetching user...')
                        // Get user
                        const user = await tx.systemUser.findUnique({
                            where: { email },
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                profilePic: true,
                                isActive: true,
                            },
                        })
                        console.log('[Auth] User lookup result:', user ? { id: user.id, isActive: user.isActive } : 'not found')

                        if (!user || !user.isActive) {
                            console.log('[Auth] User not found or inactive')
                            return null
                        }

                        console.log('[Auth] Deleting OTP record...')
                        // Mark OTP as verified and delete it
                        await tx.otpVerification.delete({
                            where: { id: otpRecord.id },
                        })

                        console.log('[Auth] Updating last login...')
                        // Update last login
                        await tx.systemUser.update({
                            where: { id: user.id },
                            data: {
                                lastLogin: new Date(),
                            },
                        })

                        console.log('[Auth] Transaction completed successfully')
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            image: user.profilePic,
                        }
                    })

                    console.log('[Auth] Authorization successful')
                    return result
                } catch (error) {
                    console.error('[Auth] ERROR in authorization:', error)
                    console.error('[Auth] Error type:', error?.constructor?.name)
                    console.error('[Auth] Error message:', error instanceof Error ? error.message : String(error))
                    console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
                    return null
                }
            },
        }),
    ],
    pages: {
        signIn: "/en/console/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
            }
            return session
        },
    },
})
