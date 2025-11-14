/**
 * DTT PDF Generator
 * Shared utility for generating Driver Trip Ticket PDFs
 */

/**
 * Generate DTT PDF from trip data
 * @param {object} dttData - Trip ticket data
 * @returns {jsPDF} - PDF document object
 */
function generateDttPdf(dttData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // DPWH Header
  doc.setFillColor(0, 63, 135); // DPWH Blue
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('DPWH REGIONAL OFFICE II', 105, 10, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('DRIVER TRIP TICKET', 105, 18, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  let yPos = 35;

  // DTT ID and Status
  doc.setFont(undefined, 'bold');
  doc.text(`DTT ID: ${dttData.dttId || 'N/A'}`, 15, yPos);
  doc.text(`Status: ${dttData.status || 'Active'}`, 150, yPos);
  yPos += 10;

  // Vehicle Information Section
  doc.setFillColor(240, 240, 240);
  doc.rect(10, yPos, 190, 7, 'F');
  doc.setFont(undefined, 'bold');
  doc.text('VEHICLE INFORMATION', 15, yPos + 5);
  yPos += 12;

  doc.setFont(undefined, 'normal');
  doc.text(`Vehicle: ${dttData.vehicle || 'N/A'}`, 15, yPos);
  doc.text(`Plate No: ${dttData.plateNo || 'N/A'}`, 120, yPos);
  yPos += 7;

  // Passengers
  if (dttData.passengers && dttData.passengers.length > 0) {
    doc.text(`Authorized Passengers: ${dttData.passengers.join(', ')}`, 15, yPos);
    yPos += 7;
  }

  yPos += 3;

  // Trip Information Section
  doc.setFillColor(240, 240, 240);
  doc.rect(10, yPos, 190, 7, 'F');
  doc.setFont(undefined, 'bold');
  doc.text('TRIP INFORMATION', 15, yPos + 5);
  yPos += 12;

  doc.setFont(undefined, 'normal');
  doc.text(`Destination: ${dttData.destination || 'N/A'}`, 15, yPos);
  yPos += 7;

  doc.text(`Period Covered: ${dttData.periodFrom || 'N/A'} to ${dttData.periodTo || 'N/A'}`, 15, yPos);
  yPos += 7;

  doc.text('Purpose:', 15, yPos);
  yPos += 5;
  const purposeLines = doc.splitTextToSize(dttData.purpose || 'N/A', 180);
  doc.text(purposeLines, 15, yPos);
  yPos += purposeLines.length * 5 + 5;

  // Trip Details Section
  doc.setFillColor(240, 240, 240);
  doc.rect(10, yPos, 190, 7, 'F');
  doc.setFont(undefined, 'bold');
  doc.text('TRIP DETAILS', 15, yPos + 5);
  yPos += 12;

  doc.setFont(undefined, 'normal');

  // Time records
  if (dttData.timeDepartOffice) {
    doc.text(`Time of departure from office/garage: ${dttData.timeDepartOffice}`, 15, yPos);
    yPos += 6;
  }
  if (dttData.timeArrivalDest) {
    doc.text(`Time of arrival at destination: ${dttData.timeArrivalDest}`, 15, yPos);
    yPos += 6;
  }
  if (dttData.timeDepartDest) {
    doc.text(`Time of departure from destination: ${dttData.timeDepartDest}`, 15, yPos);
    yPos += 6;
  }
  if (dttData.timeArrivalOffice) {
    doc.text(`Time of arrival back to office/garage: ${dttData.timeArrivalOffice}`, 15, yPos);
    yPos += 6;
  }

  if (dttData.approximateDistance) {
    doc.text(`Approximate distance traveled: ${dttData.approximateDistance} km`, 15, yPos);
    yPos += 8;
  }

  // Gasoline Information
  doc.setFont(undefined, 'bold');
  doc.text('GASOLINE ISSUED, PURCHASED AND CONSUMED:', 15, yPos);
  yPos += 7;
  doc.setFont(undefined, 'normal');

  const fuelData = [
    { label: 'a. Balance in tank', value: dttData.balanceInTank },
    { label: 'b. Issued by office from stock', value: dttData.issuedByOffice },
    { label: 'c. Add: Purchased during trip', value: dttData.purchasedDuringTrip },
    { label: 'd. Total', value: dttData.totalFuel },
    { label: 'e. Less: Consumed', value: dttData.fuelConsumed },
    { label: 'f. Balance in tank', value: dttData.fuelBalance }
  ];

  fuelData.forEach(item => {
    if (item.value !== undefined && item.value !== null) {
      doc.text(`${item.label}: ${item.value} L`, 20, yPos);
      yPos += 6;
    }
  });

  yPos += 3;

  // Gear Oil if applicable
  if (dttData.gearOilIssued || dttData.gearOilPurchased) {
    doc.text(`Gear oil issued: ${dttData.gearOilIssued || 0} L`, 15, yPos);
    yPos += 6;
    doc.text(`Gear oil purchased: ${dttData.gearOilPurchased || 0} L`, 15, yPos);
    yPos += 8;
  }

  // Speedometer readings
  if (dttData.speedometerStart !== undefined || dttData.speedometerEnd !== undefined) {
    doc.setFont(undefined, 'bold');
    doc.text('SPEEDOMETER READINGS:', 15, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');

    if (dttData.speedometerStart !== undefined) {
      doc.text(`Start: ${dttData.speedometerStart} km`, 20, yPos);
      yPos += 6;
    }
    if (dttData.speedometerEnd !== undefined) {
      doc.text(`End: ${dttData.speedometerEnd} km`, 20, yPos);
      yPos += 6;
    }
    if (dttData.speedometerStart !== undefined && dttData.speedometerEnd !== undefined) {
      const distance = dttData.speedometerEnd - dttData.speedometerStart;
      doc.text(`Distance: ${distance} km`, 20, yPos);
      yPos += 8;
    }
  }

  // Remarks if any
  if (dttData.remarks) {
    doc.setFont(undefined, 'bold');
    doc.text('REMARKS:', 15, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    const remarksLines = doc.splitTextToSize(dttData.remarks, 180);
    doc.text(remarksLines, 15, yPos);
    yPos += remarksLines.length * 5 + 5;
  }

  // Driver Information
  yPos += 5;
  doc.setFont(undefined, 'bold');
  doc.text('DRIVER:', 15, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  doc.text(dttData.driverName || 'N/A', 15, yPos);
  yPos += 5;
  doc.text(`Driver UID: ${dttData.driverUid || 'N/A'}`, 15, yPos);
  yPos += 10;

  // Timestamps
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  if (dttData.createdAt) {
    const createdDate = dttData.createdAt.toDate ? dttData.createdAt.toDate() : new Date(dttData.createdAt);
    doc.text(`Created: ${createdDate.toLocaleString()}`, 15, yPos);
  }
  if (dttData.closedAt) {
    const closedDate = dttData.closedAt.toDate ? dttData.closedAt.toDate() : new Date(dttData.closedAt);
    doc.text(`Closed: ${closedDate.toLocaleString()}`, 120, yPos);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(0, 63, 135);
  doc.text('Department of Public Works and Highways - Regional Office II', 105, 285, { align: 'center' });

  return doc;
}

/**
 * Generate PDF and return as Blob
 * @param {object} dttData - Trip ticket data
 * @returns {Blob} - PDF as blob
 */
function generateDttPdfBlob(dttData) {
  const pdf = generateDttPdf(dttData);
  return pdf.output('blob');
}

/**
 * Generate PDF filename from DTT data
 * @param {object} dttData - Trip ticket data
 * @returns {string} - Filename
 */
function generateDttPdfFilename(dttData) {
  const dttId = dttData.dttId || 'UNKNOWN';
  const destination = (dttData.destination || 'TRIP').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const date = dttData.periodFrom || new Date().toISOString().split('T')[0];
  return `DTT_${dttId}_${destination}_${date}.pdf`;
}

/**
 * Upload DTT PDF to Google Drive and update Firestore
 * @param {object} dttData - Trip ticket data
 * @param {string} dttId - Document ID in Firestore
 * @returns {Promise<object>} - Upload result with links
 */
async function uploadDttPdfToDrive(dttData, dttId) {
  try {
    // Generate PDF
    const pdfBlob = generateDttPdfBlob(dttData);
    const filename = generateDttPdfFilename(dttData);

    // Upload to Google Drive
    const uploadResult = await driveUploader.uploadPdf(pdfBlob, filename, {
      dttId: dttId,
      driverName: dttData.driverName,
      destination: dttData.destination,
      periodFrom: dttData.periodFrom,
      periodTo: dttData.periodTo
    });

    // Update Firestore with PDF link
    await db.collection('dtts').doc(dttId).update({
      pdfFileId: uploadResult.fileId,
      pdfViewLink: uploadResult.publicLink,
      pdfDownloadLink: uploadResult.downloadLink,
      pdfUploadedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return uploadResult;
  } catch (error) {
    console.error('Error uploading DTT PDF:', error);
    throw error;
  }
}
