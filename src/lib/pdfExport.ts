import jsPDF from 'jspdf';

interface Jar {
  id: number;
  name: string;
  target: number;
  saved: number;
  streak: number;
  withdrawn: number;
  notes?: JarNote[];
  records?: TransactionRecord[];
  currency?: string;
}

interface JarNote {
  id: number;
  text: string;
  color: string;
}

interface TransactionRecord {
  id: number;
  type: 'saved' | 'withdrawn';
  amount: number;
  date: Date;
}

export const exportFullReport = (jars: Jar[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Freedom Lab - Full Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Summary Section
  const totalSaved = jars.reduce((sum, jar) => sum + jar.saved, 0);
  const totalTarget = jars.reduce((sum, jar) => sum + jar.target, 0);
  const progress = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : '0';

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 15, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Jars: ${jars.length}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Saved: $${totalSaved.toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Target: $${totalTarget.toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Overall Progress: ${progress}%`, 20, yPosition);
  yPosition += 12;

  // Jars Section
  jars.forEach((jar, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${jar.name}`, 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const jarProgress = ((jar.saved / jar.target) * 100).toFixed(1);
    doc.text(`Progress: ${jarProgress}%`, 20, yPosition);
    yPosition += 6;
    doc.text(`Saved: ${jar.currency || '$'}${jar.saved.toLocaleString()}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Target: ${jar.currency || '$'}${jar.target.toLocaleString()}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Withdrawn: ${jar.currency || '$'}${jar.withdrawn.toLocaleString()}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Streak: ${jar.streak}`, 20, yPosition);
    yPosition += 8;

    // Notes
    if (jar.notes && jar.notes.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      jar.notes.forEach(note => {
        const lines = doc.splitTextToSize(note.text, pageWidth - 35);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${line}`, 25, yPosition);
          yPosition += 5;
        });
      });
      yPosition += 3;
    }

    yPosition += 5;
  });

  // Save the PDF
  doc.save(`Savings_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportJarReport = (jar: Jar) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(jar.name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Jar Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Jar Details', 15, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const jarProgress = ((jar.saved / jar.target) * 100).toFixed(1);
  doc.text(`Progress: ${jarProgress}%`, 20, yPosition);
  yPosition += 6;
  doc.text(`Saved: ${jar.currency || '$'}${jar.saved.toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Target: ${jar.currency || '$'}${jar.target.toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Withdrawn: ${jar.currency || '$'}${jar.withdrawn.toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Streak: ${jar.streak}`, 20, yPosition);
  yPosition += 12;

  // Investment Plan
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Investment Plan', 15, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const remaining = jar.target - jar.saved;
  doc.text(`Daily: ${jar.currency || '$'}${(remaining / 30).toFixed(2)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Weekly: ${jar.currency || '$'}${(remaining / 4).toFixed(2)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Monthly: ${jar.currency || '$'}${remaining.toFixed(2)}`, 20, yPosition);
  yPosition += 12;

  // Notes Section
  if (jar.notes && jar.notes.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', 15, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    jar.notes.forEach((note, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${index + 1}. ${note.text}`, 20, yPosition);
      yPosition += 6;
    });
    yPosition += 6;
  }

  // Transaction Records
  if (jar.records && jar.records.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Records', 15, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    jar.records.forEach((record, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      const recordDate = new Date(record.date);
      const dateStr = recordDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const sign = record.type === 'saved' ? '+' : '-';
      const typeLabel = record.type === 'saved' ? 'Saved' : 'Withdrawn';

      doc.text(
        `${index + 1}. ${dateStr} - ${typeLabel}: ${sign}${jar.currency || '$'}${record.amount.toLocaleString()}`,
        20,
        yPosition
      );
      yPosition += 6;
    });
  }

  // Save the PDF
  doc.save(`${jar.name}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
