'use client'

import { motion } from 'framer-motion'
import { HelpCircle, Calendar, CreditCard, FileText, ClipboardCheck, MessageCircle } from 'lucide-react'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'

/**
 * PPDBFAQ — Inline FAQ section specific to PPDB.
 *
 * Lightweight, self-contained — doesn't fetch from /api/faqs (which is
 * the global FAQ section). These are curated PPDB-specific Q&As shown
 * right below the registration form for quick reference.
 *
 * Uses the same Accordion pattern as FAQSection.tsx for visual consistency.
 * Brand palette: emerald + gold (no blue/indigo).
 */
type QA = {
  id: string
  question: string
  answer: string
}

const PPDB_FAQS: QA[] = [
  {
    id: 'ppdb-faq-1',
    question: 'Kapan PPDB dibuka dan ditutup?',
    answer:
      'Jadwal resmi PPDB ditampilkan pada bagian "Jadwal Pendaftaran" di atas. ' +
      'Umumnya pendaftaran dibuka pada awal tahun ajaran baru (sekitar Mei-Juni). ' +
      'Pantau pengumuman resmi madrasah atau hubungi panitia untuk informasi terkini.',
  },
  {
    id: 'ppdb-faq-2',
    question: 'Berapa biaya pendaftaran?',
    answer:
      'Rincian biaya pendidikan (uang pendaftaran, SPP, dll) dapat dilihat pada tabel ' +
      '"Biaya Pendidikan" di atas. Biaya dapat berubah sewaktu-waktu. Untuk keringanan ' +
      'atau beasiswa, silakan berbicara langsung dengan panitia PPDB.',
  },
  {
    id: 'ppdb-faq-3',
    question: 'Apa saja berkas yang diperlukan?',
    answer:
      'Berkas wajib: (1) Kartu Keluarga (KK), (2) Akta Kelahiran, (3) Pas Foto berwarna ' +
      'ukuran 3×4. Berkas dapat diunggah langsung di formulir pendaftaran (langkah 3). ' +
      'Untuk santri pindahan, sertakan juga SKL (Surat Keterangan Lulus) atau rapor terakhir.',
  },
  {
    id: 'ppdb-faq-4',
    question: 'Apakah ada tes seleksi?',
    answer:
      'Ya, calon santri akan mengikuti tes seleksi yang meliputi tes akademik (IQ, ' +
      'membaca Al-Qur\'an, dan tes potensi akademik) serta wawancara bersama calon ' +
      'orang tua/wali. Detail jadwal tes akan diumumkan setelah pendaftaran online diterima.',
  },
  {
    id: 'ppdb-faq-5',
    question: 'Bagaimana cara menghubungi panitia?',
    answer:
      'Anda dapat menghubungi panitia PPDB melalui WhatsApp menggunakan tombol "Chat WhatsApp Panitia" ' +
      'di bagian bawah halaman ini. Panitia juga akan menghubungi Anda melalui nomor WhatsApp ' +
      'yang Anda cantumkan dalam formulir pendaftaran dalam 1×24 jam setelah pengiriman.',
  },
]

const FAQ_ICONS = [Calendar, CreditCard, FileText, ClipboardCheck, MessageCircle] as const

export function PPDBFAQ() {
  return (
    <Card className="border-0 shadow-premium rounded-2xl overflow-hidden bg-[#fbf9f5]">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#e4e2de]">
          <div className="p-2 rounded-lg bg-[#064e3b]/10">
            <HelpCircle className="h-5 w-5 text-[#003527]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#003527] font-display leading-tight">
              Pertanyaan Umum PPDB
            </h3>
            <p className="text-xs text-[#404944] font-body">
              Jawaban cepat untuk pertanyaan yang sering diajukan calon wali santri
            </p>
          </div>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {PPDB_FAQS.map((faq, idx) => {
            const Icon = FAQ_ICONS[idx % FAQ_ICONS.length]
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: idx * 0.04, duration: 0.35 }}
              >
                <AccordionItem
                  value={faq.id}
                  className="border-0 rounded-xl overflow-hidden bg-white border border-[#e4e2de] data-[state=open]:border-[#cca72f]/40 data-[state=open]:shadow-sm transition-all"
                >
                  <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-[#064e3b]/4 transition-colors [&[data-state=open]]:bg-[#064e3b]/6 [&[data-state=open]]:border-l-4 [&[data-state=open]]:border-l-[#cca72f]">
                    <div className="flex items-center gap-3 text-left">
                      <span className="w-8 h-8 rounded-lg bg-[#064e3b]/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-[#003527]" />
                      </span>
                      <span className="text-sm font-semibold text-[#003527] font-body">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1">
                    <div className="pl-11 text-sm text-[#404944] leading-relaxed font-body">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}
