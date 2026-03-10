// sites/rxlens/src/lib/pgx-engine.ts

import {
  GENE_DEFINITIONS,
  PANEL_NAME,
  TARGET_PANEL_RSIDS,
} from '@/lib/pgx-config'
import {
  countAllele,
  countDeletionLikeAlleles,
  hasAnyAllele,
} from '@/lib/genotype-utils'
import type {
  GeneCoverage,
  GeneId,
  GeneReport,
  PgxReport,
  RawVariantCall,
  TrafficLight,
} from '@/lib/pgx-types'

const geneDefinitionById = new Map(
  GENE_DEFINITIONS.map((definition) => [definition.gene, definition])
)

function getGeneContext(gene: GeneId) {
  const context = geneDefinitionById.get(gene)

  if (!context) {
    throw new Error(`Missing gene definition for ${gene}`)
  }

  return context
}

function getGenotype(
  genotypeByRsid: Record<string, string | null>,
  rsid: string
): string | null {
  return genotypeByRsid[rsid] ?? null
}

function buildCoverage(
  rsids: string[],
  genotypeByRsid: Record<string, string | null>
): GeneCoverage {
  const genotyped = rsids.filter(
    (rsid) => getGenotype(genotypeByRsid, rsid) !== null
  ).length

  return {
    genotyped,
    total: rsids.length,
    missingRsids: rsids.filter(
      (rsid) => getGenotype(genotypeByRsid, rsid) === null
    ),
  }
}

function defaultRawCall(
  rsid: string,
  genotype: string | null,
  interpretation: string
): RawVariantCall {
  return {
    rsid,
    genotype,
    interpretation,
  }
}

function callCyp2c19(
  genotypeByRsid: Record<string, string | null>
): GeneReport {
  const context = getGeneContext('CYP2C19')

  const genotype2 = getGenotype(genotypeByRsid, 'rs4244285')
  const genotype3 = getGenotype(genotypeByRsid, 'rs4986893')
  const genotype17 = getGenotype(genotypeByRsid, 'rs12248560')

  const copy2 = countAllele(genotype2, 'A')
  const copy3 = countAllele(genotype3, 'A')
  const copy17 = countAllele(genotype17, 'T')

  const lossCopies = Math.min(2, copy2 + copy3)

  let diplotype = 'Indeterminate'
  let phenotype = 'Indeterminate'
  let traffic: TrafficLight = 'yellow'
  let cpicRecommendation =
    'Insufficient CYP2C19 data to assign a complete phenotype. Consider clinical-grade genotyping.'

  if (lossCopies === 0 && copy17 === 0) {
    diplotype = '*1/*1'
    phenotype = 'Normal Metabolizer'
    traffic = 'green'
    cpicRecommendation =
      'Standard CYP2C19-guided prescribing is appropriate for clopidogrel and related medications.'
  } else if (lossCopies === 1 && copy17 === 0) {
    diplotype = copy2 > 0 ? '*1/*2' : '*1/*3'
    phenotype = 'Intermediate Metabolizer'
    traffic = 'red'
    cpicRecommendation =
      'Reduced CYP2C19 function may decrease clopidogrel activation and alter SSRI/PPI exposure; use CPIC-guided alternatives or dose adjustment.'
  } else if (lossCopies >= 2 && copy17 === 0) {
    if (copy2 >= 1 && copy3 >= 1) {
      diplotype = '*2/*3'
    } else if (copy2 >= 2) {
      diplotype = '*2/*2'
    } else {
      diplotype = '*3/*3'
    }

    phenotype = 'Poor Metabolizer'
    traffic = 'red'
    cpicRecommendation =
      'Avoid standard clopidogrel strategy; select alternative antiplatelet therapy and follow CPIC guidance for affected drugs.'
  } else if (lossCopies === 0 && copy17 > 0) {
    if (copy17 === 1) {
      diplotype = '*1/*17'
      phenotype = 'Rapid Metabolizer'
    } else {
      diplotype = '*17/*17'
      phenotype = 'Ultra-rapid Metabolizer'
    }

    traffic = 'yellow'
    cpicRecommendation =
      'Increased CYP2C19 activity may reduce exposure for some drugs (e.g., certain PPIs/SSRIs). Consider CPIC-concordant selection and monitoring.'
  } else if (lossCopies > 0 && copy17 > 0) {
    diplotype = copy2 > 0 ? '*2/*17' : '*3/*17'
    phenotype = 'Intermediate Metabolizer (mixed function alleles)'
    traffic = 'red'
    cpicRecommendation =
      'Mixed increased and loss-of-function CYP2C19 alleles detected. Treat as clinically significant and apply CPIC recommendations conservatively.'
  }

  const rawCalls: RawVariantCall[] = [
    defaultRawCall(
      'rs4244285',
      genotype2,
      copy2 > 0 ? 'CYP2C19*2 variant detected' : 'No CYP2C19*2 variant detected'
    ),
    defaultRawCall(
      'rs4986893',
      genotype3,
      copy3 > 0 ? 'CYP2C19*3 variant detected' : 'No CYP2C19*3 variant detected'
    ),
    defaultRawCall(
      'rs12248560',
      genotype17,
      copy17 > 0
        ? 'CYP2C19*17 variant detected'
        : 'No CYP2C19*17 variant detected'
    ),
  ]

  return {
    gene: 'CYP2C19',
    diplotype,
    phenotype,
    traffic,
    affectedDrugs: context.affectedDrugs,
    cpicRecommendation,
    cpicGuidelineUrl: context.cpicGuidelineUrl,
    rawCalls,
    coverage: buildCoverage(context.rsids, genotypeByRsid),
    notes: [],
  }
}

