// sites/rxlens/src/lib/pdf-export.tsx

import { pdf } from '@react-pdf/renderer'

import { ReportPdfDocument } from '@/components/report-pdf-document'
import type { PgxReport } from '@/lib/pgx-types'

export async function buildReportPdfBlob(report: PgxReport): Promise<Blob> {
  return pdf(<ReportPdfDocument report={report} />).toBlob()
}
