import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated()
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: string[] = []

    // Create NewsLike table
    try {
      await db.$executeRaw`CREATE TABLE IF NOT EXISTS "NewsLike" (
        "id" TEXT NOT NULL,
        "newsId" TEXT NOT NULL,
        "sessionId" VARCHAR(100) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NewsLike_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "NewsLike_newsId_sessionId_key" UNIQUE ("newsId", "sessionId")
      )`
      results.push('✅ NewsLike table created')
    } catch (e) {
      results.push(`⚠️ NewsLike: ${e instanceof Error ? e.message : 'exists or error'}`)
    }

    // Create NewsComment table
    try {
      await db.$executeRaw`CREATE TABLE IF NOT EXISTS "NewsComment" (
        "id" TEXT NOT NULL,
        "newsId" TEXT NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "content" TEXT NOT NULL,
        "parentId" VARCHAR(50),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NewsComment_pkey" PRIMARY KEY ("id")
      )`
      results.push('✅ NewsComment table created')
    } catch (e) {
      results.push(`⚠️ NewsComment: ${e instanceof Error ? e.message : 'exists or error'}`)
    }

    // Create DakwahLike table
    try {
      await db.$executeRaw`CREATE TABLE IF NOT EXISTS "DakwahLike" (
        "id" TEXT NOT NULL,
        "dakwahId" TEXT NOT NULL,
        "sessionId" VARCHAR(100) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DakwahLike_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "DakwahLike_dakwahId_sessionId_key" UNIQUE ("dakwahId", "sessionId")
      )`
      results.push('✅ DakwahLike table created')
    } catch (e) {
      results.push(`⚠️ DakwahLike: ${e instanceof Error ? e.message : 'exists or error'}`)
    }

    // Create DakwahComment table
    try {
      await db.$executeRaw`CREATE TABLE IF NOT EXISTS "DakwahComment" (
        "id" TEXT NOT NULL,
        "dakwahId" TEXT NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "content" TEXT NOT NULL,
        "parentId" VARCHAR(50),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DakwahComment_pkey" PRIMARY KEY ("id")
      )`
      results.push('✅ DakwahComment table created')
    } catch (e) {
      results.push(`⚠️ DakwahComment: ${e instanceof Error ? e.message : 'exists or error'}`)
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('[Migrate Social] Error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}