function callCyp2d6(genotypeByRsid: Record<string, string | null>): GeneReport {
  const context = getGeneContext('CYP2D6')

  const genotype4 = getGenotype(genotypeByRsid, 'rs3892097')
  const genotype6 = getGenotype(genotypeByRsid, 'rs5030655')
  const genotype10 = getGenotype(genotypeByRsid, 'rs1065852')
  const genotype2 = getGenotype(genotypeByRsid, 'rs16947')

  const copy4 = countAllele(genotype4, 'A')
  const copy6 = countDeletionLikeAlleles(genotype6)
  const copy10 = countAllele(genotype10, 'T')
  const copy2 = countAllele(genotype2, 'T')

  const lossCopies = Math.min(2, copy4 + copy6)

  let diplotype = 'Indeterminate'
  let phenotype = 'Indeterminate'
  let traffic: TrafficLight = 'yellow'
  let cpicRecommendation =
    'Insufficient CYP2D6 data to assign a complete metabolizer status. Consider clinical testing before major medication changes.'

  if (lossCopies >= 2) {
    if (copy4 >= 1 && copy6 >= 1) {
      diplotype = '*4/*6'
    } else if (copy4 >= 2) {
      diplotype = '*4/*4'
    } else {
      diplotype = '*6/*6'
    }

    phenotype = 'Poor Metabolizer'
    traffic = 'red'
    cpicRecommendation =
      'Likely poor CYP2D6 metabolism. Avoid standard codeine/tramadol pathways and use CPIC alternatives for CYP2D6-dependent drugs.'
  } else if (lossCopies === 1 || copy10 > 0) {
    if (lossCopies === 1) {
      if (copy4 > 0) {
        diplotype = copy10 > 0 ? '*4/*10' : '*1/*4'
      } else {
        diplotype = copy10 > 0 ? '*6/*10' : '*1/*6'
      }
    } else {
      diplotype = copy10 === 2 ? '*10/*10' : '*1/*10'
    }

    phenotype = 'Intermediate Metabolizer'
    traffic = 'red'
    cpicRecommendation =
      'Reduced CYP2D6 activity likely. Use CPIC dosing or alternative therapy for opioids, TCAs, and affected antidepressants.'
  } else {
    if (copy2 >= 2) {
      diplotype = '*2/*2'
    } else if (copy2 === 1) {
      diplotype = '*1/*2'
    } else {
      diplotype = '*1/*1'
    }

    phenotype = 'Normal Metabolizer'
    traffic = 'green'
    cpicRecommendation =
      'No reduced-function CYP2D6 variants detected in this panel. Standard CYP2D6-guided prescribing is generally appropriate.'
  }

  const rawCalls: RawVariantCall[] = [
    defaultRawCall(
      'rs3892097',
      genotype4,
      copy4 > 0 ? 'CYP2D6*4 variant detected' : 'No CYP2D6*4 variant detected'
    ),
    defaultRawCall(
      'rs5030655',
      genotype6,
      copy6 > 0
        ? 'CYP2D6*6-like deletion signal detected (array proxy)'
        : 'No CYP2D6*6-like deletion signal detected'
    ),
    defaultRawCall(
      'rs1065852',
      genotype10,
      copy10 > 0
        ? 'CYP2D6*10 reduced-function variant detected'
        : 'No CYP2D6*10 variant detected'
    ),
    defaultRawCall(
      'rs16947',
      genotype2,
      copy2 > 0
        ? 'CYP2D6*2 normal-function marker detected'
        : 'No CYP2D6*2 marker detected'
    ),
  ]

  return {
    gene: 'CYP2D6',
    diplotype,
    phenotype,
    traffic,
    affectedDrugs: context.affectedDrugs,
    cpicRecommendation,
    cpicGuidelineUrl: context.cpicGuidelineUrl,
    rawCalls,
    coverage: buildCoverage(context.rsids, genotypeByRsid),
    notes: [
      'CYP2D6 copy-number variants (gene duplications/deletions) are not detectable from consumer SNP arrays and can materially change phenotype.',
    ],
  }
}

