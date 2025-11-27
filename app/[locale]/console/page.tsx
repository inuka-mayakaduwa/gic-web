import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function ConsolePage() {
    const session = await auth()

    if (!session) {
        redirect('/en/console/login')
    }

    async function handleSignOut() {
        'use server'
        const { signOut } = await import('@/auth')
        await signOut({ redirectTo: '/en/console/login' })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto p-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Welcome to GIC Console
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Hello, <span className="font-semibold">{session.user?.name || session.user?.email}</span>
                            </p>
                        </div>
                        <form action={handleSignOut}>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            🎉 Authentication Working!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            Your OTP-based authentication is now fully functional. The system uses a separate OtpVerification table for better security and scalability.
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-white dark:bg-gray-900 p-4 rounded-lg">
                            <p>User ID: {session.user?.id}</p>
                            <p>Email: {session.user?.email}</p>
                            <p>Name: {session.user?.name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
