// sites/rxlens/src/lib/parse-23andme.ts

import { normalizeGenotype } from '@/lib/genotype-utils'
import type { ParseProgressUpdate, Parsed23andMeData } from '@/lib/pgx-types'

function readFileAsText(
  file: File,
  onProgress?: (update: ParseProgressUpdate) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('Failed to read file. Please try again.'))
    }

    reader.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return
      }

      const percent = Math.max(
        1,
        Math.min(35, Math.round((event.loaded / event.total) * 35))
      )

      onProgress({
        phase: 'reading',
        percent,
        message: 'Reading 23andMe raw data file…',
      })
    }

    reader.onload = () => {
      resolve(String(reader.result ?? ''))
    }

    reader.readAsText(file)
  })
}

export function parse23andMeRawText(
  rawText: string,
  targetRsids: Set<string>,
  onProgress?: (update: ParseProgressUpdate) => void
): Parsed23andMeData {
  const genotypeByRsid: Record<string, string | null> = {}
  const lines = rawText.split(/\r?\n/)
  const dataLines = lines.filter((line) => line && !line.startsWith('#'))
  const totalDataLines = Math.max(dataLines.length, 1)

  let parsedRows = 0

  for (const line of dataLines) {
    parsedRows += 1

    if (onProgress && parsedRows % 250 === 0) {
      const parsePortion = Math.round((parsedRows / totalDataLines) * 65)
      onProgress({
        phase: 'parsing',
        percent: Math.min(100, 35 + parsePortion),
        message: `Parsing genotypes (${parsedRows.toLocaleString()} rows)…`,
      })
    }

    const [rsid, _chromosome, _position, genotype] = line.split('\t')

    if (!rsid || !genotype || !targetRsids.has(rsid)) {
      continue
    }

    genotypeByRsid[rsid] = normalizeGenotype(genotype)
  }

  const observedTargetRsids = Object.keys(genotypeByRsid)
  const missingTargetRsids = [...targetRsids].filter(
    (rsid) => !(rsid in genotypeByRsid)
  )

  onProgress?.({
    phase: 'parsing',
    percent: 100,
    message: 'Parsing complete.',
  })

  return {
    source: '23andMe v5 raw data',
    totalRows: lines.length,
    parsedRows,
    genotypeByRsid,
    observedTargetRsids,
    missingTargetRsids,
  }
}

export async function parse23andMeFile(
  file: File,
  targetRsids: Set<string>,
  onProgress?: (update: ParseProgressUpdate) => void
): Promise<Parsed23andMeData> {
  const rawText = await readFileAsText(file, onProgress)
  return parse23andMeRawText(rawText, targetRsids, onProgress)
}
