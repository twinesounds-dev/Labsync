import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, TestResult, Facility } from '@/types';
import { format } from 'date-fns';

export function generateLabReport(
  patient: Patient,
  results: TestResult[],
  facility: Facility
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(facility.name.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(facility.address, pageWidth / 2, 27, { align: 'center' });
  doc.text(
    `Phone: ${facility.phone} | Email: ${facility.email}`,
    pageWidth / 2,
    32,
    { align: 'center' }
  );
  doc.text(
    `Laboratory License: ${facility.licenseNumber}`,
    pageWidth / 2,
    37,
    { align: 'center' }
  );

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LABORATORY REPORT', pageWidth / 2, 47, { align: 'center' });

  // Line
  doc.setLineWidth(0.5);
  doc.line(15, 50, pageWidth - 15, 50);

  // Patient Information
  let yPos = 58;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const leftColumn = 15;
  const rightColumn = pageWidth / 2 + 5;

  doc.text(`Patient ID: ${patient.patientId}`, leftColumn, yPos);
  doc.text(
    `Date Collected: ${format(patient.registrationDate, 'dd/MM/yyyy')}`,
    rightColumn,
    yPos
  );

  yPos += 6;
  doc.text(
    `Name: ${patient.givenName} ${patient.surname}`,
    leftColumn,
    yPos
  );
  doc.text(
    `Date Reported: ${format(new Date(), 'dd/MM/yyyy')}`,
    rightColumn,
    yPos
  );

  yPos += 6;
  const age = Math.floor(
    (new Date().getTime() - patient.dateOfBirth.getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );
  doc.text(
    `Age: ${age} years / DOB: ${format(patient.dateOfBirth, 'dd/MM/yyyy')}`,
    leftColumn,
    yPos
  );
  if (patient.referringDoctor) {
    doc.text(
      `Referring Doctor: ${patient.referringDoctor}`,
      rightColumn,
      yPos
    );
  }

  yPos += 6;
  doc.text(`Gender: ${patient.gender}`, leftColumn, yPos);
  if (patient.hospitalClinic) {
    doc.text(`Hospital/Clinic: ${patient.hospitalClinic}`, rightColumn, yPos);
  }

  yPos += 10;

  // Results Table
  for (const result of results) {
    if (!result.test || !result.resultValues) continue;

    // Test Name
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(0, 102, 204);
    doc.rect(leftColumn, yPos - 4, pageWidth - 30, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(result.test.name, leftColumn + 2, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // Table Headers and Data
    const tableData = result.resultValues.map((rv) => [
      rv.parameter,
      rv.value.toString(),
      rv.unit,
      rv.normalRange,
      rv.flag,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Test Name', 'Result', 'Units', 'Normal Range', 'Flag']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        4: {
          cellPadding: 3,
          fontStyle: 'bold',
        },
      },
      margin: { left: leftColumn, right: leftColumn },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Remarks
    if (result.remarks) {
      doc.setFont('helvetica', 'italic');
      doc.text(`Comments: ${result.remarks}`, leftColumn, yPos);
      yPos += 7;
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setLineWidth(0.3);
  doc.line(15, footerY, pageWidth - 15, footerY);

  yPos = footerY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (results[0]?.performedByUser) {
    doc.text(
      `Technician: ${results[0].performedByUser.firstName} ${results[0].performedByUser.lastName}`,
      leftColumn,
      yPos
    );
  }

  if (results[0]?.approvedByUser) {
    doc.text(
      `Approved By: ${results[0].approvedByUser.firstName} ${results[0].approvedByUser.lastName}`,
      rightColumn,
      yPos
    );
  }

  yPos += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text(
    'This is a computer generated report. No signature required.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  return doc;
}

export function generateReceipt(
  patient: Patient,
  payment: {
    invoiceNumber: string;
    paymentDate: Date;
    testRequest?: { tests: Array<{ price: number }> };
    subtotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    balance: number;
    paymentMethod: string;
    transactionId?: string;
  },
  facility: Facility
) {
  const doc = new jsPDF({
    format: [80, 200], // Receipt size in mm
    unit: 'mm',
  });

  const pageWidth = 80;
  let yPos = 10;

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(facility.name, pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(facility.address, pageWidth / 2, yPos, { align: 'center' });

  yPos += 4;
  doc.text(facility.phone, pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' });

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice: ${payment.invoiceNumber}`, 5, yPos);

  yPos += 4;
  doc.text(`Date: ${format(payment.paymentDate, 'dd/MM/yyyy HH:mm')}`, 5, yPos);

  yPos += 8;
  doc.text(
    `Patient: ${patient.givenName} ${patient.surname}`,
    5,
    yPos
  );

  yPos += 4;
  doc.text(`ID: ${patient.patientId}`, 5, yPos);

  yPos += 8;
  doc.setLineWidth(0.3);
  doc.line(5, yPos, pageWidth - 5, yPos);
  yPos += 5;

  doc.text('Item', 5, yPos);
  doc.text('Amount', pageWidth - 5, yPos, { align: 'right' });

  yPos += 5;
  doc.line(5, yPos, pageWidth - 5, yPos);
  yPos += 5;

  // Test items
  if (payment.testRequest?.tests) {
    for (let i = 0; i < payment.testRequest.tests.length; i++) {
      const test = payment.testRequest.tests[i];
      doc.text(`Test ${i + 1}`, 5, yPos);
      doc.text(`${test.price.toLocaleString()}`, pageWidth - 5, yPos, {
        align: 'right',
      });
      yPos += 4;
    }
  }

  yPos += 3;
  doc.line(5, yPos, pageWidth - 5, yPos);
  yPos += 5;

  doc.text('Subtotal:', 5, yPos);
  doc.text(`${payment.subtotal.toLocaleString()}`, pageWidth - 5, yPos, {
    align: 'right',
  });

  if (payment.discount > 0) {
    yPos += 4;
    doc.text('Discount:', 5, yPos);
    doc.text(`-${payment.discount.toLocaleString()}`, pageWidth - 5, yPos, {
      align: 'right',
    });
  }

  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 5, yPos);
  doc.text(`${payment.total.toLocaleString()}`, pageWidth - 5, yPos, {
    align: 'right',
  });

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Paid:', 5, yPos);
  doc.text(`${payment.amountPaid.toLocaleString()}`, pageWidth - 5, yPos, {
    align: 'right',
  });

  if (payment.balance > 0) {
    yPos += 4;
    doc.text('Balance:', 5, yPos);
    doc.text(`${payment.balance.toLocaleString()}`, pageWidth - 5, yPos, {
      align: 'right',
    });
  }

  yPos += 8;
  doc.line(5, yPos, pageWidth - 5, yPos);
  yPos += 5;

  doc.setFontSize(7);
  doc.text(`Method: ${payment.paymentMethod}`, 5, yPos);

  if (payment.transactionId) {
    yPos += 4;
    doc.text(`Transaction: ${payment.transactionId}`, 5, yPos);
  }

  yPos += 8;
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your visit!', pageWidth / 2, yPos, {
    align: 'center',
  });

  return doc;
}
