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

export async function generateResumePdfBlob(element) {
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
  return pdf.output('blob');
}

export async function openResumePdfInNewTab(element, title = 'Candidate Resume') {
  // Pre-open new tab synchronously on click to prevent browser popup blockers
  const newTab = window.open('about:blank', '_blank');
  if (newTab) {
    try {
      newTab.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - AlignGrade</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
              .spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h3 style="margin: 0 0 6px 0; font-weight: 600;">Generating Resume PDF...</h3>
            <p style="margin: 0; color: #94a3b8; font-size: 13px;">Please wait while AlignGrade prepares the document.</p>
          </body>
        </html>
      `);
      newTab.document.close();
    } catch (_) {}
  }

  try {
    const blob = await generateResumePdfBlob(element);
    const blobUrl = URL.createObjectURL(blob);
    if (newTab && !newTab.closed) {
      newTab.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank');
    }
    return blobUrl;
  } catch (err) {
    if (newTab && !newTab.closed) {
      newTab.close();
    }
    throw err;
  }
}