function callDpyd(genotypeByRsid: Record<string, string | null>): GeneReport {
  const context = getGeneContext('DPYD')

  const variantSpecs: Array<{ rsid: string; allele: string; label: string }> = [
    { rsid: 'rs3918290', allele: 'A', label: '*2A (c.1905+1G>A)' },
    { rsid: 'rs55886062', allele: 'G', label: 'c.1679T>G' },
    { rsid: 'rs67376798', allele: 'T', label: 'c.2846A>T' },
    { rsid: 'rs75017182', allele: 'G', label: 'HapB3 (c.1129-5923C>G)' },
  ]

  const variantHits = variantSpecs
    .map((spec) => {
      const genotype = getGenotype(genotypeByRsid, spec.rsid)
      const copies = countAllele(genotype, spec.allele)
      return {
        ...spec,
        genotype,
        copies,
      }
    })
    .filter((entry) => entry.copies > 0)

  const alleleHitCount = variantHits.reduce(
    (sum, variant) => sum + Math.min(variant.copies, 2),
    0
  )

  let diplotype = 'Indeterminate'
  let phenotype = 'Indeterminate'
  let traffic: TrafficLight = 'yellow'
  let cpicRecommendation =
    'Insufficient DPYD data to assign fluoropyrimidine risk status. Clinical-grade confirmatory testing is recommended.'

  if (alleleHitCount === 0) {
    diplotype = '*1/*1'
    phenotype = 'Normal DPD Activity'
    traffic = 'green'
    cpicRecommendation =
      'No high-risk DPYD variants detected in this panel. Standard fluoropyrimidine starting strategy is generally appropriate.'
  } else if (alleleHitCount === 1) {
    const firstVariant = variantHits[0]
    diplotype = firstVariant ? `*1/${firstVariant.label}` : '*1/Variant'
    phenotype = 'Intermediate DPD Activity'
    traffic = 'red'
    cpicRecommendation =
      'Reduced DPD activity likely. CPIC recommends reduced starting dose and careful titration/monitoring for fluoropyrimidines.'
  } else {
    const firstLabel = variantHits[0]?.label ?? 'Variant'
    const secondLabel = variantHits[1]?.label ?? firstLabel
    diplotype = `${firstLabel}/${secondLabel}`
    phenotype = 'Poor DPD Activity'
    traffic = 'red'
    cpicRecommendation =
      'High risk for severe fluoropyrimidine toxicity. Standard 5-FU/capecitabine dosing is contraindicated; use alternative strategy per CPIC.'
  }

  const rawCalls: RawVariantCall[] = variantSpecs.map((spec) => {
    const genotype = getGenotype(genotypeByRsid, spec.rsid)
    const detected = hasAnyAllele(genotype, spec.allele)

    return defaultRawCall(
      spec.rsid,
      genotype,
      detected
        ? `${spec.label} variant detected`
        : `${spec.label} variant not detected`
    )
  })

  return {
    gene: 'DPYD',
    diplotype,
    phenotype,
    traffic,
    affectedDrugs: context.affectedDrugs,
    cpicRecommendation,
    cpicGuidelineUrl: context.cpicGuidelineUrl,
    rawCalls,
    coverage: buildCoverage(context.rsids, genotypeByRsid),
    notes: [],
  }
}

