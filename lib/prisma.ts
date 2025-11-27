import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined
    // eslint-disable-next-line no-var
    var __pgPool: Pool | undefined
}

function createPrismaClient(): PrismaClient {
    console.log('[Prisma] Starting Prisma client creation...')
    
    const databaseUrl = process.env.DATABASE_URL
    console.log('[Prisma] DATABASE_URL exists:', !!databaseUrl)
    console.log('[Prisma] DATABASE_URL length:', databaseUrl?.length || 0)
    
    if (!databaseUrl) {
        console.error('[Prisma] ERROR: DATABASE_URL environment variable is not set')
        throw new Error('DATABASE_URL environment variable is not set')
    }

    try {
        // Create a PostgreSQL connection pool
        console.log('[Prisma] Creating PostgreSQL connection pool...')
        const pool = global.__pgPool ?? new Pool({ connectionString: databaseUrl })
        if (process.env.NODE_ENV !== 'production') {
            global.__pgPool = pool
            console.log('[Prisma] Stored pool in global for development')
        }
        console.log('[Prisma] PostgreSQL pool created successfully')

        // Create the Prisma adapter
        console.log('[Prisma] Creating PrismaPg adapter...')
        const adapter = new PrismaPg({ connectionString: databaseUrl })
        console.log('[Prisma] Adapter created successfully')

        // Prisma 7 requires adapter or accelerateUrl
        console.log('[Prisma] Creating PrismaClient with adapter...')
        const client = new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        })
        console.log('[Prisma] PrismaClient created successfully')
        
        return client
    } catch (error) {
        console.error('[Prisma] ERROR creating Prisma client:', error)
        throw error
    }
}

export function getPrisma(): PrismaClient {
    console.log('[Prisma] getPrisma() called')
    console.log('[Prisma] NODE_ENV:', process.env.NODE_ENV)
    console.log('[Prisma] Global __prisma exists:', !!global.__prisma)
    
    if (process.env.NODE_ENV === 'production') {
        console.log('[Prisma] Production mode - creating new client')
        return createPrismaClient()
    }

    if (!global.__prisma) {
        console.log('[Prisma] No global client found - creating new one')
        global.__prisma = createPrismaClient()
    } else {
        console.log('[Prisma] Using existing global client')
    }

    return global.__prisma
}
