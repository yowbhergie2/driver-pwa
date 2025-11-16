/**
 * DTT PDF Generator
 * DPWH Regional Office II - Driver's Trip Ticket
 * Exact template replication
 */

// Base64 encoded logos for guaranteed loading (no CORS issues)
//
// TO ADD REAL LOGOS:
// 1. Convert your logo images to base64 using an online converter like:
//    https://www.base64-image.de/
// 2. Replace the placeholder strings below with your actual base64 data
// 3. Make sure to keep the 'data:image/png;base64,' prefix
//
// DPWH Logo - PLACEHOLDER (replace with actual base64)
const DPWH_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
// Bagong Pilipinas Logo - PLACEHOLDER (replace with actual base64)
const BAGONG_PILIPINAS_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Format period dates in "Month DD-DD, YYYY" format
 */
function formatPeriodDates(periodFrom, periodTo) {
  if (!periodFrom || !periodTo) return '_______________________________';

  try {
    const dateFrom = new Date(periodFrom);
    const dateTo = new Date(periodTo);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    const monthFrom = monthNames[dateFrom.getMonth()];
    const monthTo = monthNames[dateTo.getMonth()];
    const dayFrom = dateFrom.getDate();
    const dayTo = dateTo.getDate();
    const yearFrom = dateFrom.getFullYear();
    const yearTo = dateTo.getFullYear();

    // Same month and year
    if (monthFrom === monthTo && yearFrom === yearTo) {
      if (dayFrom === dayTo) {
        return `${monthFrom} ${dayFrom}, ${yearFrom}`;
      }
      return `${monthFrom} ${dayFrom}-${dayTo}, ${yearFrom}`;
    }

    // Different months or years
    return `${monthFrom} ${dayFrom}, ${yearFrom} - ${monthTo} ${dayTo}, ${yearTo}`;
  } catch (e) {
    return `${periodFrom} - ${periodTo}`;
  }
}

/**
 * Generate DTT PDF from trip data
 * @param {object} dttData - Trip ticket data
 * @returns {jsPDF} - PDF document object
 */
