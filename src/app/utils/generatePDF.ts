import jsPDF from 'jspdf'
import { Blueprint } from '../types'

const T = {
  h1: 24, h2: 16, h3: 12, h4: 10, body: 10, small: 8, tiny: 7,
  lh: 5.5, lhSm: 4.8, sectionGap: 14, cardGap: 5,
  W: 210, M: 20,
  black: '#000000', dark: '#1a1a1a', mid: '#444444', light: '#777777', faint: '#aaaaaa',
  rule: '#cccccc', ruleFaint: '#e8e8e8', fillAlt: '#f5f5f5', fillHead: '#1a1a1a', white: '#ffffff',
}
const CW = T.W - T.M * 2

export async function generatePRDPdf(blueprint: Blueprint, idea: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = T.M

  const addPage = () => { doc.addPage(); y = T.M }
  const need = (h: number) => { if (y + h > 274) addPage() }

  const font = (size: number, style: 'normal' | 'bold' = 'normal', color = T.dark) => {
    doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(color)
  }
  const hr = (hy: number, thickness = 0.25, color = T.rule) => {
    doc.setDrawColor(color); doc.setLineWidth(thickness); doc.line(T.M, hy, T.W - T.M, hy)
  }
  const fillRect = (x: number, ry: number, w: number, h: number, fill: string, stroke?: string, lw = 0.25, r = 0) => {
    doc.setFillColor(fill)
    if (stroke) { doc.setDrawColor(stroke); doc.setLineWidth(lw) } else { doc.setDrawColor(fill) }
    const mode = stroke ? 'FD' : 'F'
    r > 0 ? doc.roundedRect(x, ry, w, h, r, r, mode) : doc.rect(x, ry, w, h, mode)
  }
  const strokeRect = (x: number, ry: number, w: number, h: number, color = T.rule, lw = 0.3, r = 0) => {
    doc.setDrawColor(color); doc.setLineWidth(lw)
    r > 0 ? doc.roundedRect(x, ry, w, h, r, r, 'D') : doc.rect(x, ry, w, h, 'D')
  }
  const txt = (str: string, x: number, ty: number, opts?: any) => doc.text(String(str || ''), x, ty, opts)

  // Truncate text to fit a max width with ellipsis
  const truncate = (str: string, maxW: number): string => {
    let s = str || ''
    if (doc.getTextWidth(s) <= maxW) return s
    while (doc.getTextWidth(s) > maxW && s.length > 3) s = s.slice(0, -1)
    return s.slice(0, -1) + '…'
  }

  const sectionHeader = (num: string, title: string, forceNewPage = false) => {
    if (forceNewPage) addPage()
    else need(22)
    y += 2
    font(T.tiny, 'bold', T.faint); txt(`SECTION ${num}`, T.M, y); y += 5
    font(T.h2, 'bold', T.black); txt(title, T.M, y); y += 4
    hr(y, 0.6, T.black); y += 8
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // ════════════════ COVER ════════════════
  hr(18, 2, T.black)
  y = 28
  font(T.tiny, 'bold', T.faint); txt('PRODUCT REQUIREMENTS DOCUMENT', T.M, y); y += 14
  font(T.h1, 'bold', T.black)
  const titleLines = doc.splitTextToSize(idea, CW)
  titleLines.forEach((l: string) => { txt(l, T.M, y); y += 10 }); y += 6
  hr(y, 0.4); y += 8

  font(T.body, 'normal', T.mid)
  const sumLines = doc.splitTextToSize(blueprint.prd_summary || '', CW)
  sumLines.slice(0, 6).forEach((l: string) => { txt(l, T.M, y); y += T.lh }); y += 12

  const stats = [
    { n: String(blueprint.users?.length || 0), l: 'User Types' },
    { n: String(blueprint.feature_breakdown?.length || 0), l: 'Features' },
    { n: String(blueprint.services?.length || 0), l: 'Services' },
    { n: String(blueprint.integrations?.length || 0), l: 'Integrations' },
    { n: String(blueprint.domain_entities?.length || 0), l: 'Entities' },
    { n: String(blueprint.business_goals?.length || 0), l: 'Goals' },
  ]
  const sw = CW / stats.length
  fillRect(T.M, y, CW, 20, '#f0f0f0', T.rule, 0.3)
  stats.forEach((s, i) => {
    if (i > 0) { doc.setDrawColor(T.rule); doc.setLineWidth(0.25); doc.line(T.M + i * sw, y, T.M + i * sw, y + 20) }
    font(16, 'bold', T.black); txt(s.n, T.M + i * sw + sw / 2, y + 10, { align: 'center' } as any)
    font(T.tiny, 'normal', T.light); txt(s.l.toUpperCase(), T.M + i * sw + sw / 2, y + 17, { align: 'center' } as any)
  }); y += 28

  hr(y, 0.25); y += 7
  const meta = [{ l: 'DATE', v: dateStr }, { l: 'VERSION', v: '1.0' }, { l: 'STATUS', v: 'Draft' }, { l: 'PREPARED BY', v: 'cornea.ai' }]
  meta.forEach((m, i) => {
    const mx = T.M + i * (CW / 4)
    font(T.tiny, 'bold', T.faint); txt(m.l, mx, y)
    font(T.body, 'bold', T.dark); txt(m.v, mx, y + 6)
  })

  // ════════════════ SECTION 1 ════════════════
  addPage()
  sectionHeader('1', 'Executive Summary')
  const s1Lines = doc.splitTextToSize(blueprint.prd_summary || '', CW - 12)
  const s1H = s1Lines.length * T.lh + 10
  need(s1H + 4)
  fillRect(T.M, y, CW, s1H, '#f5f5f5', T.rule, 0.3)
  fillRect(T.M, y, 3, s1H, T.black)
  font(T.body, 'normal', T.dark)
  s1Lines.forEach((l: string, i: number) => txt(l, T.M + 8, y + 6 + i * T.lh))
  y += s1H + 8

  const expLines = doc.splitTextToSize(blueprint.system_explanation || '', CW)
  const expH = expLines.length * T.lh
  need(expH + 4)
  font(T.body, 'normal', T.mid)
  expLines.forEach((l: string) => { txt(l, T.M, y); y += T.lh }); y += T.sectionGap

  // ════════════════ SECTION 2 ════════════════
  sectionHeader('2', 'Problem Statement')
  font(T.body, 'normal', T.mid)
  txt('The following pain points define the core opportunity this product addresses.', T.M, y); y += 8

  ;(blueprint.business_goals || []).slice(0, 4).forEach((g, i) => {
    const gl = doc.splitTextToSize(g, CW - 20)
    const gh = gl.length * T.lhSm + 8
    need(gh + 5)
    if (i % 2 === 0) fillRect(T.M, y - 1, CW, gh + 2, T.fillAlt)
    hr(y + gh + 1, 0.15, T.ruleFaint)
    font(T.small, 'bold', T.dark); txt(`P${String(i + 1).padStart(2, '0')}`, T.M + 3, y + 4)
    font(T.body, 'normal', T.mid)
    gl.forEach((l: string, li: number) => txt(l, T.M + 16, y + 4 + li * T.lhSm))
    y += gh + 5
  }); y += T.sectionGap

  // ════════════════ SECTION 3 ════════════════
  sectionHeader('3', 'Goals & Success Metrics')
  ;(blueprint.business_goals || []).forEach((g, i) => {
    const gl = doc.splitTextToSize(g, CW - 20)
    const gh = gl.length * T.lhSm + 8
    need(gh + 5)
    if (i % 2 === 0) fillRect(T.M, y - 1, CW, gh + 2, T.fillAlt)
    hr(y + gh + 1, 0.15, T.ruleFaint)
    font(T.small, 'bold', T.dark); txt(`G${String(i + 1).padStart(2, '0')}`, T.M + 3, y + 4)
    font(T.body, 'normal', T.mid)
    gl.forEach((l: string, li: number) => txt(l, T.M + 16, y + 4 + li * T.lhSm))
    y += gh + 5
  }); y += T.sectionGap

  // ════════════════ SECTION 4 — User Personas (CARDS) ════════════════
  sectionHeader('4', 'User Personas', true)
  ;(blueprint.users || []).forEach((u) => {
    const descLines = doc.splitTextToSize(u.description || '', CW - 16)
    const cardH = descLines.length * T.lhSm + 22
    need(cardH + T.cardGap)
    strokeRect(T.M, y, CW, cardH, T.rule, 0.3)
    fillRect(T.M, y, 3, cardH, T.black)
    font(T.h3, 'bold', T.black); txt(u.name || '', T.M + 8, y + 8)
    font(T.tiny, 'bold', T.light); txt((u.role || '').toUpperCase(), T.M + 8, y + 14)
    hr(y + 16, 0.2, T.ruleFaint)
    font(T.body, 'normal', T.mid)
    descLines.forEach((l: string, li: number) => txt(l, T.M + 8, y + 21 + li * T.lhSm))
    y += cardH + T.cardGap
  }); y += T.sectionGap

  // ════════════════ SECTION 5 — Functional Requirements (TABLE) ════════════════
  sectionHeader('5', 'Functional Requirements', true)
  const fc = { id: { x: T.M, w: 16 }, name: { x: T.M + 16, w: 38 }, desc: { x: T.M + 56, w: 86 }, pri: { x: T.M + 144, w: 18 }, svc: { x: T.M + 164, w: 26 } }

  const fRows = (blueprint.feature_breakdown || []).map(f => {
    const nameTrunc = truncate(f.feature || '', fc.name.w - 4)
    const descLines = doc.splitTextToSize(f.description || '', fc.desc.w - 4)
    const svcTrunc = truncate(f.service || '', fc.svc.w - 4)
    return { f, nameTrunc, descLines, svcTrunc, h: descLines.length * T.lhSm + 7 }
  })

  need(10)
  fillRect(T.M, y - 2, CW, 10, T.fillHead)
  font(T.tiny, 'bold', T.white)
  txt('ID', fc.id.x + 2, y + 4); txt('FEATURE', fc.name.x + 2, y + 4)
  txt('DESCRIPTION', fc.desc.x + 2, y + 4); txt('PRIORITY', fc.pri.x + 2, y + 4); txt('SERVICE', fc.svc.x + 2, y + 4)
  y += 10

  fRows.forEach((row, i) => {
    need(row.h + 4)
    if (i % 2 === 0) fillRect(T.M, y - 1, CW, row.h + 2, T.fillAlt)
    hr(y + row.h + 1, 0.15, T.ruleFaint)
    font(T.small, 'bold', T.dark); txt(`FR-${String(i + 1).padStart(3, '0')}`, fc.id.x + 2, y + 4)
    font(T.small, 'bold', T.dark); txt(row.nameTrunc, fc.name.x + 2, y + 4)
    font(T.small, 'normal', T.mid); row.descLines.forEach((l: string, li: number) => txt(l, fc.desc.x + 2, y + 4 + li * T.lhSm))
    font(T.tiny, 'bold', T.dark); txt(row.f.badge || '', fc.pri.x + 2, y + 4)
    font(T.tiny, 'normal', T.light); txt(row.svcTrunc, fc.svc.x + 2, y + 4)
    y += row.h + 4
  }); y += T.sectionGap

  // ════════════════ SECTION 6 — NFRs (TABLE) ════════════════
  sectionHeader('6', 'Non-Functional Requirements')
  const nfrs = [
    { id: 'NFR-001', cat: 'Performance', req: 'API response time <= 500ms at the 95th percentile under expected load.' },
    { id: 'NFR-002', cat: 'Scalability', req: 'Horizontal scaling to 10x baseline load without architectural changes.' },
    { id: 'NFR-003', cat: 'Security', req: 'TLS 1.3 in transit. AES-256 encryption at rest for sensitive data.' },
    { id: 'NFR-004', cat: 'Availability', req: '99.9% uptime SLA excluding scheduled maintenance windows.' },
    { id: 'NFR-005', cat: 'Maintainability', req: 'Test coverage > 80%. All public APIs documented via OpenAPI specification.' },
    { id: 'NFR-006', cat: 'Accessibility', req: 'All user-facing interfaces conform to WCAG 2.1 Level AA standards.' },
  ]
  need(10)
  fillRect(T.M, y - 2, CW, 10, T.fillHead)
  font(T.tiny, 'bold', T.white)
  txt('ID', T.M + 2, y + 4); txt('CATEGORY', T.M + 22, y + 4); txt('REQUIREMENT', T.M + 58, y + 4)
  y += 10
  nfrs.forEach((r, i) => {
    need(10)
    if (i % 2 === 0) fillRect(T.M, y - 1, CW, 10, T.fillAlt)
    hr(y + 9, 0.15, T.ruleFaint)
    font(T.small, 'bold', T.dark); txt(r.id, T.M + 2, y + 4)
    font(T.small, 'bold', T.dark); txt(r.cat, T.M + 22, y + 4)
    font(T.small, 'normal', T.mid); txt(r.req, T.M + 58, y + 4)
    y += 10
  }); y += T.sectionGap

  // ════════════════ SECTION 7 — System Architecture (CARDS, NEW PAGE) ════════════════
  sectionHeader('7', 'System Architecture', true)

  const archExpLines = doc.splitTextToSize(blueprint.system_explanation || '', CW).slice(0, 3)
  const archExpH = archExpLines.length * T.lh
  need(archExpH + 8)
  font(T.body, 'normal', T.mid)
  archExpLines.forEach((l: string) => { txt(l, T.M, y); y += T.lh }); y += 8

  ;(blueprint.services || []).forEach((svc) => {
    const descLines = doc.splitTextToSize(svc.description || '', CW - 16)
    const apis = svc.apis || []
    const apiRows = apis.map(a => {
      const pLines = doc.splitTextToSize(a.purpose || '', CW - 92)
      return { method: a.method || '', route: truncate(a.route || '', 50), pLines, h: Math.max(8, pLines.length * T.lhSm + 4) }
    })
    const apiTotalH = apiRows.reduce((sum, r) => sum + r.h, 0)
    const cardH = 14 + descLines.length * T.lhSm + 6 + (apis.length > 0 ? apiTotalH + 10 : 0) + 6
    need(cardH + T.cardGap)

    strokeRect(T.M, y, CW, cardH, '#bbbbbb', 0.3)
    fillRect(T.M, y, CW, 13, T.fillHead)
    font(T.h3, 'bold', T.white); txt(svc.name || '', T.M + 5, y + 9)
    font(T.tiny, 'bold', '#888888'); txt((svc.group || '').toUpperCase(), T.W - T.M - 4, y + 9, { align: 'right' } as any)
    y += 15

    font(T.body, 'normal', T.mid)
    descLines.forEach((l: string) => { txt(l, T.M + 5, y); y += T.lhSm }); y += 5

    if (apis.length > 0) {
      font(T.tiny, 'bold', T.light); txt('ENDPOINTS', T.M + 5, y); y += 4
      apiRows.forEach((a) => {
        fillRect(T.M + 5, y - 1, CW - 10, a.h + 1, '#f2f2f2', '#e0e0e0', 0.2)
        font(T.small, 'bold', T.black); txt(a.method, T.M + 9, y + 4)
        font(T.small, 'normal', T.dark); txt(a.route, T.M + 26, y + 4)
        font(T.small, 'normal', T.light)
        a.pLines.forEach((pl: string, pi: number) => txt(pl, T.M + 80, y + 4 + pi * T.lhSm))
        y += a.h + 1
      })
    }
    y += T.cardGap + 4
  }); y += T.sectionGap

  // ════════════════ SECTION 8 — Data Architecture (NEW PAGE) ════════════════
  sectionHeader('8', 'Data Architecture', true)

  const dataItems = [
    { l: 'Primary Database', v: blueprint.data_layer?.database },
    { l: 'Cache Layer', v: blueprint.data_layer?.cache },
    { l: 'File Storage', v: blueprint.data_layer?.storage },
  ].filter(d => d.v)

  if (dataItems.length > 0) {
    const dw = (CW - (dataItems.length - 1) * 5) / dataItems.length
    dataItems.forEach((d, i) => {
      const dx = T.M + i * (dw + 5)
      fillRect(dx, y, dw, 18, '#f5f5f5', '#cccccc', 0.3)
      font(14, 'bold', T.black); txt(d.v!, dx + dw / 2, y + 10, { align: 'center' } as any)
      font(T.tiny, 'normal', T.light); txt(d.l.toUpperCase(), dx + dw / 2, y + 16, { align: 'center' } as any)
    }); y += 24
  }

  const dlLines = doc.splitTextToSize(blueprint.data_layer?.description || '', CW)
  const dlH = dlLines.length * T.lh
  need(dlH + 4)
  font(T.body, 'normal', T.mid)
  dlLines.forEach((l: string) => { txt(l, T.M, y); y += T.lh }); y += 10

  font(T.h3, 'bold', T.black); txt('Domain Entities', T.M, y); y += 5
  hr(y, 0.4, T.black); y += 8

  ;(blueprint.domain_entities || []).forEach((e) => {
    const descLines = doc.splitTextToSize(e.description || '', CW - 16)
    const fields = e.fields || []
    const fieldRowCount = Math.ceil(fields.length / 5) || 1
    const cardH = 12 + descLines.length * T.lhSm + 6 + fieldRowCount * 7 + 6
    need(cardH + T.cardGap)

    strokeRect(T.M, y, CW, cardH, '#cccccc', 0.3)
    fillRect(T.M, y, CW, 11, '#eeeeee')
    hr(y + 11, 0.2, T.rule)
    font(T.h4, 'bold', T.black); txt(e.name || '', T.M + 5, y + 8)
    y += 13

    font(T.small, 'normal', T.mid)
    descLines.forEach((l: string) => { txt(l, T.M + 5, y); y += T.lhSm }); y += 4

    font(T.tiny, 'bold', T.light); txt('FIELDS:', T.M + 5, y); y += 4
    let fx = T.M + 5
    fields.forEach(field => {
      const fw = doc.getTextWidth(field) + 8
      if (fx + fw > T.W - T.M - 5) { fx = T.M + 5; y += 6.5 }
      fillRect(fx, y - 3, fw, 6, '#ebebeb', '#d0d0d0', 0.2, 1.5)
      font(T.tiny, 'normal', T.dark); txt(field, fx + 4, y + 1.5)
      fx += fw + 3
    }); y += 10
  }); y += T.sectionGap

  // ════════════════ SECTION 9 — Integrations (TABLE) ════════════════
  sectionHeader('9', 'External Integrations')
  const intRows = (blueprint.integrations || []).map(int => {
    const pLines = doc.splitTextToSize(int.purpose || '', CW - 70)
    return { int, pLines, h: Math.max(10, pLines.length * T.lhSm + 6) }
  })

  need(10)
  fillRect(T.M, y - 2, CW, 10, T.fillHead)
  font(T.tiny, 'bold', T.white)
  txt('INTEGRATION', T.M + 3, y + 4); txt('PURPOSE', T.M + 45, y + 4); txt('TYPE', T.M + 154, y + 4)
  y += 10

  intRows.forEach((row, i) => {
    need(row.h + 4)
    if (i % 2 === 0) fillRect(T.M, y - 1, CW, row.h + 2, T.fillAlt)
    hr(y + row.h + 1, 0.15, T.ruleFaint)
    font(T.small, 'bold', T.dark); txt(row.int.name || '', T.M + 3, y + 4)
    font(T.small, 'normal', T.mid); row.pLines.forEach((l: string, li: number) => txt(l, T.M + 45, y + 4 + li * T.lhSm))
    font(T.tiny, 'bold', T.dark); txt((row.int.type || '').toUpperCase(), T.M + 154, y + 4)
    y += row.h + 4
  }); y += T.sectionGap

  // ════════════════ SECTION 10 — Business Rules ════════════════
  sectionHeader('10', 'Business Rules & Constraints')
  ;(blueprint.business_rules || []).forEach((r, i) => {
    const rl = doc.splitTextToSize(r, CW - 24)
    const rh = rl.length * T.lhSm + 9
    need(rh + 6)
    if (i % 2 === 0) fillRect(T.M, y - 2, CW, rh + 2, T.fillAlt)
    hr(y + rh, 0.15, T.ruleFaint)
    font(T.small, 'bold', T.dark); txt(`BR-${String(i + 1).padStart(3, '0')}`, T.M + 3, y + 4)
    font(T.body, 'normal', T.mid); rl.forEach((l: string, li: number) => txt(l, T.M + 22, y + 4 + li * T.lhSm))
    y += rh + 6
  }); y += T.sectionGap

  // ════════════════ SECTION 11 — Out of Scope ════════════════
  sectionHeader('11', 'Out of Scope — Version 1.0')
  const oos = [
    'Native mobile applications (web-responsive design only)',
    'Third-party plugin or marketplace system',
    'Multi-language and internationalization (i18n) support',
    'Advanced AI or ML capabilities beyond core product scope',
    'Custom on-premise or self-hosted deployment options',
  ]
  oos.forEach((item, i) => {
    need(10)
    if (i % 2 === 0) fillRect(T.M, y - 1, CW, 9, T.fillAlt)
    hr(y + 8, 0.15, T.ruleFaint)
    font(T.small, 'normal', T.dark); txt('-', T.M + 4, y + 4); txt(item, T.M + 10, y + 4)
    y += 9
  }); y += T.sectionGap

  // ════════════════ SECTION 12 — Assumptions ════════════════
  need(50)
  sectionHeader('12', 'Assumptions & Dependencies')
  const assumptions = (blueprint.system_boundaries || []).length > 0
    ? blueprint.system_boundaries
    : [
        'Users access the product via a modern web browser.',
        'Third-party services maintain API backward compatibility during development.',
        'Infrastructure provisioned on a major cloud provider.',
        'Development team follows standard agile practices.',
        'Legal and compliance review completed before production launch.',
      ]

  need(10)
  fillRect(T.M, y - 2, CW, 10, T.fillHead)
  font(T.tiny, 'bold', T.white); txt('ID', T.M + 2, y + 4); txt('ASSUMPTION', T.M + 18, y + 4)
  y += 10

  assumptions.forEach((a, i) => {
    const al = doc.splitTextToSize(a, CW - 24)
    const ah = al.length * T.lhSm + 8
    need(ah + 6)
    if (i % 2 === 0) fillRect(T.M, y - 1, CW, ah + 2, T.fillAlt)
    hr(y + ah + 1, 0.15, T.ruleFaint)
    font(T.small, 'bold', T.dark); txt(`A${String(i + 1).padStart(2, '0')}`, T.M + 2, y + 4)
    font(T.body, 'normal', T.mid); al.forEach((l: string, li: number) => txt(l, T.M + 18, y + 4 + li * T.lhSm))
    y += ah + 6
  })

  // ── Footers ──
  const total = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    hr(284, 0.4, T.black)
    font(T.tiny, 'normal', T.faint)
    txt('cornea.ai', T.M, 289)
    txt('CONFIDENTIAL  |  Version 1.0', T.W / 2, 289, { align: 'center' } as any)
    txt(`Page ${p} of ${total}`, T.W - T.M, 289, { align: 'right' } as any)
  }

  doc.save(`prd-${idea.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
}