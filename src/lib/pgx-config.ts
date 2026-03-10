// sites/rxlens/src/lib/pgx-config.ts

import type { GeneId } from '@/lib/pgx-types'

export interface GeneDefinition {
  gene: GeneId
  rsids: string[]
  cpicGuidelineUrl: string
  affectedDrugs: string[]
}

export const GENE_DEFINITIONS: GeneDefinition[] = [
  {
    gene: 'CYP2C19',
    rsids: ['rs4244285', 'rs4986893', 'rs12248560'],
    cpicGuidelineUrl:
      'https://cpicpgx.org/guidelines/guideline-for-clopidogrel-and-cyp2c19/',
    affectedDrugs: ['Clopidogrel', 'Sertraline', 'Escitalopram', 'Omeprazole'],
  },
  {
    gene: 'CYP2D6',
    rsids: ['rs3892097', 'rs5030655', 'rs1065852', 'rs16947'],
    cpicGuidelineUrl:
      'https://cpicpgx.org/guidelines/guideline-for-codeine-and-cyp2d6/',
    affectedDrugs: ['Codeine', 'Tramadol', 'TCAs', 'Paroxetine'],
  },
  {
    gene: 'DPYD',
    rsids: ['rs3918290', 'rs55886062', 'rs67376798', 'rs75017182'],
    cpicGuidelineUrl:
      'https://cpicpgx.org/guidelines/guideline-for-fluoropyrimidines-and-dpyd/',
    affectedDrugs: ['5-FU', 'Capecitabine'],
  },
  {
    gene: 'SLCO1B1',
    rsids: ['rs4149056'],
    cpicGuidelineUrl:
      'https://cpicpgx.org/guidelines/guideline-for-simvastatin-and-slco1b1/',
    affectedDrugs: ['Simvastatin', 'Atorvastatin', 'Rosuvastatin'],
  },
  {
    gene: 'HLA-B*57:01',
    rsids: ['rs2395029'],
    cpicGuidelineUrl:
      'https://cpicpgx.org/guidelines/guideline-for-abacavir-and-hla-b/',
    affectedDrugs: ['Abacavir'],
  },
]

export const CORE_PANEL_RSIDS = GENE_DEFINITIONS.flatMap((gene) => gene.rsids)

export const TARGET_PANEL_RSIDS = new Set<string>(CORE_PANEL_RSIDS)

export const PANEL_NAME = 'RxLens MVP (CPIC Level A, 5 genes)'
