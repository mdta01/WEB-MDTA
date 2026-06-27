# Task 2-b - Section Settings Migration Agent

## Task
Replace hardcoded values with API-driven settings in ProfilSection.tsx and PPDBSection.tsx

## What Was Done

### Database Updates
Added 5 missing settings to the SiteSetting table:
- `madrasah_history_year` = "1998"
- `madrasah_goals` = numbered list of 4 goals
- `madrasah_struktur_organisasi` = JSON array of 6 org members with role/name/level
- `ppdb_requirements` = 6 newline-separated requirement items
- `ppdb_contact` = 2 contacts in "name|phone" format

### ProfilSection.tsx Changes
- Added `useQuery` for `/api/settings` with `getSetting` helper
- **Sejarah**: Replaced hardcoded "MDTA Miftahul Ulum 01" → `getSetting('madrasah_name')`, "1995" → `getSetting('madrasah_history_year')`, 3 paragraphs → `getSetting('madrasah_history')` split by newlines
- **Visi**: Hardcoded text → `getSetting('madrasah_vision')`
- **Misi**: Hardcoded 5 items → `parseNumberedList(getSetting('madrasah_mission'))`
- **Tujuan**: Hardcoded 4 items → `parseNumberedList(getSetting('madrasah_goals'))`
- **Struktur Organisasi**: Hardcoded 6-person chart → `JSON.parse(getSetting('madrasah_struktur_organisasi'))` with level-based rendering (1=Kepala, 2=Wakil, 3=Staff)
- All sections have graceful empty state fallbacks

### PPDBSection.tsx Changes
- Added `useQuery` for `/api/payments` and `/api/events`
- **Persyaratan**: Hardcoded 6 items → parsed from `getSetting('ppdb_requirements')` (newline-separated)
- **Biaya Pendidikan**: Hardcoded 5 fee items → from payments API with title/amount/description, empty state
- **Jadwal Pendaftaran**: Hardcoded 3 timeline items → from events API filtered by category='ppdb', empty state
- **Kontak Panitia**: Hardcoded 2 contacts → parsed from `getSetting('ppdb_contact')` (format: "name|phone" per line)

## Verification
- ESLint: 0 errors
- Dev server: All API routes returning 200
- Worklog updated
