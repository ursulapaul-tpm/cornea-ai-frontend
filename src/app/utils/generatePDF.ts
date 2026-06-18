import jsPDF from 'jspdf'
import { Blueprint } from '../types'

export async function generatePRDPdf(blueprint: Blueprint, idea: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 22, CW = W - M * 2
  let y = M

  const addPage = () => { doc.addPage(); y = M }
  const need = (h: number) => { if (y + h > 272) addPage() }

  const f = (size: number, style: 'normal' | 'bold' = 'normal', color = '#000000') => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(color)
  }

  const rule = (ly: number, thickness = 0.25, color = '#cccccc') => {
    doc.setDrawColor(color)
    doc.setLineWidth(thickness)
    doc.line(M, ly, W - M, ly)
  }

  const tx = (str: string, x: number, ty: number, opts?: any) =>
    doc.text(str || '', x, ty, opts)

  const wrap = (str: string, x: number, wy: number, maxW: number, lh: number): number => {
    const lines = doc.splitTextToSize(str || '', maxW)
    lines.forEach((l: string, i: number) => { need(lh); tx(l, x, wy + i * lh) })
    return lines.length * lh
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // ── Section header ────────────────────────────────────────────────
  const secHead = (num: string, title: string, forceNewPage = false) => {
    if (forceNewPage) addPage()
    else need(20)
    f(9, 'bold', '#555555')
    tx(`SECTION ${num}`, M, y)
    y += 6
    f(16, 'bold', '#000000')
    tx(title, M, y)
    y += 5
    rule(y, 0.5, '#000000')
    y += 8
  }

  // ════════════════════════════════════════════════════════
  // COVER PAGE
  // ════════════════════════════════════════════════════════

  // Top rule
  doc.setDrawColor('#000000')
  doc.setLineWidth(1.5)
  doc.line(M, 20, W - M, 20)

  y = 30
  f(8, 'bold', '#555555')
  tx('PRODUCT REQUIREMENTS DOCUMENT', M, y)
  y += 16

  f(28, 'bold', '#000000')
  const titleLines = doc.splitTextToSize(idea, CW)
  titleLines.forEach((l: string) => { tx(l, M, y); y += 12 })
  y += 8

  rule(y, 0.5, '#000000')
  y += 10

  f(11, 'normal', '#333333')
  const summaryLines = doc.splitTextToSize(blueprint.prd_summary || '', CW)
  summaryLines.slice(0, 6).forEach((l: string) => { tx(l, M, y); y += 6 })
  y += 14

  // Stats table
  const stats = [
    { n: String(blueprint.users?.length || 0), l: 'User Types' },
    { n: String(blueprint.feature_breakdown?.length || 0), l: 'Features' },
    { n: String(blueprint.services?.length || 0), l: 'Services' },
    { n: String(blueprint.integrations?.length || 0), l: 'Integrations' },
    { n: String(blueprint.domain_entities?.length || 0), l: 'Entities' },
    { n: String(blueprint.business_goals?.length || 0), l: 'Goals' },
  ]
  const sw = CW / stats.length
  // Header row
  doc.setFillColor('#f0f0f0')
  doc.setDrawColor('#cccccc')
  doc.setLineWidth(0.25)
  doc.rect(M, y, CW, 18, 'FD')
  stats.forEach((s, i) => {
    const sx = M + i * sw
    if (i > 0) {
      doc.setDrawColor('#cccccc')
      doc.setLineWidth(0.25)
      doc.line(sx, y, sx, y + 18)
    }
    f(18, 'bold', '#000000')
    tx(s.n, sx + sw / 2, y + 10, { align: 'center' } as any)
    f(7, 'normal', '#666666')
    tx(s.l.toUpperCase(), sx + sw / 2, y + 16, { align: 'center' } as any)
  })
  y += 28

  // Meta block
  rule(y, 0.25, '#cccccc')
  y += 8
  const meta = [
    { l: 'Date', v: dateStr },
    { l: 'Version', v: '1.0' },
    { l: 'Status', v: 'Draft' },
    { l: 'Prepared by', v: 'cornea.ai' },
  ]
  meta.forEach((m, i) => {
    const mx = M + i * (CW / 4)
    f(7, 'bold', '#888888'); tx(m.l.toUpperCase(), mx, y)
    f(10, 'bold', '#000000'); tx(m.v, mx, y + 6)
  })

  // Bottom rule on cover
  rule(285, 0.5, '#000000')

  // ════════════════════════════════════════════════════════
  // SECTION 1 — Executive Summary
  // ════════════════════════════════════════════════════════
  addPage()
  secHead('1', 'Executive Summary')

  f(11, 'normal', '#222222')
  summaryLines.forEach((l: string) => { need(7); tx(l, M, y); y += 6 })
  y += 6

  f(11, 'normal', '#444444')
  const expLines = doc.splitTextToSize(blueprint.system_explanation || '', CW)
  expLines.forEach((l: string) => { need(7); tx(l, M, y); y += 6 })
  y += 10

  // ════════════════════════════════════════════════════════
  // SECTION 2 — Problem Statement
  // ════════════════════════════════════════════════════════
  need(20); secHead('2', 'Problem Statement')
  f(11, 'normal', '#444444')
  tx('The following pain points define the core opportunity this product addresses.', M, y)
  y += 10

  ;(blueprint.business_goals || []).slice(0, 4).forEach((g, i) => {
    const gl = doc.splitTextToSize(g, CW - 16)
    const gh = gl.length * 5.5 + 6
    need(gh + 2)
    if (i % 2 === 0) {
      doc.setFillColor('#f7f7f7')
      doc.setDrawColor('#e0e0e0')
      doc.setLineWidth(0.25)
      doc.rect(M, y - 2, CW, gh, 'FD')
    }
    f(8, 'bold', '#555555'); tx(`P${String(i + 1).padStart(2, '0')}`, M + 3, y + 4)
    f(10, 'normal', '#222222'); gl.forEach((l: string, li: number) => tx(l, M + 14, y + 4 + li * 5.5))
    y += gh + 2
  }); y += 10

  // ════════════════════════════════════════════════════════
  // SECTION 3 — Goals
  // ════════════════════════════════════════════════════════
  need(20); secHead('3', 'Goals & Success Metrics')
  ;(blueprint.business_goals || []).forEach((g, i) => {
    const gl = doc.splitTextToSize(g, CW - 16)
    const gh = gl.length * 5.5 + 6
    need(gh + 2)
    if (i % 2 === 0) {
      doc.setFillColor('#f7f7f7')
      doc.rect(M, y - 2, CW, gh, 'F')
    }
    rule(y + gh - 2, 0.2, '#e8e8e8')
    f(8, 'bold', '#555555'); tx(`G${String(i + 1).padStart(2, '0')}`, M + 3, y + 4)
    f(10, 'normal', '#222222'); gl.forEach((l: string, li: number) => tx(l, M + 14, y + 4 + li * 5.5))
    y += gh + 2
  }); y += 10

  // ════════════════════════════════════════════════════════
  // SECTION 4 — User Personas
  // ════════════════════════════════════════════════════════
  secHead('4', 'User Personas', true)
  ;(blueprint.users || []).forEach((u, i) => {
    const dl = doc.splitTextToSize(u.description || '', CW - 4)
    const ch = dl.length * 5.5 + 18
    need(ch + 6)

    // Card outline
    doc.setDrawColor('#cccccc')
    doc.setLineWidth(0.3)
    doc.rect(M, y, CW, ch, 'D')

    // Left accent bar
    doc.setFillColor('#222222')
    doc.rect(M, y, 3, ch, 'F')

    f(12, 'bold', '#000000'); tx(u.name || '', M + 8, y + 9)
    f(8, 'bold', '#555555'); tx((u.role || '').toUpperCase(), M + 8, y + 15)

    rule(y + 17, 0.2, '#dddddd', )
    doc.line(M + 3, y + 17, W - M, y + 17)

    f(10, 'normal', '#444444')
    dl.forEach((l: string, li: number) => tx(l, M + 8, y + 22 + li * 5.5))
    y += ch + 5
  }); y += 4

  // ════════════════════════════════════════════════════════
  // SECTION 5 — Functional Requirements
  // ════════════════════════════════════════════════════════
  secHead('5', 'Functional Requirements', true)

  // Table header
  doc.setFillColor('#222222')
  doc.rect(M, y - 2, CW, 9, 'F')
  f(8, 'bold', '#ffffff')
  tx('ID', M + 2, y + 4)
  tx('FEATURE', M + 20, y + 4)
  tx('DESCRIPTION', M + 65, y + 4)
  tx('PRIORITY', M + 136, y + 4)
  tx('SERVICE', M + 158, y + 4)
  y += 11

  ;(blueprint.feature_breakdown || []).forEach((f2, i) => {
    const featTrunc = doc.splitTextToSize(f2.feature || '', 42)[0]
    const descLines = doc.splitTextToSize(f2.description || '', 66)
    const svcTrunc = doc.splitTextToSize(f2.service || '', 44)[0]
    const rh = Math.max(10, descLines.length * 5 + 6)
    need(rh + 2)

    if (i % 2 === 0) {
      doc.setFillColor('#f7f7f7')
      doc.rect(M, y - 2, CW, rh + 2, 'F')
    }
    doc.setDrawColor('#e8e8e8')
    doc.setLineWidth(0.2)
    doc.line(M, y + rh, W - M, y + rh)

    f(8, 'bold', '#333333'); tx(`FR-${String(i + 1).padStart(3, '0')}`, M + 2, y + 5)
    f(9, 'bold', '#000000'); tx(featTrunc, M + 20, y + 5)
    f(9, 'normal', '#444444'); descLines.forEach((l: string, li: number) => tx(l, M + 65, y + 5 + li * 5))
    f(8, 'bold', '#333333'); tx(f2.badge || '', M + 136, y + 5)
    f(8, 'normal', '#666666'); tx(svcTrunc, M + 158, y + 5)
    y += rh + 2
  }); y += 10

  // ════════════════════════════════════════════════════════
  // SECTION 6 — Non-Functional Requirements
  // ════════════════════════════════════════════════════════
  need(20); secHead('6', 'Non-Functional Requirements')
  const nfrs = [
    { id: 'NFR-001', cat: 'Performance',     req: 'API response time <= 500ms at the 95th percentile under expected load.' },
    { id: 'NFR-002', cat: 'Scalability',     req: 'System must scale horizontally to 10x baseline load without architectural changes.' },
    { id: 'NFR-003', cat: 'Security',        req: 'All data in transit encrypted via TLS 1.3. Sensitive data at rest encrypted with AES-256.' },
    { id: 'NFR-004', cat: 'Availability',    req: 'System must maintain 99.9% uptime SLA, excluding scheduled maintenance windows.' },
    { id: 'NFR-005', cat: 'Maintainability', req: 'Test coverage must exceed 80%. All public APIs documented via OpenAPI specification.' },
    { id: 'NFR-006', cat: 'Accessibility',   req: 'All user-facing interfaces must conform to WCAG 2.1 Level AA standards.' },
  ]

  doc.setFillColor('#222222')
  doc.rect(M, y - 2, CW, 9, 'F')
  f(8, 'bold', '#ffffff')
  tx('ID', M + 2, y + 4); tx('CATEGORY', M + 22, y + 4); tx('REQUIREMENT', M + 58, y + 4)
  y += 11

  nfrs.forEach((r, i) => {
    need(10)
    if (i % 2 === 0) { doc.setFillColor('#f7f7f7'); doc.rect(M, y - 2, CW, 9, 'F') }
    doc.setDrawColor('#e8e8e8'); doc.setLineWidth(0.2); doc.line(M, y + 7, W - M, y + 7)
    f(8, 'bold', '#333333'); tx(r.id, M + 2, y + 3.5)
    f(9, 'bold', '#000000'); tx(r.cat, M + 22, y + 3.5)
    f(9, 'normal', '#444444'); tx(doc.splitTextToSize(r.req, CW - 40)[0], M + 58, y + 3.5)
    y += 9
  }); y += 10

  // ════════════════════════════════════════════════════════
  // SECTION 7 — System Architecture (NEW PAGE)
  // ════════════════════════════════════════════════════════
  secHead('7', 'System Architecture', true)

  f(11, 'normal', '#444444')
  const archLines = doc.splitTextToSize(blueprint.system_explanation || '', CW)
  archLines.slice(0, 3).forEach((l: string) => { tx(l, M, y); y += 6 }); y += 8

  ;(blueprint.services || []).forEach((svc) => {
    const descLines = doc.splitTextToSize(svc.description || '', CW - 6)
    const apis = svc.apis || []
    // Calculate card height: header(14) + desc + spacing(6) + apis
    let apiH = 0
    const apiLineData: { method: string; route: string; purposeLines: string[] }[] = []
    apis.forEach(a => {
      const pLines = doc.splitTextToSize(a.purpose || '', CW - 60)
      apiLineData.push({ method: a.method || '', route: a.route || '', purposeLines: pLines })
      apiH += pLines.length * 5 + 6
    })
    const ch = 14 + descLines.length * 5.5 + 6 + apiH + 8
    need(ch + 6)

    // Outer card
    doc.setDrawColor('#cccccc')
    doc.setLineWidth(0.3)
    doc.rect(M, y, CW, ch, 'D')

    // Header
    doc.setFillColor('#222222')
    doc.rect(M, y, CW, 14, 'F')
    f(11, 'bold', '#ffffff'); tx(svc.name || '', M + 5, y + 9.5)
    f(7, 'bold', '#aaaaaa'); tx((svc.group || '').toUpperCase(), W - M - 4, y + 9.5, { align: 'right' } as any)
    y += 16

    // Description
    f(10, 'normal', '#444444')
    descLines.forEach((l: string) => { tx(l, M + 5, y); y += 5.5 }); y += 5

    // APIs
    apiLineData.forEach(a => {
      const rowH = a.purposeLines.length * 5 + 6
      need(rowH)
      doc.setFillColor('#f4f4f4')
      doc.setDrawColor('#e0e0e0')
      doc.setLineWidth(0.2)
      doc.rect(M + 5, y - 2, CW - 10, rowH, 'FD')

      f(9, 'bold', '#000000'); tx(a.method, M + 9, y + 3.5)
      f(9, 'normal', '#333333'); tx(a.route, M + 28, y + 3.5)
      f(9, 'normal', '#666666')
      a.purposeLines.forEach((pl: string, pi: number) => tx(pl, M + 60, y + 3.5 + pi * 5))
      y += rowH
    })
    y += 10
  })

  // ════════════════════════════════════════════════════════
  // SECTION 8 — Data Architecture (NEW PAGE)
  // ════════════════════════════════════════════════════════
  secHead('8', 'Data Architecture', true)

  // Data layer boxes
  const dataItems = [
    { l: 'Primary Database', v: blueprint.data_layer?.database },
    { l: 'Cache Layer', v: blueprint.data_layer?.cache },
    { l: 'File Storage', v: blueprint.data_layer?.storage },
  ].filter(d => d.v)

  if (dataItems.length > 0) {
    const dw = (CW - (dataItems.length - 1) * 5) / dataItems.length
    dataItems.forEach((d, i) => {
      const dx = M + i * (dw + 5)
      doc.setFillColor('#f0f0f0')
      doc.setDrawColor('#cccccc')
      doc.setLineWidth(0.3)
      doc.rect(dx, y, dw, 18, 'FD')
      f(13, 'bold', '#000000'); tx(d.v!, dx + dw / 2, y + 9, { align: 'center' } as any)
      f(7, 'normal', '#666666'); tx(d.l.toUpperCase(), dx + dw / 2, y + 15, { align: 'center' } as any)
    }); y += 24
  }

  f(10, 'normal', '#444444')
  doc.splitTextToSize(blueprint.data_layer?.description || '', CW).forEach((l: string) => { need(6); tx(l, M, y); y += 5.5 }); y += 8

  // Domain entities
  f(12, 'bold', '#000000'); tx('Domain Entities', M, y); y += 8
  rule(y, 0.3, '#000000'); y += 6

  ;(blueprint.domain_entities || []).forEach((e, ei) => {
    const el = doc.splitTextToSize(e.description || '', CW - 6)
    const fields = e.fields || []
    const fieldRowH = Math.ceil(fields.length / 6) * 7
    const ch = el.length * 5.5 + fieldRowH + 14
    need(ch + 4)

    doc.setDrawColor('#cccccc'); doc.setLineWidth(0.3)
    doc.rect(M, y, CW, ch, 'D')

    // Entity name bar
    doc.setFillColor('#f0f0f0')
    doc.rect(M, y, CW, 11, 'F')
    f(10, 'bold', '#000000'); tx(e.name || '', M + 5, y + 7.5)
    y += 13

    f(9, 'normal', '#555555')
    el.forEach((l: string) => { tx(l, M + 5, y); y += 5.5 }); y += 4

    // Fields
    let fx = M + 5
    fields.forEach(field => {
      const fw = doc.getTextWidth(field) + 8
      if (fx + fw > W - M - 5) { fx = M + 5; y += 7 }
      doc.setFillColor('#e8e8e8')
      doc.setDrawColor('#cccccc')
      doc.setLineWidth(0.2)
      doc.roundedRect(fx, y - 3, fw, 6, 1.5, 1.5, 'FD')
      f(8, 'normal', '#333333'); tx(field, fx + 4, y + 1.5)
      fx += fw + 3
    }); y += 10
  }); y += 6

  // ════════════════════════════════════════════════════════
  // SECTION 9 — Integrations
  // ════════════════════════════════════════════════════════
  need(20); secHead('9', 'External Integrations')

  // Table header
  doc.setFillColor('#222222'); doc.rect(M, y - 2, CW, 9, 'F')
  f(8, 'bold', '#ffffff')
  tx('INTEGRATION', M + 4, y + 4)
  tx('PURPOSE', M + 50, y + 4)
  tx('TYPE', M + 148, y + 4)
  y += 11

  ;(blueprint.integrations || []).forEach((int, i) => {
    const pLines = doc.splitTextToSize(int.purpose || '', 92)
    const rh = pLines.length * 5 + 6
    need(rh + 2)
    if (i % 2 === 0) { doc.setFillColor('#f7f7f7'); doc.rect(M, y - 2, CW, rh + 2, 'F') }
    doc.setDrawColor('#e8e8e8'); doc.setLineWidth(0.2); doc.line(M, y + rh, W - M, y + rh)
    f(10, 'bold', '#000000'); tx(int.name || '', M + 4, y + 4)
    f(9, 'normal', '#444444'); pLines.forEach((l: string, li: number) => tx(l, M + 50, y + 4 + li * 5))
    f(8, 'normal', '#666666'); tx((int.type || '').toUpperCase(), M + 148, y + 4)
    y += rh + 2
  }); y += 10

  // ════════════════════════════════════════════════════════
  // SECTION 10 — Business Rules
  // ════════════════════════════════════════════════════════
  need(20); secHead('10', 'Business Rules & Constraints')
  ;(blueprint.business_rules || []).forEach((r, i) => {
    const rl = doc.splitTextToSize(r, CW - 20)
    const rh = rl.length * 5.5 + 6
    need(rh + 2)
    if (i % 2 === 0) { doc.setFillColor('#f7f7f7'); doc.rect(M, y - 2, CW, rh + 2, 'F') }
    doc.setDrawColor('#e8e8e8'); doc.setLineWidth(0.2); doc.line(M, y + rh, W - M, y + rh)
    f(8, 'bold', '#333333'); tx(`BR-${String(i + 1).padStart(3, '0')}`, M + 2, y + 4)
    f(10, 'normal', '#333333'); rl.forEach((l: string, li: number) => tx(l, M + 22, y + 4 + li * 5.5))
    y += rh + 2
  }); y += 10

  // ════════════════════════════════════════════════════════
  // SECTION 11 — Out of Scope
  // ════════════════════════════════════════════════════════
  need(20); secHead('11', 'Out of Scope - Version 1.0')
  const oos = [
    'Native mobile applications (web-responsive design only)',
    'Third-party plugin or marketplace system',
    'Multi-language and internationalization (i18n) support',
    'Advanced AI or ML capabilities beyond core product scope',
    'Custom on-premise or self-hosted deployment options',
  ]
  oos.forEach((item, i) => {
    need(10)
    if (i % 2 === 0) { doc.setFillColor('#f7f7f7'); doc.rect(M, y - 2, CW, 9, 'F') }
    doc.setDrawColor('#e8e8e8'); doc.setLineWidth(0.2); doc.line(M, y + 7, W - M, y + 7)
    f(9, 'normal', '#333333')
    tx('-', M + 4, y + 3.5)
    tx(item, M + 10, y + 3.5)
    y += 9
  }); y += 8

  // ════════════════════════════════════════════════════════
  // SECTION 12 — Assumptions
  // ════════════════════════════════════════════════════════
  need(20); secHead('12', 'Assumptions & Dependencies')
  const assumptions = (blueprint.system_boundaries || []).length > 0
    ? blueprint.system_boundaries
    : [
        'Users access the product via a modern web browser.',
        'Third-party services maintain API backward compatibility during development.',
        'Infrastructure provisioned on a major cloud provider.',
        'Development team follows standard agile practices.',
        'Legal and compliance review completed before production launch.',
      ]

  doc.setFillColor('#222222'); doc.rect(M, y - 2, CW, 9, 'F')
  f(8, 'bold', '#ffffff'); tx('ID', M + 2, y + 4); tx('ASSUMPTION', M + 18, y + 4); y += 11

  assumptions.forEach((a, i) => {
    const al = doc.splitTextToSize(a, CW - 20)
    const ah = al.length * 5.5 + 6
    need(ah + 2)
    if (i % 2 === 0) { doc.setFillColor('#f7f7f7'); doc.rect(M, y - 2, CW, ah + 2, 'F') }
    doc.setDrawColor('#e8e8e8'); doc.setLineWidth(0.2); doc.line(M, y + ah, W - M, y + ah)
    f(8, 'bold', '#333333'); tx(`A${String(i + 1).padStart(2, '0')}`, M + 2, y + 4)
    f(10, 'normal', '#333333'); al.forEach((l: string, li: number) => tx(l, M + 18, y + 4 + li * 5.5))
    y += ah + 2
  })

  // ── Footer on every page ──────────────────────────────
  const total = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setDrawColor('#000000')
    doc.setLineWidth(0.5)
    doc.line(M, 284, W - M, 284)
    f(8, 'normal', '#888888')
    tx('cornea.ai', M, 289)
    tx('CONFIDENTIAL  |  Version 1.0', W / 2, 289, { align: 'center' } as any)
    tx(`Page ${p} of ${total}`, W - M, 289, { align: 'right' } as any)
  }

  doc.save(`prd-${idea.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
}