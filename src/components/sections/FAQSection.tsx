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
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">Pertanyaan yang Sering Diajukan</h2>
        <div className="w-20 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari pertanyaan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-emerald-200 focus:border-emerald-500"
        />
      </div>

      {/* FAQ Accordion */}
      {isLoading ? (
        <div className="max-w-2xl mx-auto space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="border-0">
              <Skeleton className="h-12 w-full rounded-lg" />
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <AccordionItem value={faq.id} className="border-0">
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-emerald-50/50 transition-colors [&[data-state=open]]:bg-emerald-50">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-amber-500 shrink-0" />
                        <span className="text-sm font-medium text-emerald-800">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="pl-8 text-sm text-gray-600 leading-relaxed">
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
        <Card className="p-12 text-center border-0 max-w-md mx-auto">
          <HelpCircle className="h-12 w-12 text-emerald-200 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchQuery.trim() ? 'Tidak ditemukan pertanyaan yang cocok' : 'FAQ belum tersedia'}
          </p>
        </Card>
      )}
    </div>
  )
}
