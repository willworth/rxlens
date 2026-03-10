// sites/rxlens/src/lib/pgx-engine.test.ts

import { describe, expect, it } from 'vitest'

import { buildPgxReport } from '@/lib/pgx-engine'

function makeGenotypes(
  overrides: Record<string, string | null>
): Record<string, string | null> {
  return {
    rs4244285: 'GG',
    rs4986893: 'GG',
    rs12248560: 'CC',
    rs3892097: 'GG',
    rs5030655: 'II',
    rs1065852: 'CC',
    rs16947: 'CC',
    rs3918290: 'GG',
    rs55886062: 'TT',
    rs67376798: 'AA',
    rs75017182: 'CC',
    rs4149056: 'TT',
    rs2395029: 'GG',
    ...overrides,
  }
}

describe('buildPgxReport', () => {
  it('calls CYP2C19 poor metabolizer for *2/*2', () => {
    const report = buildPgxReport(
      makeGenotypes({
        rs4244285: 'AA',
      })
    )

    const cyp2c19 = report.geneReports.find((gene) => gene.gene === 'CYP2C19')

    expect(cyp2c19).toBeDefined()
    expect(cyp2c19?.diplotype).toBe('*2/*2')
    expect(cyp2c19?.phenotype).toBe('Poor Metabolizer')
    expect(cyp2c19?.traffic).toBe('red')
  })

  it('calls CYP2D6 poor metabolizer for *4/*4', () => {
    const report = buildPgxReport(
      makeGenotypes({
        rs3892097: 'AA',
      })
    )

    const cyp2d6 = report.geneReports.find((gene) => gene.gene === 'CYP2D6')

    expect(cyp2d6).toBeDefined()
    expect(cyp2d6?.diplotype).toBe('*4/*4')
    expect(cyp2d6?.phenotype).toBe('Poor Metabolizer')
    expect(cyp2d6?.traffic).toBe('red')
  })

  it('calls DPYD intermediate activity for one variant hit', () => {
    const report = buildPgxReport(
      makeGenotypes({
        rs75017182: 'CG',
      })
    )

    const dpyd = report.geneReports.find((gene) => gene.gene === 'DPYD')

    expect(dpyd).toBeDefined()
    expect(dpyd?.phenotype).toBe('Intermediate DPD Activity')
    expect(dpyd?.traffic).toBe('red')
    expect(dpyd?.diplotype).toContain('HapB3')
  })

  it('calls HLA-B*57:01 positive when tag SNP includes T', () => {
    const report = buildPgxReport(
      makeGenotypes({
        rs2395029: 'GT',
      })
    )

    const hlaB = report.geneReports.find((gene) => gene.gene === 'HLA-B*57:01')

    expect(hlaB).toBeDefined()
    expect(hlaB?.traffic).toBe('red')
    expect(hlaB?.phenotype).toContain('Positive')
  })

  it('summarizes actionable and variant gene counts', () => {
    const report = buildPgxReport(
      makeGenotypes({
        rs2395029: 'GT',
        rs4149056: 'CC',
      })
    )

    expect(report.geneReports).toHaveLength(5)
    expect(report.variantGeneCount).toBeGreaterThanOrEqual(2)
    expect(report.actionableGeneCount).toBeGreaterThanOrEqual(2)
  })
})
