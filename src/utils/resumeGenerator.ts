// src/utils/resumeGenerator.ts
// Phase 3 — Resume / Achievement PDF generation using pdfkit


import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { formatDate } from './dateUtils';

export interface ResumeClub {
  name: string;
  category: string;
  role: string;
  joinedAt: Date;
}

export interface ResumeEvent {
  title: string;
  clubName: string;
  date: Date;
  pointsAwarded: number;
  hoursAwarded: number;
  status: string;
}

export interface ResumeBadge {
  badgeType: string;
  awardedAt: Date;
}

export interface ResumeCertificate {
  eventTitle: string;
  clubName: string;
  eventDate: Date;
  pointsAwarded: number;
}

export interface ResumeData {
  name: string;
  email: string;
  department: string | null;
  enrollmentYear: number | null;
  degreeType: string | null;
  totalPoints: number;
  totalVolunteerHours: number;
  clubs: ResumeClub[];
  events: ResumeEvent[];
  badges: ResumeBadge[];
  certificates: ResumeCertificate[];
}

export async function generateResumePDF(data: ResumeData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    doc.pipe(stream);

    let y = 50;

    // ── Header ────────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill('#0f172a');

    doc
      .fillColor('#ffffff')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(data.name, 50, y, { width: 350 });

    y += 32;
    doc
      .fillColor('#94a3b8')
      .fontSize(11)
      .font('Helvetica')
      .text(
        [
          data.email,
          data.department,
          data.degreeType ? `${data.degreeType} (${data.enrollmentYear ?? ''})` : null,
        ]
          .filter(Boolean)
          .join('  ·  '),
        50,
        y
      );

    // Stats on right side of header
    doc
      .fillColor('#6366f1')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`${data.totalPoints.toFixed(1)} pts`, 450, 55, { align: 'right', width: 90 })
      .text(`${data.totalVolunteerHours.toFixed(1)} hrs`, 450, 72, { align: 'right', width: 90 });

    doc
      .fillColor('#64748b')
      .fontSize(9)
      .font('Helvetica')
      .text('AICTE Points', 450, 68, { align: 'right', width: 90 })
      .text('Volunteer Hours', 450, 85, { align: 'right', width: 90 });

    y = 130;

    // ── Club Memberships ──────────────────────────────────────────────────────
    y = _section(doc, 'CLUB MEMBERSHIPS', y);

    if (data.clubs.length === 0) {
      y = _noData(doc, y);
    } else {
      for (const club of data.clubs) {
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(club.name, 50, y);
        doc
          .fillColor('#64748b')
          .fontSize(10)
          .font('Helvetica')
          .text(
            `${_capitalize(club.role)}  ·  ${_capitalize(club.category)}  ·  Joined ${formatDate(club.joinedAt)}`,
            50,
            y + 14,
            { width: 480 }
          );
        y += 38;
        _checkPage(doc, y, () => { y = 50; });
      }
    }

    // ── Events Attended ───────────────────────────────────────────────────────
    y = _section(doc, 'EVENTS ATTENDED', y + 8);

    const attended = data.events.filter(e => e.status === 'present' || e.status === 'late');
    if (attended.length === 0) {
      y = _noData(doc, y);
    } else {
      for (const ev of attended) {
        doc
          .fillColor('#1e293b')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(ev.title, 50, y, { width: 350 });
        doc
          .fillColor('#64748b')
          .fontSize(10)
          .font('Helvetica')
          .text(`${ev.clubName}  ·  ${formatDate(ev.date)}`, 50, y + 14);
        doc
          .fillColor('#6366f1')
          .fontSize(10)
          .text(
            `${ev.pointsAwarded.toFixed(1)} pts  ·  ${ev.hoursAwarded.toFixed(1)} hrs`,
            400,
            y,
            { align: 'right', width: 140 }
          );
        y += 36;
        _checkPage(doc, y, () => { y = 50; });
      }
    }

    // ── Badges ────────────────────────────────────────────────────────────────
    y = _section(doc, 'BADGES & ACHIEVEMENTS', y + 8);

    if (data.badges.length === 0) {
      y = _noData(doc, y);
    } else {
      const cols = 3;
      let col = 0;
      const startX = 50;
      const colWidth = 160;

      for (const badge of data.badges) {
        const bx = startX + col * colWidth;
        doc
          .roundedRect(bx, y, colWidth - 10, 44, 6)
          .fillAndStroke('#f8fafc', '#e2e8f0');
        doc
          .fillColor('#6366f1')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(_badgeLabel(badge.badgeType), bx + 8, y + 6, { width: colWidth - 20 });
        doc
          .fillColor('#94a3b8')
          .fontSize(8)
          .font('Helvetica')
          .text(formatDate(badge.awardedAt), bx + 8, y + 22, { width: colWidth - 20 });

        col++;
        if (col >= cols) {
          col = 0;
          y += 52;
          _checkPage(doc, y, () => { y = 50; });
        }
      }
      if (col > 0) y += 52;
    }

    // ── Certificates ──────────────────────────────────────────────────────────
    y = _section(doc, 'CERTIFICATES', y + 8);

    if (data.certificates.length === 0) {
      y = _noData(doc, y);
    } else {
      for (const cert of data.certificates) {
        doc
          .fillColor('#1e293b')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(cert.eventTitle, 50, y, { width: 380 });
        doc
          .fillColor('#64748b')
          .fontSize(10)
          .font('Helvetica')
          .text(`${cert.clubName}  ·  ${formatDate(cert.eventDate)}`, 50, y + 14);
        doc
          .fillColor('#6366f1')
          .fontSize(10)
          .text(`${cert.pointsAwarded.toFixed(1)} AICTE pts`, 430, y, { align: 'right', width: 110 });
        y += 36;
        _checkPage(doc, y, () => { y = 50; });
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc
      .fillColor('#cbd5e1')
      .fontSize(9)
      .font('Helvetica')
      .text(
        `Generated via ClubHub  ·  ${formatDate(new Date())}`,
        50,
        doc.page.height - 40,
        { align: 'center', width: doc.page.width - 100 }
      );

    doc.end();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _section(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .lineWidth(0.5)
    .strokeColor('#e2e8f0')
    .stroke();

  doc
    .fillColor('#6366f1')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(title, 50, y + 6, { characterSpacing: 1.5 });

  return y + 26;
}

function _noData(doc: PDFKit.PDFDocument, y: number): number {
  doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('—  No records yet', 50, y);
  return y + 22;
}

// Simple page overflow guard
function _checkPage(doc: PDFKit.PDFDocument, y: number, reset: () => void) {
  if (y > doc.page.height - 80) {
    doc.addPage();
    reset();
  }
}

function _capitalize(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function _badgeLabel(badgeType: string): string {
  const map: Record<string, string> = {
    first_event: '🏅 First Event',
    ten_events: '🌟 10 Events',
    twenty_five_events: '🔥 25 Events',
    core_member: '👑 Core Member',
    volunteer_star: '💚 Volunteer Star',
    event_organiser: '🎯 Event Organiser',
    streak_3: '⚡ 3-Event Streak',
  };
  return map[badgeType] ?? badgeType;
}
