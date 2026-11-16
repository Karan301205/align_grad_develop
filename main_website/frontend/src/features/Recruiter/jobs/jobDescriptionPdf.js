import { jsPDF } from 'jspdf';
import { ALL_SKILLS } from '../../../constants';
import { safeFileName } from './jobsData';

const isTechnical = (skillName) => {
  const skill = ALL_SKILLS.find((s) => s.skill.toLowerCase() === String(skillName).toLowerCase());
  return skill ? skill.type === 'technical' : true;
};

/** Saves the job description as a PDF: summary, responsibilities, skill bars and selection rounds. */
export default function downloadJobDescriptionPdf(job) {
  const doc = new jsPDF();
  const title = job.title || job.designation || 'Job';
  let y = 70;

  const heading = (text) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text(text, 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
  };
  // Starts a new page when fewer than `room` mm are left.
  const ensureRoom = (room) => {
    if (y > room) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(2, 56, 54);
  doc.text(title, 20, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Company: ${job.companyName || job.company?.name || 'Not given'}`, 20, 35);
  doc.text(`Location: ${job.location || 'Not specified'}`, 20, 42);
  doc.text(`Desired Experience: ${job.desiredExperience || 'Not specified'}`, 20, 49);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 62, 190, 62);

  heading('Opportunity Summary');
  const summary = doc.splitTextToSize(job.description || '', 170);
  doc.text(summary, 20, y);
  y += summary.length * 5 + 8;

  if (job.roleResponsibilities) {
    ensureRoom(250);
    heading('Role & Responsibilities');
    const lines = doc.splitTextToSize(job.roleResponsibilities, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 8;
  }

  if (job.requirements?.length > 0) {
    ensureRoom(250);
    heading('Required Rating Thresholds');
    job.requirements.forEach((req) => {
      doc.text(isTechnical(req.skillName) ? `- ${req.skillName}: Lvl ${req.minRating}/10` : `- ${req.skillName} (Non-Technical)`, 20, y);
      y += 6;
    });
    y += 4;
  }

  if (job.selectionProcess?.length > 0) {
    ensureRoom(230);
    heading('Selection Process Rounds');
    job.selectionProcess.forEach((round) => {
      ensureRoom(260);
      doc.setFont('helvetica', 'bold');
      doc.text(`Round #${round.roundNumber}: ${round.name}`, 20, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(round.description || '', 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 4;
    });
  }

  doc.save(`${safeFileName(title)}_Job_Description.pdf`);
}
