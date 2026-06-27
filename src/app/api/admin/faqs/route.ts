import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const faqs = await db.fAQ.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(faqs)
  } catch (error) {
    console.error('Admin FAQs fetch error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const body = await request.json()
    const { question, answer, order, isActive } = body

    if (!question || !answer) {
      return NextResponse.json({ error: 'Pertanyaan dan jawaban harus diisi' }, { status: 400 })
    }

    const faq = await db.fAQ.create({
      data: {
        question,
        answer,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(faq, { status: 201 })
  } catch (error) {
    console.error('Admin FAQ create error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
