import jsPDF from 'jspdf'
import { Blueprint } from '../types'

const T = {
  body: 10.5, small: 9.5, h1: 17, h2: 12, h3: 10.5,
  lh: 5.3, lhTight: 4.8,
  W: 210, M: 22,
  black: '#000000', dark: '#1a1a1a', mid: '#333333', light: '#666666',
  rule: '#999999', ruleFaint: '#dddddd', fillAlt: '#f6f6f6', fillHead: '#e8e8e8',
  PAGE_BOTTOM: 278,
}
const CW = T.W - T.M * 2

export async function generatePRDPdf(blueprint: Blueprint, idea: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = T.M

  const addPage = () => { doc.addPage(); y = T.M }
  const ensureSpace = (h: number) => { if (y + h > T.PAGE_BOTTOM) addPage() }

  const font = (size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color = T.dark) => {
    doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(color)
  }
  const txt = (str: string, x: number, ty: number, opts?: any) => doc.text(String(str || ''), x, ty, opts)
  const hr = (hy: number, thickness = 0.2, color = T.ruleFaint) => {
    doc.setDrawColor(color); doc.setLineWidth(thickness); doc.line(T.M, hy, T.W - T.M, hy)
  }

  // Draws a paragraph line-by-line, checking space before each line individually
  const drawParagraph = (
    text: string, x: number, maxW: number,
    opts: { size?: number; style?: 'normal' | 'bold' | 'italic'; color?: string; lh?: number } = {}
  ): void => {
    const size = opts.size ?? T.body
    const style = opts.style ?? 'normal'
    const color = opts.color ?? T.mid
    const lh = opts.lh ?? T.lh
    font(size, style, color)
    const lines = doc.splitTextToSize(text || '', maxW)
    lines.forEach((line: string) => {
      ensureSpace(lh)
      txt(line, x, y)
      y += lh
    })
  }

  // Numbered section heading, e.g. "1. Executive Summary"
  const sectionHeading = (num: string, title: string) => {
    ensureSpace(14)
    y += 3
    font(T.h1, 'bold', T.black)
    txt(`${num}. ${title}`, T.M, y)
    y += 7
  }

  // Bullet list item with a bold lead-in label, e.g. "• Role Name: description text"
  const bulletItem = (label: string, description: string) => {
    ensureSpace(T.lh)
    const bulletX = T.M
    const textX = T.M + 5
    font(T.body, 'normal', T.dark)
    txt('•', bulletX, y)

    // Render "Label: " in bold, then description in normal weight, wrapping together
    const labelText = `${label}: `
    font(T.body, 'bold', T.dark)
    const labelWidth = doc.getTextWidth(labelText)

    font(T.body, 'normal', T.mid)
    const fullLines = doc.splitTextToSize(`${labelText}${description}`, CW - 5)

    fullLines.forEach((line: string, idx: number) => {
      ensureSpace(T.lh)
      if (idx === 0) {
        font(T.body, 'bold', T.dark)
        txt(labelText, textX, y)
        font(T.body, 'normal', T.mid)
        txt(line.slice(labelText.length), textX + labelWidth, y)
      } else {
        font(T.body, 'normal', T.mid)
        txt(line, textX, y)
      }
      y += T.lh
    })
  }

  // Simple two-column table row: left column bold/fixed width, right column wraps
  const tableRow = (
    col1: string, col2Lines: { text: string; bold?: boolean }[],
    col1Width: number, isHeader = false
  ) => {
    const col2X = T.M + col1Width + 4

    if (isHeader) {
      ensureSpace(9)
      doc.setFillColor(T.fillHead)
      doc.rect(T.M, y - 1, CW, 7.5, 'F')
      font(T.small, 'bold', T.black)
      txt(col1, T.M + 2, y + 4)
      txt(col2Lines[0].text, col2X, y + 4)
      y += 9
      return
    }

    ensureSpace(T.lhTight + 2)
    const startY = y
    font(T.small, 'bold', T.dark)
    txt(col1, T.M + 2, y + 3.5)

    let lineY = y
    col2Lines.forEach((segment, i) => {
      const lines = doc.splitTextToSize(segment.text, CW - col1Width - 8)
      lines.forEach((l: string) => {
        ensureSpace(T.lhTight + 1)
        font(T.small, segment.bold ? 'bold' : 'normal', T.mid)
        txt(l, col2X, lineY + 3.5)
        lineY += T.lhTight
      })
    })
    y = Math.max(lineY, startY + T.lhTight + 2)
    hr(y - 1, 0.15, T.ruleFaint)
    y += 3
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // ════════════════ TITLE BLOCK ════════════════
  font(T.h1 + 4, 'bold', T.black)
  const titleLines = doc.splitTextToSize(idea, CW)
  titleLines.forEach((l: string) => { txt(l, T.M, y); y += 8 })
  font(T.small, 'normal', T.light)
  txt('Product Requirements Document', T.M, y); y += 5
  txt(`Version 1.0  ·  ${dateStr}  ·  Prepared by cornea.ai`, T.M, y); y += 8
  hr(y, 0.4, T.black); y += 10

  // ════════════════ 1. Product Overview ════════════════
  sectionHeading('1', 'Product Overview')
  drawParagraph(blueprint.prd_summary || '', T.M, CW)
  y += 2
  drawParagraph(blueprint.system_explanation || '', T.M, CW)
  y += 6

  // ════════════════ 2. User Roles ════════════════
  sectionHeading('2', 'User Roles')
  ;(blueprint.users || []).forEach(u => {
    bulletItem(`${u.name} (${u.role})`, u.description || '')
    y += 1.5
  })
  y += 6

  // ════════════════ 3. Business Goals ════════════════
  sectionHeading('3', 'Business Goals')
  ;(blueprint.business_goals || []).forEach(g => {
    ensureSpace(T.lh)
    font(T.body, 'normal', T.dark); txt('•', T.M, y)
    drawParagraph(g, T.M + 5, CW - 5)
    y += 1
  })
  y += 6

  // ════════════════ 4. Jobs To Be Done ════════════════
  sectionHeading('4', 'Jobs To Be Done')
  drawParagraph('The following describe why users would adopt this product — the specific outcomes they are hiring it to deliver.', T.M, CW, { style: 'italic', color: T.light })
  y += 3
  ;(blueprint.jobs_to_be_done || []).forEach((j, i) => {
    ensureSpace(T.lh)
    font(T.body, 'normal', T.dark); txt(`${i + 1}.`, T.M, y)
    drawParagraph(j, T.M + 7, CW - 7)
    y += 1
  })
  y += 6

  // ════════════════ 5. Functional Requirements ════════════════
  sectionHeading('5', 'Functional Requirements')
  tableRow('Req ID', [{ text: 'Feature / Description', bold: true }], 22, true)

  ;(blueprint.feature_breakdown || []).forEach((f, i) => {
    const reqId = `F-${String(i + 1).padStart(2, '0')}`
    const combined = `${f.feature}. ${f.description}${f.service ? ` (Service: ${f.service})` : ''}`
    tableRow(reqId, [{ text: combined }], 22)
  })
  y += 8

  // ════════════════ 6. Non-Functional Requirements ════════════════
  sectionHeading('6', 'Non-Functional Requirements')
  const nfrs = [
    { label: 'Performance', text: 'API response time should not exceed 500ms at the 95th percentile under expected load.' },
    { label: 'Scalability', text: 'The system must support horizontal scaling to 10x baseline load without architectural changes.' },
    { label: 'Security', text: 'All data in transit must be encrypted via TLS 1.3. Sensitive data at rest must be encrypted using AES-256.' },
    { label: 'Availability', text: 'The system must maintain a 99.9% uptime SLA, excluding scheduled maintenance windows.' },
    { label: 'Maintainability', text: 'Test coverage must exceed 80%, and all public APIs must be documented via an OpenAPI specification.' },
    { label: 'Accessibility', text: 'All user-facing interfaces must conform to WCAG 2.1 Level AA standards.' },
  ]
  nfrs.forEach(n => { bulletItem(n.label, n.text); y += 1.5 })
  y += 6

  // ════════════════ 7. System Architecture ════════════════
  sectionHeading('7', 'System Architecture')
  drawParagraph(blueprint.system_explanation || '', T.M, CW)
  y += 4

  ;(blueprint.services || []).forEach(svc => {
    ensureSpace(10)
    font(T.h2, 'bold', T.black)
    txt(svc.name || '', T.M, y)
    font(T.small, 'italic', T.light)
    txt(`  (${svc.group})`, T.M + doc.getTextWidth(svc.name || ''), y)
    y += 5.5

    drawParagraph(svc.description || '', T.M, CW, { size: T.small, lh: T.lhTight })
    y += 2

    ;(svc.apis || []).forEach(a => {
      ensureSpace(T.lhTight)
      font(T.small, 'bold', T.dark)
      txt(a.method || '', T.M + 4, y)
      const methodW = doc.getTextWidth(a.method || '') + 2
      font(T.small, 'normal', T.dark)
      txt(a.route || '', T.M + 4 + methodW, y)
      const routeW = doc.getTextWidth(a.route || '')
      font(T.small, 'normal', T.light)
      const purposeX = T.M + 4 + methodW + routeW + 4
      const purposeLines = doc.splitTextToSize(`— ${a.purpose || ''}`, T.W - T.M - purposeX)
      purposeLines.forEach((pl: string, pi: number) => {
        ensureSpace(T.lhTight)
        txt(pl, purposeX, y)
        y += T.lhTight
      })
    })
    y += 5
  })
  y += 4

  // ════════════════ 8. Data Architecture ════════════════
  sectionHeading('8', 'Data Architecture')
  const dataLine: string[] = []
  if (blueprint.data_layer?.database) dataLine.push(`Database: ${blueprint.data_layer.database}`)
  if (blueprint.data_layer?.cache) dataLine.push(`Cache: ${blueprint.data_layer.cache}`)
  if (blueprint.data_layer?.storage) dataLine.push(`Storage: ${blueprint.data_layer.storage}`)
  if (dataLine.length) {
    drawParagraph(dataLine.join('   ·   '), T.M, CW, { style: 'bold', color: T.dark })
    y += 2
  }
  drawParagraph(blueprint.data_layer?.description || '', T.M, CW)
  y += 5

  ;(blueprint.domain_entities || []).forEach(e => {
    ensureSpace(8)
    font(T.h3, 'bold', T.black); txt(e.name || '', T.M, y); y += 5
    drawParagraph(e.description || '', T.M, CW, { size: T.small, lh: T.lhTight })
    if ((e.fields || []).length > 0) {
      drawParagraph(`Fields: ${(e.fields || []).join(', ')}`, T.M, CW, { size: T.small, style: 'italic', color: T.light, lh: T.lhTight })
    }
    y += 4
  })
  y += 4

  // ════════════════ 9. External Integrations ════════════════
  sectionHeading('9', 'External Integrations')
  ;(blueprint.integrations || []).forEach(int => {
    bulletItem(`${int.name} (${int.type})`, int.purpose || '')
    y += 1.5
  })
  y += 6

  // ════════════════ 10. Business Rules & Constraints ════════════════
  sectionHeading('10', 'Business Rules & Constraints')
  ;(blueprint.business_rules || []).forEach((r, i) => {
    ensureSpace(T.lh)
    font(T.body, 'normal', T.dark); txt(`${i + 1}.`, T.M, y)
    drawParagraph(r, T.M + 7, CW - 7)
    y += 1
  })
  y += 6

  // ════════════════ 11. Out of Scope (Version 1.0) ════════════════
  sectionHeading('11', 'Out of Scope (Version 1.0)')
  const oos = [
    'Native mobile applications (web-responsive design only)',
    'Third-party plugin or marketplace system',
    'Multi-language and internationalization (i18n) support',
    'Advanced AI or ML capabilities beyond core product scope',
    'Custom on-premise or self-hosted deployment options',
  ]
  oos.forEach(item => {
    ensureSpace(T.lh)
    font(T.body, 'normal', T.dark); txt('•', T.M, y)
    drawParagraph(item, T.M + 5, CW - 5)
    y += 1
  })
  y += 6

  // ════════════════ 12. Assumptions & Dependencies ════════════════
  sectionHeading('12', 'Assumptions & Dependencies')
  const assumptions = (blueprint.system_boundaries || []).length > 0
    ? blueprint.system_boundaries
    : [
        'Users access the product via a modern web browser.',
        'Third-party services maintain API backward compatibility during development.',
        'Infrastructure is provisioned on a major cloud provider.',
        'The development team follows standard agile practices.',
        'Legal and compliance review is completed before production launch.',
      ]
  assumptions.forEach((a, i) => {
    ensureSpace(T.lh)
    font(T.body, 'normal', T.dark); txt(`${i + 1}.`, T.M, y)
    drawParagraph(a, T.M + 7, CW - 7)
    y += 1
  })

  // ── Footer on every page ──────────────────────────────────────────
  const total = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    hr(289, 0.2, T.ruleFaint)
    font(8, 'normal', T.light)
    txt('cornea.ai', T.M, 293)
    txt(`Page ${p} of ${total}`, T.W - T.M, 293, { align: 'right' } as any)
  }

  doc.save(`prd-${idea.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
}