// sites/rxlens/src/components/rxlens-app.tsx

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { TARGET_PANEL_RSIDS } from '@/lib/pgx-config'
import { parse23andMeFile } from '@/lib/parse-23andme'
import { buildReportPdfBlob } from '@/lib/pdf-export'
import { buildPgxReport } from '@/lib/pgx-engine'
import type {
  ParseProgressUpdate,
  Parsed23andMeData,
  PgxReport,
} from '@/lib/pgx-types'

const TRAFFIC_STYLES: Record<
  string,
  {
    icon: string
    label: string
    badgeClassName: string
    borderClassName: string
  }
> = {
  red: {
    icon: '🔴',
    label: 'Action recommended',
    badgeClassName: 'bg-red-100 text-red-800 border-red-200',
    borderClassName: 'border-red-200',
  },
  yellow: {
    icon: '🟡',
    label: 'Informational / monitor',
    badgeClassName: 'bg-amber-100 text-amber-800 border-amber-200',
    borderClassName: 'border-amber-200',
  },
  green: {
    icon: '🟢',
    label: 'Normal metabolism',
    badgeClassName: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderClassName: 'border-emerald-200',
  },
}

function formatIsoDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type WorkflowState = 'idle' | 'processing' | 'parsed' | 'error'

export function RxLensApp() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [workflowState, setWorkflowState] = useState<WorkflowState>('idle')
  const [progress, setProgress] = useState<ParseProgressUpdate | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<Parsed23andMeData | null>(null)
  const [report, setReport] = useState<PgxReport | null>(null)
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] =
    useState(false)
  const [showResults, setShowResults] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const canViewResults = hasAcknowledgedDisclaimer && Boolean(report)

  const summaryText = useMemo(() => {
    if (!report) {
      return null
    }

    return `${report.variantGeneCount} of 5 genes show variants that may affect drug response.`
  }, [report])

  async function processFile(file: File) {
    setWorkflowState('processing')
    setProgress({
      phase: 'reading',
      percent: 1,
      message: 'Preparing upload…',
    })
    setErrorMessage(null)
    setParsedData(null)
    setReport(null)
    setHasAcknowledgedDisclaimer(false)
    setShowResults(false)

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }

    try {
      const parsed = await parse23andMeFile(
        file,
        TARGET_PANEL_RSIDS,
        setProgress
      )
      const builtReport = buildPgxReport(parsed.genotypeByRsid, parsed.source)

      setParsedData(parsed)
      setReport(builtReport)
      setWorkflowState('parsed')
    } catch (error) {
      setWorkflowState('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not parse file.'
      )
    }
  }

  async function handleSampleLoad() {
    try {
      const response = await fetch('/samples/23andme-v5-pgx-sample.txt')
      if (!response.ok) {
        throw new Error('Could not load sample file.')
      }

      const text = await response.text()
      const sampleFile = new File([text], '23andme-v5-pgx-sample.txt', {
        type: 'text/plain',
      })

      await processFile(sampleFile)
    } catch (error) {
      setWorkflowState('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not load sample file.'
      )
    }
  }

  async function generatePdf() {
    if (!report) {
      return
    }

    setIsGeneratingPdf(true)

    try {
      const blob = await buildReportPdfBlob(report)
      const nextUrl = URL.createObjectURL(blob)

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }

      setPdfUrl(nextUrl)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not generate PDF report.'
      )
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  function onFileChosen(file: File | null) {
    if (!file) {
      return
    }

    void processFile(file)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_60%,#f8fafc_100%)] text-slate-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              RxLens
            </p>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Client-side pharmacogenomics report generation from 23andMe raw
              data
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              Upload a 23andMe v5 raw file to produce a clinician-ready report
              for CPIC Level A drug-gene pairs. All parsing and interpretation
              happen in your browser.
            </p>
            <div className="inline-flex w-fit rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">
              Privacy guarantee: your genetic data never leaves your browser.
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Upload 23andMe Raw Data
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Accepted format: tab-separated raw file with columns rsid,
              chromosome, position, genotype.
            </p>

            <div
              className="mt-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-400"
              onDragOver={(event) => {
                event.preventDefault()
              }}
              onDrop={(event) => {
                event.preventDefault()
                const droppedFile = event.dataTransfer.files?.[0] ?? null
                onFileChosen(droppedFile)
              }}
            >
              <p className="text-sm text-slate-600">
                Drag and drop your `genome_*.txt` file here
              </p>
              <p className="mt-3 text-xs text-slate-500">or</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                >
                  Choose file
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSampleLoad()
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                >
                  Load sample data
                </button>
                <a
                  href="/samples/23andme-v5-pgx-sample.txt"
                  download
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                >
                  Download sample file
                </a>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.tsv"
                className="hidden"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null
                  onFileChosen(selectedFile)
                }}
              />
            </div>

            {workflowState === 'processing' && progress ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  {progress.message}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-800 transition-all"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {progress.percent}%
                </p>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold text-slate-900">
              How It Works
            </h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
              <li>
                <span className="font-semibold text-slate-900">1.</span> Parse
                the 23andMe file in-browser and extract the pharmacogenomic
                panel SNPs.
              </li>
              <li>
                <span className="font-semibold text-slate-900">2.</span> Assign
                star-alleles and metabolizer phenotypes for five CPIC Level A
                genes.
              </li>
              <li>
                <span className="font-semibold text-slate-900">3.</span>{' '}
                Generate a clinician summary PDF with actionable recommendations
                and technical detail.
              </li>
            </ol>
            <p className="mt-5 text-xs text-slate-500">
              Context: this tool is part of the applied work around the overhang
              thesis.
            </p>
            <Link
              href="https://willworth.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-slate-700 underline hover:text-slate-900"
            >
              Read more on willworth.dev
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-relaxed text-red-900">
          <h2 className="text-base font-semibold">Important Disclaimers</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>This report is not medical advice.</li>
            <li>
              Do not change medication without consulting your healthcare
              provider.
            </li>
            <li>Not evaluated by FDA.</li>
            <li>
              Consumer array data may differ from clinical-grade pharmacogenomic
              testing.
            </li>
          </ul>
        </section>

        {parsedData && report ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Review & Acknowledge
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Parsed {parsedData.parsedRows.toLocaleString()} data rows and
              found {parsedData.observedTargetRsids.length} of{' '}
              {report.targetRsidCount} panel loci.
            </p>
            <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={hasAcknowledgedDisclaimer}
                onChange={(event) => {
                  setHasAcknowledgedDisclaimer(event.target.checked)
                }}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                I understand this report is informational only and I will not
                use it to change medications without clinician oversight.
              </span>
            </label>
            <button
              type="button"
              disabled={!canViewResults}
              onClick={() => {
                setShowResults(true)
              }}
              className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              View report
            </button>
          </section>
        ) : null}

        {showResults && report ? (
          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Clinician Summary
                </h2>
                <p className="mt-2 text-sm text-slate-600">{summaryText}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Generated {formatIsoDate(report.generatedAtIso)} from{' '}
                  {report.source}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void generatePdf()
                  }}
                  disabled={isGeneratingPdf}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingPdf ? 'Generating PDF…' : 'Generate PDF'}
                </button>
                {pdfUrl ? (
                  <a
                    href={pdfUrl}
                    download="rxlens-pharmacogenomic-report.pdf"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Download PDF
                  </a>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {report.geneReports.map((gene) => {
                const trafficStyle = TRAFFIC_STYLES[gene.traffic]

                return (
                  <article
                    key={gene.gene}
                    className={`rounded-xl border p-4 ${trafficStyle.borderClassName}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {gene.gene}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {gene.diplotype}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${trafficStyle.badgeClassName}`}
                      >
                        <span>{trafficStyle.icon}</span>
                        <span>{trafficStyle.label}</span>
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-900">
                      {gene.phenotype}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {gene.cpicRecommendation}
                    </p>

                    <div className="mt-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        Affected drugs:{' '}
                      </span>
                      {gene.affectedDrugs.join(', ')}
                    </div>
                    <a
                      href={gene.cpicGuidelineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-slate-700 underline hover:text-slate-900"
                    >
                      CPIC guideline
                    </a>

                    <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                        Technical details
                      </summary>
                      <ul className="mt-3 space-y-2 text-xs text-slate-700">
                        {gene.rawCalls.map((call) => (
                          <li key={call.rsid}>
                            <span className="font-semibold text-slate-900">
                              {call.rsid}
                            </span>{' '}
                            ({call.genotype ?? 'No-call'}) -{' '}
                            {call.interpretation}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-slate-600">
                        Coverage: {gene.coverage.genotyped}/
                        {gene.coverage.total} loci.
                      </p>
                      {gene.coverage.missingRsids.length > 0 ? (
                        <p className="mt-1 text-xs text-slate-600">
                          Missing loci: {gene.coverage.missingRsids.join(', ')}
                        </p>
                      ) : null}
                      {gene.notes.map((note) => (
                        <p key={note} className="mt-2 text-xs text-slate-600">
                          {note}
                        </p>
                      ))}
                    </details>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
