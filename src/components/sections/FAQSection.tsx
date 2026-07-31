'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { HelpCircle, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { KratonSectionHeader } from '@/components/kraton'

export default function FAQSection() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => fetch('/api/faqs').then(r => r.json()),
  })

  const faqs = Array.isArray(data) ? data : (data?.faqs || [])

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs
    const query = searchQuery.toLowerCase()
    return faqs.filter(
      (faq: { question: string; answer: string }) =>
        faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)
    )
  }, [faqs, searchQuery])

  const displayFaqs = filteredFaqs

  return (
    <div className="space-y-8">
      <KratonSectionHeader
        badge="Layanan"
        title="Pertanyaan yang Sering Diajukan"
        subtitle="Temukan jawaban cepat untuk pertanyaan umum seputar pendaftaran, pembelajaran, dan kegiatan madrasah"
        align="center"
      />

      {/* Search */}
      <div className="max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#404944]" />
        <Input
          placeholder="Cari pertanyaan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-[#e4e2de] bg-[#ffffff] focus:border-[#003527] focus-visible:ring-[#cca72f]/30 rounded-xl"
        />
      </div>

      {/* FAQ Accordion */}
      {isLoading ? (
        <div className="max-w-2xl mx-auto space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="border-[#e4e2de] bg-[#ffffff]">
              <Skeleton className="h-12 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      ) : displayFaqs.length > 0 ? (
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {displayFaqs.map((faq: { id: string; question: string; answer: string }, idx: number) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <AccordionItem value={faq.id} className="border-0">
                  <Card className="border-[#e4e2de] bg-[#ffffff] wood-carved-shadow card-hover overflow-hidden rounded-2xl group">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-[#064e3b]/5 transition-colors [&[data-state=open]]:bg-[#064e3b]/8 [&[data-state=open]]:border-l-4 [&[data-state=open]]:border-l-[#cca72f]">
                      <div className="flex items-center gap-3 text-left">
                        <span className="w-9 h-9 rounded-lg bg-[#064e3b]/12 flex items-center justify-center shrink-0 group-hover:bg-[#cca72f]/15 transition-colors">
                          <HelpCircle className="h-5 w-5 text-[#003527]" />
                        </span>
                        <span className="text-sm font-semibold text-[#003527] font-body">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="pl-12 text-sm text-[#404944] leading-relaxed font-body">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      ) : (
        <Card className="p-12 text-center border-[#e4e2de] bg-[#ffffff] wood-carved-shadow max-w-md mx-auto rounded-2xl">
          <HelpCircle className="h-12 w-12 text-[#064e3b]/40 mx-auto mb-3" />
          <p className="text-[#404944] font-body">
            {searchQuery.trim() ? 'Tidak ditemukan pertanyaan yang cocok' : 'FAQ belum tersedia'}
          </p>
        </Card>
      )}
    </div>
  )
}
