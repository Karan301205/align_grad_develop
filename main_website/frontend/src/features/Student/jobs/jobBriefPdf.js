// "Download" on a job: a one-page PDF brief built in the browser (shared by the
// Jobs page and the public job brief).
import { jsPDF } from 'jspdf';
import { companyOf, payText, placeText } from '../home/homeData';

export function downloadJobBrief(job) {
  const doc = new jsPDF();
  const company = companyOf(job);
  let y = 25;

  const heading = (text) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(text, 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
  };
  const paragraph = (text) => {
    const wrapped = doc.splitTextToSize(text, 170);
    doc.text(wrapped, 20, y);
    y += wrapped.length * 5 + 10;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(job.title || job.designation || 'Job brief', 20, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  [
    ['Company', company],
    ['Place', placeText(job)],
    ['Pay', payText(job)],
    ['Experience', job.desiredExperience]
  ]
    .filter(([, value]) => value)
    .forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, y);
      y += 7;
    });

  doc.setDrawColor(203, 213, 225);
  doc.line(20, y, 190, y);
  y += 10;

  if (job.description) {
    heading('About the job');
    paragraph(job.description);
  }
  if (job.roleResponsibilities) {
    heading('What you’ll do');
    paragraph(job.roleResponsibilities);
  }
  if (job.requirements?.length) {
    heading('Skill bars');
    job.requirements.forEach((req) => {
      doc.text(`• ${req.skillName}: score ${req.minRating}/10 or more`, 20, y);
      y += 6;
    });
    y += 4;
  }
  if (job.selectionProcess?.length) {
    heading('How they hire');
    job.selectionProcess.forEach((round, index) => {
      const wrapped = doc.splitTextToSize(`Round ${round.roundNumber || index + 1}: ${round.name}${round.description ? ` – ${round.description}` : ''}`, 170);
      doc.text(wrapped, 20, y);
      y += wrapped.length * 5 + 1;
    });
  }

  const safe = (text) => String(text || 'Job').replace(/[^\w-]+/g, '_').slice(0, 40);
  doc.save(`${company ? `${safe(company)}_` : ''}${safe(job.title)}_brief.pdf`);
}
