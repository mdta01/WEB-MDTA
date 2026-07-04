import { PrismaClient } from '@prisma/client'
import { hash } from './seed-utils'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean all data first (order matters due to foreign keys)
  console.log('Cleaning existing data...')
  await prisma.suggestion.deleteMany()
  await prisma.contactMessage.deleteMany()
  await prisma.pPDBRegistration.deleteMany()
  await prisma.paymentInfo.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.dakwah.deleteMany()
  await prisma.download.deleteMany()
  await prisma.fAQ.deleteMany()
  await prisma.testimonial.deleteMany()
  await prisma.alumni.deleteMany()
  await prisma.gallery.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.news.deleteMany()
  await prisma.event.deleteMany()
  await prisma.program.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.student.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.institutionData.deleteMany()
  await prisma.statistic.deleteMany()
  await prisma.siteSetting.deleteMany()
  await prisma.admin.deleteMany()
  console.log('Data cleaned.')

  // Create Admin
  await prisma.admin.upsert({
    where: { username: 'mdta01' },
    update: {},
    create: {
      username: 'mdta01',
      password: await hash('mdta@01'),
      name: 'Administrator',
      email: 'admin@mdta-miftahululum01.com',
      role: 'superadmin',
    },
  })

  // Site Settings
  const settings = [
    { key: 'madrasah_name', value: 'MDTA Miftahul Ulum 01', label: 'Nama Madrasah' },
    { key: 'madrasah_subtitle', value: 'Madrasah Diniyah Takmiliyah Awwaliyah', label: 'Subjudul Madrasah' },
    { key: 'madrasah_description', value: 'Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi melalui pendidikan Islam yang berkualitas dan menyeluruh.', label: 'Deskripsi Madrasah' },
    { key: 'madrasah_address', value: 'Jl. Raya Desa Miftahul Ulum No. 01, Kec. Cikarang, Kab. Bekasi, Jawa Barat 17530', label: 'Alamat' },
    { key: 'madrasah_phone', value: '081234567890', label: 'Telepon/WhatsApp' },
    { key: 'madrasah_email', value: 'info@mdta-miftahululum01.com', label: 'Email' },
    { key: 'madrasah_facebook', value: 'https://facebook.com/mdtamiftahululum01', label: 'Facebook' },
    { key: 'madrasah_instagram', value: 'https://instagram.com/mdtamiftahululum01', label: 'Instagram' },
    { key: 'madrasah_youtube', value: 'https://youtube.com/@mdtamiftahululum01', label: 'YouTube' },
    { key: 'madrasah_tiktok', value: 'https://tiktok.com/@mdtamiftahululum01', label: 'TikTok' },
    { key: 'madrasah_welcome', value: 'Assalamu\'alaikum Warahmatullahi Wabarakatuh. Selamat datang di website resmi MDTA Miftahul Ulum 01. Semoga website ini dapat menjadi sarana informasi dan komunikasi yang bermanfaat bagi seluruh jamaah madrasah.', label: 'Sambutan Kepala Madrasah' },
    { key: 'madrasah_vision', value: 'Terwujudnya generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi', label: 'Visi' },
    { key: 'madrasah_mission', value: '1. Menyelenggarakan pendidikan agama Islam yang berkualitas\n2. Membentuk santri yang berakhlakul karimah\n3. Mengembangkan potensi dan prestasi santri\n4. Mencetak generasi yang cinta Al-Quran dan As-Sunnah\n5. Membangun karakter santri yang mandiri dan bertanggung jawab', label: 'Misi' },
    { key: 'madrasah_goals', value: '1. Menghasilkan lulusan yang hafal Al-Quran minimal 3 Juz\n2. Menumbuhkan semangat belajar dan berprestasi\n3. Membentuk santri yang berakhlakul karimah\n4. Menjalin kerjasama yang baik dengan orang tua dan masyarakat', label: 'Tujuan' },
    { key: 'madrasah_history', value: 'MDTA Miftahul Ulum 01 didirikan pada tahun 1998 oleh KH. Abdul Rahman bersama tokoh masyarakat setempat dengan tujuan memberikan pendidikan agama Islam yang berkualitas bagi anak-anak di wilayah Cikarang dan sekitarnya. Bermula dari sebuah musholla kecil dengan hanya 15 santri, madrasah ini terus berkembang hingga kini memiliki ratusan santri aktif dengan fasilitas yang terus diperbaiki. Nama "Miftahul Ulum" yang berarti "Kunci Ilmu" dipilih dengan harapan madrasah ini menjadi pintu gerbang ilmu pengetahuan, khususnya ilmu agama Islam, bagi generasi mendatang.', label: 'Sejarah' },
    { key: 'madrasah_history_year', value: '1998', label: 'Tahun Berdiri' },
    { key: 'madrasah_principals_name', value: 'Ustadz H. Muhammad Syafii, S.Pd.I', label: 'Nama Kepala Madrasah' },
    { key: 'madrasah_principal_photo', value: '/images/kepala-madrasah.png', label: 'Foto Kepala Madrasah' },
    { key: 'madrasah_yayasan', value: 'Yayasan Pendidikan Islam Miftahul Ulum', label: 'Naungan Yayasan' },
    { key: 'madrasah_nsdt', value: '311232010012', label: 'Nomor Statistik (NSDT)' },
    { key: 'madrasah_sk', value: 'SK Pendirian No. 456/Kes/1998', label: 'SK Pendirian' },
    { key: 'madrasah_izin', value: 'Izin Operasional No. 789/OP/2005', label: 'Izin Operasional' },
    { key: 'madrasah_akreditasi', value: 'Terakreditasi A', label: 'Akreditasi' },
    { key: 'madrasah_service_hours', value: 'Senin - Sabtu: 07.00 - 12.00 WIB', label: 'Jam Pelayanan' },
    { key: 'madrasah_maps', value: '-6.3082,107.1732', label: 'Koordinat Google Maps' },
    { key: 'madrasah_maps_embed_url', value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.0!2d106.6!3d-6.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTgnMDAuMCJTIDEwNsKwMzYnMDAuMCJF!5e0!3m2!1sid!2sid!4v1', label: 'URL Embed Google Maps' },
    { key: 'madrasah_logo', value: '/images/logo-madin-warna.png', label: 'Logo URL' },
    { key: 'madrasah_hero_image', value: '/images/hero-madrasah.png', label: 'Gambar Hero' },
    { key: 'madrasah_footer_description', value: 'Mencetak generasi Muslim yang berilmu, berakhlak mulia, dan berprestasi melalui pendidikan Islam yang berkualitas.', label: 'Deskripsi Footer' },
    { key: 'madrasah_copyright', value: 'Mencetak Generasi Muslim yang Berilmu & Berakhlak Mulia', label: 'Teks Copyright' },
    { key: 'madrasah_whatsapp_number', value: '6281234567890', label: 'Nomor WhatsApp (Format Internasional)' },
    { key: 'madrasah_whatsapp_message', value: 'Assalamualaikum, saya ingin bertanya tentang MDTA Miftahul Ulum 01', label: 'Pesan Default WhatsApp' },
    { key: 'madrasah_struktur_organisasi', value: JSON.stringify([
      { role: 'Kepala Madrasah', name: 'Ustadz H. Muhammad Syafii, S.Pd.I', level: 1 },
      { role: 'Wakil Kepala Madrasah', name: 'Ustadzah Hj. Siti Aisyah, S.Ag', level: 2 },
      { role: 'Sekretaris', name: 'Ustadz Ahmad Fauzi, S.Pd', level: 3 },
      { role: 'Bendahara', name: 'Ustadzah Zulfa Husna, S.Ag', level: 3 },
      { role: 'Kurikulum', name: 'Ustadzah Nurhasanah, S.Pd.I', level: 3 },
      { role: 'Kesantrian', name: 'Ustadz Rahman Hakim, S.Ag', level: 3 },
    ]), label: 'Struktur Organisasi (JSON)' },
    { key: 'ppdb_status', value: 'open', label: 'Status PPDB' },
    { key: 'ppdb_info', value: 'Pendaftaran Santri Baru Tahun Ajaran 2025/2026 telah dibuka! Segera daftarkan putra-putri Anda.', label: 'Info PPDB' },
    { key: 'ppdb_requirements', value: 'Mengisi formulir pendaftaran secara lengkap\nFotokopi Akta Kelahiran\nFotokopi Kartu Keluarga\nPas Foto 3x4 (4 lembar)\nFotokopi KTP Orang Tua/Wali\nSurat Keterangan Lulus (bagi pindahan)', label: 'Persyaratan PPDB' },
    { key: 'ppdb_contact', value: 'Panitia PPDB MDTA Miftahul Ulum 01|081234567890', label: 'Kontak PPDB (nama|nomor)' },
    { key: 'wali_santri_meeting_schedule', value: 'Pertemuan Awal Tahun Ajaran|Januari 2025|09:00 - 12:00 WIB\nRapat Tengah Semester|Juni 2025|09:00 - 12:00 WIB\nPenerimaan Rapor|Desember 2025|08:00 - 12:00 WIB', label: 'Jadwal Pertemuan Wali Santri (judul|tanggal|waktu)' },
  ]

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, label: s.label },
      create: s,
    })
  }

  // Statistics
  const stats = [
    { key: 'santri_aktif', value: '245', label: 'Jumlah Santri Aktif' },
    { key: 'guru_aktif', value: '18', label: 'Jumlah Guru & Tenaga Pendidik' },
    { key: 'alumni', value: '1250', label: 'Total Alumni' },
    { key: 'prestasi', value: '85', label: 'Total Prestasi' },
  ]

  for (const s of stats) {
    await prisma.statistic.upsert({
      where: { key: s.key },
      update: { value: s.value, label: s.label },
      create: s,
    })
  }

  // Announcements
  const announcements = [
    { title: 'Pendaftaran Santri Baru 2025/2026', content: 'Pendaftaran santri baru untuk tahun ajaran 2025/2026 telah dibuka. Silakan mendaftar melalui formulir online atau datang langsung ke madrasah.', type: 'ppdb', isActive: true, priority: 1 },
    { title: 'Ujian Akhir Semester Genap', content: 'Ujian Akhir Semester Genap akan dilaksanakan pada tanggal 15-25 Ramadhan 1446 H. Persiapkan diri dengan baik.', type: 'exam', isActive: true, priority: 2 },
    { title: 'Libur Hari Raya Idul Fitri 1446 H', content: 'Libur Hari Raya Idul Fitri 1446 H mulai tanggal 1-10 Syawal 1446 H. Selamat Hari Raya Idul Fitri, Mohon Maaf Lahir dan Batin.', type: 'holiday', isActive: true, priority: 3 },
    { title: 'Lomba Hafalan Al-Quran Tingkat Kecamatan', content: 'Alhamdulillah, MDTA Miftahul Ulum 01 akan mengirimkan 5 perwakilan santri untuk mengikuti Lomba Hafalan Al-Quran Tingkat Kecamatan.', type: 'event', isActive: true, priority: 4 },
    { title: 'Rapat Wali Santri', content: 'Rapat wali santri akan dilaksanakan pada hari Minggu, 15 Sya\'ban 1446 H pukul 09.00 WIB di Aula Madrasah.', type: 'general', isActive: true, priority: 5 },
  ]

  for (const a of announcements) {
    await prisma.announcement.create({ data: a })
  }

  // Teachers
  const teachers = [
    { name: 'Ustadz H. Muhammad Syafii, S.Pd.I', position: 'Kepala Madrasah', subject: 'Al-Quran & Hadits', order: 1 },
    { name: 'Ustadzah Hj. Siti Aisyah, S.Ag', position: 'Wakil Kepala Madrasah', subject: 'Fiqih', order: 2 },
    { name: 'Ustadz Ahmad Fauzi, S.Pd', position: 'Sekretaris', subject: 'Aqidah Akhlak', order: 3 },
    { name: 'Ustadzah Nurhasanah, S.Pd.I', position: 'Guru Senior', subject: 'Al-Quran', order: 4 },
    { name: 'Ustadz Rahman Hakim, S.Ag', position: 'Guru', subject: 'Hadits', order: 5 },
    { name: 'Ustadzah Fatimah Az-Zahra, S.Pd', position: 'Guru', subject: 'Fiqih', order: 6 },
    { name: 'Ustadz Muhammad Ihsan, S.Pd.I', position: 'Guru', subject: 'Bahasa Arab', order: 7 },
    { name: 'Ustadzah Siti Khadijah, S.Ag', position: 'Guru', subject: 'SKI', order: 8 },
    { name: 'Ustadz Abdullah Syafii, S.Pd', position: 'Guru', subject: 'Tajwid', order: 9 },
    { name: 'Ustadzah Rohmatun Nisa, S.Pd.I', position: 'Guru', subject: 'Aqidah Akhlak', order: 10 },
    { name: 'Ustadz M. Ridwan, S.Pd', position: 'Guru', subject: 'Bahasa Arab', order: 11 },
    { name: 'Ustadzah Zulfa Husna, S.Ag', position: 'Bendahara', subject: 'Fiqih', order: 12 },
    { name: 'Ustadz Haris Maulana', position: 'Administrasi', subject: '-', order: 13 },
    { name: 'Ustadzah Rina Oktaviani', position: 'Pustakawan', subject: '-', order: 14 },
    { name: 'Ustadz Dedi Supriadi', position: 'Penjaga Keamanan', subject: '-', order: 15 },
  ]

  for (const t of teachers) {
    await prisma.teacher.create({ data: t })
  }

  // Programs
  const programs = [
    { title: 'Kelas 1 - 3 (Ibtidaiyah)', description: 'Pendidikan dasar tingkat awal dengan fokus pada pengenalan huruf hijaiyah, tajwid dasar, dan hafalan juz 30', category: 'kelas', icon: 'BookOpen', order: 1 },
    { title: 'Kelas 4 - 6 (Tsanawiyah)', description: 'Pendidikan tingkat lanjut dengan materi yang lebih mendalam termasuk tafsir, hadits, dan fiqih ibadah', category: 'kelas', icon: 'GraduationCap', order: 2 },
    { title: 'Hafalan Al-Quran 30 Juz', description: 'Program unggulan tahfidz Al-Quran dengan target hafalan 30 juz selama masa studi', category: 'unggulan', icon: 'BookMarked', order: 3 },
    { title: 'Kurikulum Kementerian Agama', description: 'Menggunakan kurikulum resmi Kemenag yang telah disesuaikan dengan kebutuhan lokal madrasah', category: 'kurikulum', icon: 'FileText', order: 4 },
    { title: 'Kurikulum Tahfidz', description: 'Kurikulum khusus tahfidz dengan metode talaqqi dan muraja\'ah yang terstruktur', category: 'kurikulum', icon: 'ScrollText', order: 5 },
    { title: 'Pramuka', description: 'Kegiatan kepanduan untuk membentuk karakter, kedisiplinan, dan jiwa kepemimpinan santri', category: 'ekstrakurikuler', icon: 'Flag', order: 6 },
    { title: 'Kaligrafi Arab', description: 'Pelatihan seni kaligrafi Arab (khat) untuk mengembangkan kreativitas dan kecintaan terhadap bahasa Al-Quran', category: 'ekstrakurikuler', icon: 'PenTool', order: 7 },
    { title: 'Hadroh & Rebana', description: 'Ekstrakurikuler musik Islami untuk mengembangkan bakat seni dan dakwah melalui alat musik hadroh dan rebana', category: 'ekstrakurikuler', icon: 'Music', order: 8 },
    { title: 'Pencak Silat', description: 'Latihan bela diri pencak silat untuk menjaga kesehatan dan ketangkasan santri', category: 'ekstrakurikuler', icon: 'Swords', order: 9 },
    { title: 'English Club', description: 'Program pengembangan kemampuan bahasa Inggris untuk santri agar mampu berkomunikasi secara internasional', category: 'ekstrakurikuler', icon: 'Globe', order: 10 },
  ]

  for (const p of programs) {
    await prisma.program.create({ data: p })
  }

  // News
  const news = [
    { title: 'Peringatan Isra Mi\'raj Nabi Muhammad SAW 1446 H', content: 'MDTA Miftahul Ulum 01 mengadakan peringatan Isra Mi\'raj Nabi Muhammad SAW 1446 H dengan penuh khidmat. Acara dihadiri oleh seluruh santri, guru, dan wali santri. Ustadz H. Muhammad Syafii, S.Pd.I menyampaikan ceramah tentang pentingnya mengambil hikmah dari peristiwa Isra Mi\'raj.\n\nKegiatan ini juga diisi dengan pembacaan shalawat Nabi dan doa bersama. Semoga dengan memperingati Isra Mi\'raj, kita semua semakin meningkatkan iman dan taqwa kepada Allah SWT.', excerpt: 'MDTA Miftahul Ulum 01 mengadakan peringatan Isra Mi\'raj Nabi Muhammad SAW 1446 H dengan penuh khidmat.', category: 'phbi', isPublished: true },
    { title: 'Santri MDTA Raih Juara 1 Lomba Hafalan Al-Quran', content: 'Alhamdulillah, santri MDTA Miftahul Ulum 01 berhasil meraih Juara 1 dalam Lomba Hafalan Al-Quran Tingkat Kecamatan Cikarang. Muhammad Rizki, santri kelas 6, berhasil mengalahkan 30 peserta dari berbagai madrasah.\n\nKepala Madrasah menyampaikan apresiasi atas prestasi yang diraih dan berharap ini menjadi motivasi bagi santri lainnya untuk terus meningkatkan hafalan Al-Quran.', excerpt: 'Muhammad Rizki, santri kelas 6, berhasil meraih Juara 1 Lomba Hafalan Al-Quran Tingkat Kecamatan.', category: 'prestasi', isPublished: true },
    { title: 'Kegiatan Rutin Belajar Mengajar Berjalan Lancar', content: 'Alhamdulillah, kegiatan belajar mengajar di MDTA Miftahul Ulum 01 berjalan dengan lancar dan kondusif. Seluruh santri aktif mengikuti pembelajaran dengan antusias.\n\nKepala Madrasah menyampaikan bahwa pihak madrasah terus berupaya meningkatkan kualitas pembelajaran dengan berbagai inovasi metode pengajaran.', excerpt: 'Kegiatan belajar mengajar di MDTA Miftahul Ulum 01 berjalan dengan lancar dan kondusif.', category: 'kegiatan', isPublished: true },
    { title: 'Lomba Cerdas Cermat Antar Madrasah', content: 'MDTA Miftahul Ulum 01 mengikuti Lomba Cerdas Cermat Antar Madrasah Tingkat Kabupaten Bekasi. Tim yang terdiri dari 4 santri terpilih ini telah mempersiapkan diri dengan baik.\n\nKami mohon doa dari seluruh jamaah agar tim MDTA Miftahul Ulum 01 dapat meraih hasil terbaik.', excerpt: 'MDTA Miftahul Ulum 01 mengikuti Lomba Cerdas Cermat Antar Madrasah Tingkat Kabupaten Bekasi.', category: 'lomba', isPublished: true },
    { title: 'Kajian Bulanan: Adab Mencari Ilmu', content: 'Kajian bulanan kali ini mengangkat tema "Adab Mencari Ilmu" yang disampaikan oleh Ustadz H. Ahmad Dahlan, Lc. Kajian dihadiri oleh kurang lebih 200 jamaah.\n\nDalam kajiannya, Ustadz Ahmad Dahlan menekankan pentingnya adab dalam menuntut ilmu, sebagaimana sabda Nabi SAW: "Barangsiapa yang menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga."', excerpt: 'Kajian bulanan mengangkat tema "Adab Mencari Ilmu" yang disampaikan oleh Ustadz H. Ahmad Dahlan, Lc.', category: 'keagamaan', isPublished: true },
  ]

  for (const n of news) {
    await prisma.news.create({ data: n })
  }

  // Achievements
  const achievements = [
    { title: 'Juara 1 Lomba Hafalan Al-Quran', description: 'Lomba Hafalan Al-Quran Tingkat Kecamatan', achiever: 'Muhammad Rizki', category: 'santri', level: 'kecamatan', year: '2025' },
    { title: 'Juara 2 Lomba Cerdas Cermat', description: 'Lomba Cerdas Cermat Antar Madrasah', achiever: 'Tim MDTA', category: 'santri', level: 'kabupaten', year: '2025' },
    { title: 'Juara 1 Kaligrafi Arab', description: 'Lomba Kaligrafi Arab Tingkat Kabupaten', achiever: 'Aisyah Putri', category: 'santri', level: 'kabupaten', year: '2024' },
    { title: 'Juara 3 Pidato Bilingual', description: 'Lomba Pidato Bahasa Arab dan Inggris', achiever: 'Ahmad Hafiz', category: 'santri', level: 'provinsi', year: '2024' },
    { title: 'Guru Teladan Tingkat Kecamatan', description: 'Penghargaan Guru Teladan', achiever: 'Ustadzah Nurhasanah, S.Pd.I', category: 'guru', level: 'kecamatan', year: '2025' },
    { title: 'Juara 1 Hadroh', description: 'Lomba Hadroh Tingkat Kabupaten', achiever: 'Tim Hadroh MDTA', category: 'santri', level: 'kabupaten', year: '2024' },
    { title: 'Juara 2 Pencak Silat', description: 'Kejuaraan Pencak Silat Pelajar', achiever: 'Rafi Pratama', category: 'santri', level: 'kabupaten', year: '2024' },
    { title: 'Piagam Penghargaan Madrasah Terbaik', description: 'Penghargaan dari Kemenag Kabupaten Bekasi', achiever: 'MDTA Miftahul Ulum 01', category: 'guru', level: 'kabupaten', year: '2023' },
  ]

  for (const a of achievements) {
    await prisma.achievement.create({ data: a })
  }

  // Testimonials
  const testimonials = [
    { name: 'H. Supriadi', role: 'wali_santri', content: 'Alhamdulillah, anak saya menjadi lebih rajin beribadah dan hafal Al-Quran sejak belajar di MDTA Miftahul Ulum 01. Guru-gurunya sangat sabar dan telaten dalam mendidik.' },
    { name: 'Hj. Sri Mulyani', role: 'wali_santri', content: 'Madrasah ini benar-benar membentuk karakter anak saya menjadi lebih baik. Lingkungan yang Islami membuat anak merasa nyaman dan semangat belajar.' },
    { name: 'Ahmad Fauzan, S.Pd', role: 'alumni', content: 'Saya sangat bersyukur pernah belajar di MDTA Miftahul Ulum 01. Ilmu agama yang saya dapatkan menjadi bekal yang sangat berharga dalam kehidupan saya.' },
    { name: 'Siti Rahmawati', role: 'alumni', content: 'Kenangan indah selama belajar di MDTA Miftahul Ulum 01 tidak akan pernah terlupakan. Guru-guru yang menyayangi dan teman-teman yang saling mendukung.' },
    { name: 'H. Dedi Mulyadi', role: 'wali_santri', content: 'Program tahfidz di madrasah ini luar biasa. Anak saya sudah hafal 10 juz dalam 3 tahun. Terima kasih kepada seluruh guru yang telah mendampingi.' },
  ]

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t })
  }

  // FAQ
  const faqs = [
    { question: 'Berapa biaya pendidikan di MDTA Miftahul Ulum 01?', answer: 'Biaya pendidikan di MDTA Miftahul Ulum 01 sangat terjangkau. Biaya pendaftaran Rp 150.000, SPP bulanan Rp 100.000, dan biaya seragam Rp 200.000. Madrasah juga menyediakan keringanan bagi santri yang kurang mampu.', order: 1 },
    { question: 'Kapan pendaftaran santri baru dibuka?', answer: 'Pendaftaran santri baru biasanya dibuka pada bulan Maret-Juni setiap tahunnya. Untuk tahun ajaran 2025/2026, pendaftaran sudah dibuka sejak Maret 2025. Informasi lebih lanjut bisa menghubungi panitia PPDB.', order: 2 },
    { question: 'Apa saja program unggulan yang tersedia?', answer: 'Program unggulan MDTA Miftahul Ulum 01 meliputi: Program Tahfidz Al-Quran 30 Juz, Program Bahasa Arab Aktif, dan Program Pengembangan Bakat dan Prestasi. Selain itu juga ada ekstrakurikuler Pramuka, Kaligrafi, Hadroh, Pencak Silat, dan English Club.', order: 3 },
    { question: 'Bagaimana cara mendaftar sebagai santri baru?', answer: 'Pendaftaran bisa dilakukan secara online melalui formulir di website ini atau datang langsung ke sekretariat madrasah pada jam pelayanan (Senin-Sabtu, 07.00-12.00 WIB). Persyaratan: fotokopi akta kelahiran, fotokopi KK, pas foto 3x4 (4 lembar), dan fotokopi rapor terakhir.', order: 4 },
    { question: 'Apakah ada asrama untuk santri?', answer: 'Saat ini MDTA Miftahul Ulum 01 belum menyediakan asrama. Namun, madrasah sedang merencanakan pembangunan asrama untuk memfasilitasi santri yang bertempat tinggal jauh.', order: 5 },
    { question: 'Jam belajar di madrasah berapa?', answer: 'Kegiatan belajar mengajar dilaksanakan Senin-Sabtu pukul 07.00-12.00 WIB. Kegiatan ekstrakurikuler dilaksanakan pada hari Sabtu siang setelah jam pelajaran berakhir.', order: 6 },
  ]

  for (const f of faqs) {
    await prisma.fAQ.create({ data: f })
  }

  // Gallery
  const galleries = [
    { title: 'Peringatan Isra Mi\'raj 1446 H', image: '/images/gallery/isra-miraj.jpg', category: 'acara', year: '2025', type: 'foto' },
    { title: 'Kegiatan Belajar Mengajar', image: '/images/gallery/kbm.jpg', category: 'kegiatan', year: '2025', type: 'foto' },
    { title: 'Lomba Hafalan Al-Quran', image: '/images/gallery/lomba-hafalan.jpg', category: 'acara', year: '2025', type: 'foto' },
    { title: 'Pramuka Jumat Bersih', image: '/images/gallery/pramuka.jpg', category: 'kegiatan', year: '2025', type: 'foto' },
    { title: 'Wisuda Santri Tahunan', image: '/images/gallery/wisuda.jpg', category: 'tahunan', year: '2024', type: 'foto' },
    { title: 'Kegiatan Hadroh', image: '/images/gallery/hadroh.jpg', category: 'kegiatan', year: '2025', type: 'foto' },
    { title: 'Peringatan Maulid Nabi', image: '/images/gallery/maulid.jpg', category: 'acara', year: '2024', type: 'foto' },
    { title: 'Kaligrafi Santri', image: '/images/gallery/kaligrafi.jpg', category: 'kegiatan', year: '2025', type: 'foto' },
  ]

  for (const g of galleries) {
    await prisma.gallery.create({ data: g })
  }

  // Downloads
  const downloads = [
    { title: 'Formulir Pendaftaran Santri Baru', fileUrl: '/files/formulir-ppdb.pdf', category: 'formulir' },
    { title: 'Kalender Akademik 2025/2026', fileUrl: '/files/kalender-akademik.pdf', category: 'kalender' },
    { title: 'Tata Tertib Santri', fileUrl: '/files/tata-tertib.pdf', category: 'tata_tertib' },
    { title: 'Jadwal Pelajaran Semester Genap', fileUrl: '/files/jadwal-pelajaran.pdf', category: 'jadwal' },
    { title: 'Surat Edaran PPDB 2025/2026', fileUrl: '/files/surat-edaran-ppdb.pdf', category: 'surat_edaran' },
    { title: 'Profil Madrasah', fileUrl: '/files/profil-madrasah.pdf', category: 'lainnya' },
  ]

  for (const d of downloads) {
    await prisma.download.create({ data: d })
  }

  // Alumni
  const alumni = [
    { name: 'Ahmad Fauzan, S.Pd', year: '2015', testimony: 'Ilmu agama yang saya dapatkan di MDTA Miftahul Ulum 01 menjadi bekal yang sangat berharga. Sekarang saya menjadi guru di madrasah lain.', currentActivity: 'Guru MI di Bekasi' },
    { name: 'Siti Rahmawati', year: '2016', testimony: 'Saya sangat bersyukur pernah belajar di sini. Lingkungan yang Islami membentuk karakter saya.', currentActivity: 'Mahasiswi UIN Jakarta' },
    { name: 'Muhammad Ilham', year: '2017', testimony: 'Program tahfidz di madrasah ini sangat bagus. Saya bisa hafal 15 juz selama belajar di sini.', currentActivity: 'Pengusaha Muslim' },
    { name: 'Nurul Hidayah, S.Pd.I', year: '2014', testimony: 'MDTA Miftahul Ulum 01 adalah tempat terbaik untuk belajar agama. Guru-gurunya sangat berdedikasi.', currentActivity: 'Dosen STAI Bekasi' },
    { name: 'Rizki Amalia', year: '2018', testimony: 'Kenangan indah selama di madrasah tidak akan terlupakan. Semoga madrasah terus maju.', currentActivity: 'Karyawan Swasta' },
  ]

  for (const a of alumni) {
    await prisma.alumni.create({ data: a })
  }

  // Dakwah
  const dakwahs = [
    { title: 'Keutamaan Membaca Al-Quran', content: 'Al-Quran adalah kitab suci umat Islam yang diturunkan kepada Nabi Muhammad SAW melalui Malaikat Jibril. Membaca Al-Quran memiliki banyak keutamaan, di antaranya:\n\n1. Mendapat pahala yang berlipat ganda\n2. Mendapat syafaat di hari kiamat\n3. Diangkat derajatnya di surga\n4. Hatinya menjadi tenang dan damai\n5. Dilindungi dari gangguan setan\n\nRasulullah SAW bersabda: "Bacalah Al-Quran, karena ia akan datang pada hari kiamat sebagai pemberi syafaat bagi para pembacanya." (HR. Muslim)', category: 'artikel', author: 'Ustadz H. Muhammad Syafii, S.Pd.I' },
    { title: 'Adab Berpuasa Ramadhan', content: 'Puasa Ramadhan adalah ibadah yang wajib dilaksanakan oleh setiap Muslim yang mukallaf. Namun, puasa tidak hanya menahan diri dari makan dan minum, tetapi juga menjaga adab dan akhlak.\n\nAdab berpuasa yang perlu diperhatikan:\n1. Niat puasa setiap malam\n2. Menyegerakan berbuka puasa\n3. Sahur sebelum fajar\n4. Memperbanyak sedekah\n5. Memperbanyak membaca Al-Quran\n6. Menjaga lisan dari ghibah dan umpatan\n7. Memperbanyak doa dan dzikir', category: 'kultum', author: 'Ustadz Rahman Hakim, S.Ag' },
    { title: 'Kajian: Tadabbur Al-Quran Juz 30', content: 'Kajian bulanan kali ini membahas tentang tadabbur (perenungan) ayat-ayat Al-Quran Juz 30. Juz 30 berisi surat-surat pendek yang sering kita baca dalam shalat.\n\nMari kita telaah bersama makna dan hikmah dari setiap surat agar ibadah kita lebih khusyuk dan bermakna.', category: 'kajian', author: 'Ustadz H. Ahmad Dahlan, Lc' },
    { title: 'Pentingnya Shalat Berjamaah', content: 'Shalat berjamaah memiliki keutamaan yang sangat besar dalam Islam. Rasulullah SAW bersabda bahwa shalat berjamaah lebih utama 27 derajat dibandingkan shalat sendirian.\n\nManfaat shalat berjamaah:\n1. Melatih kedisiplinan\n2. Mempererat ukhuwah Islamiyah\n3. Mendapat pahala yang berlipat\n4. Menjadi simbol persatuan umat\n5. Menghindarkan dari kemalasan', category: 'materi', author: 'Ustadz Abdullah Syafii, S.Pd' },
  ]

  for (const d of dakwahs) {
    await prisma.dakwah.create({ data: d })
  }

  // Schedules
  const schedules = [
    { title: 'Jadwal Senin', day: 'Senin', timeStart: '07:00', timeEnd: '07:30', subject: 'Upacara & Muroja\'ah', teacher: 'Ustadz H. M. Syafii', class: 'Semua Kelas' },
    { title: 'Jadwal Senin', day: 'Senin', timeStart: '07:30', timeEnd: '08:30', subject: 'Al-Quran & Tajwid', teacher: 'Ustadzah Nurhasanah', class: 'Kelas 1-3' },
    { title: 'Jadwal Senin', day: 'Senin', timeStart: '07:30', timeEnd: '08:30', subject: 'Fiqih Ibadah', teacher: 'Ustadzah Fatimah', class: 'Kelas 4-6' },
    { title: 'Jadwal Senin', day: 'Senin', timeStart: '08:30', timeEnd: '09:30', subject: 'Aqidah Akhlak', teacher: 'Ustadzah Nurhasanah', class: 'Kelas 1-3' },
    { title: 'Jadwal Senin', day: 'Senin', timeStart: '08:30', timeEnd: '09:30', subject: 'Hadits', teacher: 'Ustadz Rahman Hakim', class: 'Kelas 4-6' },
    { title: 'Jadwal Selasa', day: 'Selasa', timeStart: '07:00', timeEnd: '08:00', subject: 'Bahasa Arab', teacher: 'Ustadz M. Ihsan', class: 'Semua Kelas' },
    { title: 'Jadwal Selasa', day: 'Selasa', timeStart: '08:00', timeEnd: '09:30', subject: 'Al-Quran & Hafalan', teacher: 'Ustadzah Nurhasanah', class: 'Semua Kelas' },
    { title: 'Jadwal Rabu', day: 'Rabu', timeStart: '07:00', timeEnd: '08:00', subject: 'SKI', teacher: 'Ustadzah Siti Khadijah', class: 'Semua Kelas' },
    { title: 'Jadwal Rabu', day: 'Rabu', timeStart: '08:00', timeEnd: '09:30', subject: 'Fiqih', teacher: 'Ustadzah Fatimah', class: 'Semua Kelas' },
    { title: 'Jadwal Kamis', day: 'Kamis', timeStart: '07:00', timeEnd: '08:00', subject: 'Tajwid', teacher: 'Ustadz Abdullah Syafii', class: 'Semua Kelas' },
    { title: 'Jadwal Jumat', day: 'Jumat', timeStart: '07:00', timeEnd: '08:00', subject: 'Aqidah Akhlak', teacher: 'Ustadzah Rohmatun Nisa', class: 'Semua Kelas' },
    { title: 'Jadwal Sabtu', day: 'Sabtu', timeStart: '07:00', timeEnd: '09:00', subject: 'Ekskul (Pramuka/Hadroh/Kaligrafi)', teacher: 'Semua Guru', class: 'Semua Kelas' },
  ]

  for (const s of schedules) {
    await prisma.schedule.create({ data: s })
  }

  // Payment Info
  const payments = [
    { title: 'SPP Bulanan', amount: 'Rp 100.000', description: 'Sumbangan Pembinaan Pendidikan bulanan', isActive: true },
    { title: 'Biaya Pendaftaran Santri Baru', amount: 'Rp 150.000', description: 'Dibayarkan satu kali saat pendaftaran', isActive: true },
    { title: 'Seragam Madrasah', amount: 'Rp 200.000', description: 'Termasuk baju koko, peci, dan seragam olahraga', isActive: true },
    { title: 'Buku Paket Pelajaran', amount: 'Rp 150.000', description: 'Dibayarkan satu kali di awal tahun ajaran', isActive: true },
  ]

  for (const p of payments) {
    await prisma.paymentInfo.create({ data: p })
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
