// sites/rxlens/src/lib/pgx-types.ts

export type GeneId = 'CYP2C19' | 'CYP2D6' | 'DPYD' | 'SLCO1B1' | 'HLA-B*57:01'

export type TrafficLight = 'red' | 'yellow' | 'green'

export interface RawVariantCall {
  rsid: string
  genotype: string | null
  interpretation: string
}

export interface GeneCoverage {
  genotyped: number
  total: number
  missingRsids: string[]
}

export interface GeneReport {
  gene: GeneId
  diplotype: string
  phenotype: string
  traffic: TrafficLight
  affectedDrugs: string[]
  cpicRecommendation: string
  cpicGuidelineUrl: string
  rawCalls: RawVariantCall[]
  coverage: GeneCoverage
  notes: string[]
}

export interface PgxReport {
  generatedAtIso: string
  source: string
  panelName: string
  geneReports: GeneReport[]
  variantGeneCount: number
  actionableGeneCount: number
  targetRsidCount: number
  observedRsidCount: number
}

export interface ParseProgressUpdate {
  phase: 'reading' | 'parsing'
  percent: number
  message: string
}

export interface Parsed23andMeData {
  source: string
  totalRows: number
  parsedRows: number
  genotypeByRsid: Record<string, string | null>
  observedTargetRsids: string[]
  missingTargetRsids: string[]
}