async function generateDttPdf(dttData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let yPos = 20;

  // Add logos using base64 data (no CORS issues, instant loading)
  try {
    // DPWH Logo (left side)
    doc.addImage(DPWH_LOGO_BASE64, 'PNG', 15, 10, 25, 25);

    // Bagong Pilipinas Logo (right side)
    doc.addImage(BAGONG_PILIPINAS_LOGO_BASE64, 'PNG', 170, 10, 25, 25);
  } catch (e) {
    console.warn('Logo loading failed:', e);
  }

  // Header with logos and text
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Republic of the Philippines', 105, yPos, { align: 'center' });
  yPos += 4;

  doc.setFont(undefined, 'bold');
  doc.text('DEPARTMENT OF PUBLIC WORKS AND HIGHWAYS', 105, yPos, { align: 'center' });
  yPos += 4;

  doc.setFont(undefined, 'bold');
  doc.text('REGIONAL OFFICE II', 105, yPos, { align: 'center' });
  yPos += 3;

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Dalan na Pavvurulun, Regional Government Center, Carig Sur, Tuguegarao City, Cagayan', 105, yPos, { align: 'center' });
  yPos += 8;

  // Title
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("DRIVER'S TRIP TICKET", 105, yPos, { align: 'center' });
  yPos += 10;

  // Date and Control No (right aligned)
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  const dateStr = dttData.createdAt
    ? (dttData.createdAt.toDate ? dttData.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(dttData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(dateStr, 200, yPos, { align: 'right' });
  yPos += 4;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text('(Date)', 200, yPos, { align: 'right' });
  yPos += 4;

  // Control No. in GREEN
  doc.setTextColor(0, 128, 0); // Green color
  doc.setFont(undefined, 'bold');
  doc.text(`Control No.: ${dttData.dttId || '_________________'}`, 200, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0); // Reset to black
  yPos += 8;

  // Main information section
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  const leftMargin = 15;
  const colonPos = 80;
  const valuePos = 85;
  const underlineWidth = 110; // Fixed width for all underlines

  // Information items with consistent underlines
  doc.text('1.  Name of Driver', leftMargin, yPos);
  doc.text(':', colonPos, yPos);
  const driverName = dttData.driverName || '';
  doc.text(driverName, valuePos, yPos);
  // Add consistent underline
  doc.line(valuePos, yPos + 1, valuePos + underlineWidth, yPos + 1);
  yPos += 6;

  doc.text("2.  Gov't. Vehicle to be used", leftMargin, yPos);
  doc.text(':', colonPos, yPos);
  const vehicle = dttData.vehicleBrand && dttData.vehicleModel
    ? `${dttData.vehicleBrand} ${dttData.vehicleModel} (${dttData.plateNo || 'N/A'})`
    : (dttData.plateNo || '');
  doc.text(vehicle, valuePos, yPos);
  // Add consistent underline
  doc.line(valuePos, yPos + 1, valuePos + underlineWidth, yPos + 1);
  yPos += 6;

  doc.text('3.  Name of authorized passenger/s', leftMargin, yPos);
  doc.text(':', colonPos, yPos);

  // Debug logging
  console.log('🔍 DEBUG Passengers data:', dttData.passengers);
  console.log('🔍 DEBUG Is array?', Array.isArray(dttData.passengers));

  const passengers = dttData.passengers && dttData.passengers.length > 0
    ? dttData.passengers.join(', ').toUpperCase()
    : '';

  console.log('🔍 DEBUG Formatted passengers:', passengers);

  // Use splitTextToSize for long passenger list
  const passengerLines = doc.splitTextToSize(passengers || ' ', underlineWidth);
  doc.text(passengerLines, valuePos, yPos);
  // Add consistent underline for each line
  passengerLines.forEach((line, index) => {
    doc.line(valuePos, yPos + 1 + (index * 5), valuePos + underlineWidth, yPos + 1 + (index * 5));
  });
  yPos += passengerLines.length * 5 + 1;

  doc.text('4.  Places to be visited/inspected', leftMargin, yPos);
  doc.text(':', colonPos, yPos);
  const destination = dttData.destination || '';
  doc.text(destination, valuePos, yPos);
  // Add consistent underline
  doc.line(valuePos, yPos + 1, valuePos + underlineWidth, yPos + 1);
  yPos += 6;

  doc.text('5.  Period Covered', leftMargin, yPos);
  doc.text(':', colonPos, yPos);
  const period = formatPeriodDates(dttData.periodFrom, dttData.periodTo);
  doc.text(period, valuePos, yPos);
  // Add consistent underline
  doc.line(valuePos, yPos + 1, valuePos + underlineWidth, yPos + 1);
  yPos += 6;

  doc.text('6.  Purpose', leftMargin, yPos);
  doc.text(':', colonPos, yPos);
  const purpose = dttData.purpose || dttData.purposes?.join(', ') || '';
  const purposeLines = doc.splitTextToSize(purpose || ' ', underlineWidth);
  doc.text(purposeLines, valuePos, yPos);
  // Add consistent underline for each line
  purposeLines.forEach((line, index) => {
    doc.line(valuePos, yPos + 1 + (index * 5), valuePos + underlineWidth, yPos + 1 + (index * 5));
  });
  yPos += purposeLines.length * 5 + 5;

  // Approval section
  yPos += 3;
  doc.setFont(undefined, 'normal');
  doc.text('Recommending Approval:', leftMargin, yPos);
  doc.text('Approved:', 115, yPos);
  yPos += 4;
  doc.text('By Authority of the Regional Director:', 115, yPos);
  yPos += 10;

  // Recommending Officer
  doc.setFont(undefined, 'bold');
  doc.text('ATTY. MARY QUEEN R. UMOQUIT', leftMargin, yPos);
  doc.text('RONALYN P. UBIÑA', 115, yPos);
  yPos += 4;

  doc.setFont(undefined, 'normal');
  doc.text('Chief Administrative Officer', leftMargin, yPos);
  doc.text('Officer-in-Charge', 115, yPos);
  yPos += 4;

  doc.text('Chief, Administrative Division', leftMargin, yPos);
  doc.text('Office of the Assistant Regional Director', 115, yPos);
  yPos += 10;

  // Driver section - TO BE FILLED OUT MANUALLY AFTER TRIP
  doc.setFont(undefined, 'normal');
  doc.text('To be filled out by Driver:', leftMargin, yPos);
  yPos += 5;

  const driverSectionIndent = 20; // Indent for driver section items
  const driverColonPos = 85;

  // Time fields - ALL BLANK (printed before trip)
  doc.text('1.  Time of departure from office/garage', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ AM/PM', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('2.  Time of arrival at (No. 4 above)', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ AM/PM', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('3.  Time of arrival from (No. 4 above)', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ AM/PM', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('4.  Time of arrival back to office/garage', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ AM/PM', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('5.  Approximate distance traveled', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ kms.', driverColonPos + 5, yPos);
  yPos += 5;

  // Gasoline section - ALL BLANK
  doc.text('6.  Gasoline issued, purchased and consumed', driverSectionIndent, yPos);
  yPos += 5;

  const fuelIndent = 28; // Sub-items indented more
  doc.text('a.  Balance in tank', fuelIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ liters', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('b.  Issued by office from stock', fuelIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ iters', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('c.  ADD: Purchased during the trip', fuelIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ iters', driverColonPos + 5, yPos);
  yPos += 4;

  doc.text('TOTAL', fuelIndent + 30, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ iters', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('d)  DEDUCT: Used during the trip', fuelIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ iters', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('e)  Balance in tank at the end of trip', fuelIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ iters', driverColonPos + 5, yPos);
  yPos += 5;

  // Other materials - ALL BLANK
  doc.text('7.  Motor oil issued', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ liters', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('8.  Lubricating oil issued', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ liters', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('9.  Grease issued', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ iters', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('10. Brake Fluid', driverSectionIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ iters', driverColonPos + 5, yPos);
  yPos += 5;

  // Speedometer readings - ALL BLANK
  doc.text('11. Speedometer reading (if any)', driverSectionIndent, yPos);
  yPos += 5;

  doc.text('a.  At the end of a trip', fuelIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ kms.', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('b.  At the beginning of a trip', fuelIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ kms.', driverColonPos + 5, yPos);
  yPos += 5;

  doc.text('c.  Distance traveled', fuelIndent, yPos);
  doc.text(':', driverColonPos, yPos);
  doc.text('____________________ kms.', driverColonPos + 5, yPos);
  yPos += 8;

  // Certification
  doc.setFontSize(9);
  doc.text('I HEREBY CERTIFY the correctness of the above statement of record of travel.', leftMargin, yPos);
  yPos += 10;

  // Driver signature - with actual driver name but blank signature line
  doc.setFont(undefined, 'bold');
  doc.text('_______________________________', 200, yPos, { align: 'right' });
  yPos += 4;
  doc.setFont(undefined, 'normal');
  doc.text(dttData.driverName ? dttData.driverName.toUpperCase() : 'ANGELO G. GACAD', 200, yPos - 1, { align: 'right' });
  yPos += 3;
  doc.text('Driver', 200, yPos, { align: 'right' });
  yPos += 8;

  // Driver certification - same font size as above
  doc.setFontSize(9);
  doc.text('I HEREBY CERTIFY that I used this vehicle on official business.', leftMargin, yPos);
  yPos += 10;

  // Passenger signature - BLANK
  doc.setFont(undefined, 'bold');
  doc.text('_______________________________', 200, yPos, { align: 'right' });
  yPos += 4;
  doc.setFont(undefined, 'normal');
  doc.text('PASSENGER 1/PASSENGER 2', 200, yPos, { align: 'right' });
  yPos += 3;
  doc.text('Passenger/s', 200, yPos, { align: 'right' });

  return doc;
}

/**
 * Generate PDF and return as Blob
 * @param {object} dttData - Trip ticket data
 * @returns {Promise<Blob>} - PDF as blob
 */
async function generateDttPdfBlob(dttData) {
  const pdf = await generateDttPdf(dttData);
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
    // Generate PDF blob
    const pdfBlob = generateDttPdfBlob(dttData);
    const filename = generateDttPdfFilename(dttData);

    // TODO: Implement Google Drive upload here
    // This would require Google Drive API integration
    console.log('PDF generated for upload:', filename);

    return {
      success: true,
      filename: filename,
      // Add Drive file ID and viewLink here when Drive integration is ready
    };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}