function callSlco1b1(
  genotypeByRsid: Record<string, string | null>
): GeneReport {
  const context = getGeneContext('SLCO1B1')
  const genotype = getGenotype(genotypeByRsid, 'rs4149056')
  const cCount = countAllele(genotype, 'C')

  let diplotype = 'Indeterminate'
  let phenotype = 'Indeterminate'
  let traffic: TrafficLight = 'yellow'
  let cpicRecommendation =
    'Insufficient SLCO1B1 data for statin myopathy risk assignment. Consider confirmatory testing if clinically relevant.'

  if (genotype) {
    if (cCount === 0) {
      diplotype = '*1/*1'
      phenotype = 'Normal Function'
      traffic = 'green'
      cpicRecommendation =
        'SLCO1B1 function appears normal for rs4149056. Standard statin strategy is generally appropriate.'
    } else if (cCount === 1) {
      diplotype = '*1/*5'
      phenotype = 'Intermediate Function'
      traffic = 'yellow'
      cpicRecommendation =
        'Intermediate SLCO1B1 function can increase statin exposure. Consider lower simvastatin intensity or alternative statin.'
    } else {
      diplotype = '*5/*5'
      phenotype = 'Poor Function'
      traffic = 'red'
      cpicRecommendation =
        'High statin myopathy risk for simvastatin exposure. CPIC-guided statin selection/dosing adjustment is recommended.'
    }
  }

  const rawCalls: RawVariantCall[] = [
    defaultRawCall(
      'rs4149056',
      genotype,
      cCount > 0
        ? 'SLCO1B1*5 reduced-function variant detected'
        : 'SLCO1B1*5 reduced-function variant not detected'
    ),
  ]

  return {
    gene: 'SLCO1B1',
    diplotype,
    phenotype,
    traffic,
    affectedDrugs: context.affectedDrugs,
    cpicRecommendation,
    cpicGuidelineUrl: context.cpicGuidelineUrl,
    rawCalls,
    coverage: buildCoverage(context.rsids, genotypeByRsid),
    notes: [],
  }
}

function callHlaB5701(
  genotypeByRsid: Record<string, string | null>
): GeneReport {
  const context = getGeneContext('HLA-B*57:01')
  const genotype = getGenotype(genotypeByRsid, 'rs2395029')
  const positive = hasAnyAllele(genotype, 'T')

  let diplotype = 'Indeterminate'
  let phenotype = 'Indeterminate'
  let traffic: TrafficLight = 'yellow'
  let cpicRecommendation =
    'Insufficient HLA-B*57:01 tag SNP data; confirm with clinical HLA typing before abacavir exposure.'

  if (genotype) {
    diplotype = positive ? 'Tag-positive (GT/TT)' : 'Tag-negative (GG)'
    phenotype = positive
      ? 'Positive HLA-B*57:01 Tag Signal'
      : 'Negative HLA-B*57:01 Tag Signal'
    traffic = positive ? 'red' : 'green'
    cpicRecommendation = positive
      ? 'Do not use abacavir. CPIC recommends avoiding abacavir in HLA-B*57:01-positive individuals.'
      : 'No HLA-B*57:01 tag signal detected. Standard abacavir strategy still requires clinician judgment.'
  }

  const rawCalls: RawVariantCall[] = [
    defaultRawCall(
      'rs2395029',
      genotype,
      positive
        ? 'HLA-B*57:01 tag SNP positive (higher abacavir hypersensitivity risk)'
        : 'HLA-B*57:01 tag SNP negative'
    ),
  ]

  return {
    gene: 'HLA-B*57:01',
    diplotype,
    phenotype,
    traffic,
    affectedDrugs: context.affectedDrugs,
    cpicRecommendation,
    cpicGuidelineUrl: context.cpicGuidelineUrl,
    rawCalls,
    coverage: buildCoverage(context.rsids, genotypeByRsid),
    notes: [
      'rs2395029 is a tag SNP and not a direct high-resolution HLA call. Confirmatory clinical typing may be warranted.',
    ],
  }
}

export function buildPgxReport(
  genotypeByRsid: Record<string, string | null>,
  source = '23andMe v5 raw data'
): PgxReport {
  const geneReports: GeneReport[] = [
    callCyp2c19(genotypeByRsid),
    callCyp2d6(genotypeByRsid),
    callDpyd(genotypeByRsid),
    callSlco1b1(genotypeByRsid),
    callHlaB5701(genotypeByRsid),
  ]

  const variantGeneCount = geneReports.filter(
    (gene) => gene.traffic !== 'green'
  ).length
  const actionableGeneCount = geneReports.filter(
    (gene) => gene.traffic === 'red'
  ).length

  return {
    generatedAtIso: new Date().toISOString(),
    source,
    panelName: PANEL_NAME,
    geneReports,
    variantGeneCount,
    actionableGeneCount,
    targetRsidCount: TARGET_PANEL_RSIDS.size,
    observedRsidCount: Object.values(genotypeByRsid).filter(Boolean).length,
  }
}
