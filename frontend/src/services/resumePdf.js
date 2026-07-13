import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

// Renders a DOM element to an A4 PDF and triggers a download. Extracted from
// StudentLayout so the heavy html2canvas/jsPDF concern is isolated from the
// layout component. Behavior (scale, quality, sizing, filename) is unchanged.
export async function generateResumePdf(element, fileName) {
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  pdf.save(fileName);
}
