// sites/rxlens/src/lib/genotype-utils.ts

export function normalizeGenotype(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase()

  if (!cleaned || cleaned === '--' || cleaned === '00' || cleaned === 'NN') {
    return null
  }

  if (cleaned.length === 1 && /^[ACGTDI-]$/.test(cleaned)) {
    return `${cleaned}${cleaned}`
  }

  if (cleaned.length !== 2) {
    return cleaned
  }

  const alleles = cleaned.split('')

  if (!alleles.every((allele) => /^[ACGTDI-]$/.test(allele))) {
    return cleaned
  }

  return alleles.sort().join('')
}

export function countAllele(genotype: string | null, allele: string): number {
  if (!genotype) {
    return 0
  }

  return genotype.split('').filter((value) => value === allele).length
}

export function hasAnyAllele(genotype: string | null, allele: string): boolean {
  return countAllele(genotype, allele) > 0
}

export function countDeletionLikeAlleles(genotype: string | null): number {
  if (!genotype) {
    return 0
  }

  return genotype.split('').filter((allele) => allele === 'D' || allele === '-')
    .length
}
