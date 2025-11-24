# CLAUDE.md - AI Assistant Development Guide

**Last Updated:** 2025-01-24
**Project:** DPWH Regional Office II - Vehicle & Fuel Management System
**Repository:** yowbhergie2/driver-pwa

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Directory Structure](#directory-structure)
5. [Database Schema (Firestore)](#database-schema-firestore)
6. [User Roles & Access Control](#user-roles--access-control)
7. [Code Organization & Patterns](#code-organization--patterns)
8. [Key Workflows](#key-workflows)
9. [Development Conventions](#development-conventions)
10. [Common Development Tasks](#common-development-tasks)
11. [Firebase Configuration](#firebase-configuration)
12. [Deployment Guide](#deployment-guide)
13. [Testing Strategy](#testing-strategy)
14. [Troubleshooting](#troubleshooting)
15. [Critical Business Rules](#critical-business-rules)

---

## Project Overview

### Purpose

This is a **Progressive Web Application (PWA)** for the **DPWH (Department of Public Works and Highways) Regional Office II** that provides comprehensive vehicle and fuel management capabilities for government operations.

### Primary Goals

1. Link travel authorization (Driver Trip Tickets - DTT) with fuel requisition/issuance (RIS)
2. Manage fuel contracts and real-time balance tracking
3. Analyze fuel efficiency through contract arrangements
4. Support multiple user roles with different permissions and workflows
5. Maintain complete audit trail for COA compliance

### Key Characteristics

- **Multi-Page Application (MPA)** - Each HTML file is independent, not a SPA
- **Role-Based Access Control** - 4 user types: Admin, Driver, EMD, SPMS
- **Real-Time Database** - Cloud Firestore for instant data synchronization
- **Offline Support** - Service Worker enables PWA functionality
- **Cloud-Hosted** - Firebase Hosting with custom domain support

---

## Technology Stack

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **HTML Framework** | Bootstrap | 5.3.0 | Responsive UI components and grid layout |
| **Icons** | Bootstrap Icons | 1.11.0 | SVG icon library |
| **PDF Generation** | jsPDF | 2.5.1 | Generate Driver Trip Ticket PDFs |
| **Modal System** | Custom ModalManager | - | Gmail-style modals (in-house built) |
| **CSS** | Inline styles + Bootstrap | - | Page-specific and utility classes |

### Backend & Database

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Authentication** | Firebase Auth | 10.7.1 | Email/password auth, user sessions |
| **Database** | Cloud Firestore | 10.7.1 | NoSQL document database |
| **Hosting** | Firebase Hosting | - | Static site hosting with PWA support |
| **Cloud Storage** | Google Drive API | v3 | Store generated DTT PDFs |
| **Backend Logic** | Inline JavaScript | - | Client-side business logic in HTML files |

### Development Tools

- **No Build Process** - Direct deployment without transpilation
- **No Package Manager** - Dependencies loaded via CDN
- **No Bundler** - Browser loads resources directly
- **Version Control** - Git + GitHub

### Browser Compatibility

- Chrome/Edge (Chromium-based) - Full support
- Firefox - Full support
- Safari - Full support with Service Worker
- Mobile browsers - PWA installable on Android/iOS

---

## Architecture & Design Patterns

### Application Type

**Multi-Page Application (MPA)**
- Each HTML file serves as an independent entry point
- No client-side routing framework
- Traditional page navigation with full page loads
- Shared Firebase configuration across pages

### Code Organization Pattern

```javascript
// Typical page structure:
1. <!DOCTYPE html>
2. <head> with meta tags, PWA manifest, external CSS/JS
3. <style> block for page-specific CSS
4. <body> with Bootstrap markup
5. <script> block containing:
   - Firebase configuration & initialization
   - Authentication state management
   - Data CRUD operations
   - UI event handlers
   - Modal management
   - Business logic
```

### State Management

- **Session State** - Volatile, exists only during page lifecycle
- **Persistent State** - Stored in Firestore database
- **Global Variables** - JavaScript globals for current page state
- **Auth State** - Managed by Firebase Auth SDK

### Security Model

- **Authentication Required** - All pages check `auth.onAuthStateChanged()`
- **Role-Based Access** - UI elements shown/hidden based on user role
- **Firestore Rules** - Server-side security (rules not in repo)
- **Client-Side Validation** - Form validation before submission

---

## Directory Structure

```
driver-pwa/
│
├── HTML Pages (User Interfaces)
│   ├── index.html                  # Driver login & dashboard
│   ├── create-dtt.html            # Create Driver's Trip Ticket
│   ├── request-fuel.html          # Fuel request (RIS) form
│   ├── my-trips.html              # View trip history
│   ├── profile.html               # Driver profile management
│   ├── staff-dashboard.html       # EMD & SPMS consolidated dashboard
│   ├── admin-setup.html           # Admin: user/vehicle management
│   ├── staff-id-generator.html    # School Staff ID card generator
│   └── create-test-users.html     # Testing utility
│
├── JavaScript Utilities
│   ├── modal-system.js            # Gmail-style modal manager (323 lines)
│   ├── dtt-pdf-generator.js       # PDF generation for DTT (412 lines)
│   ├── google-drive-utils.js      # Google Drive API integration (241 lines)
│   ├── fix-getcomputedstyle.js    # Browser compatibility fix (40 lines)
│   └── service-worker.js          # Offline PWA support (66 lines)
│
├── CSS Files
│   └── modal-styles.css           # Modal CSS framework
│
├── Configuration
│   ├── manifest.json              # PWA manifest
│   ├── firebase.json              # Firebase hosting config
│   └── .firebaserc                # Firebase project config
│
├── Documentation
│   ├── CLAUDE.md                  # This file - AI assistant guide
│   ├── SYSTEM_OVERVIEW.md         # Complete system architecture
│   ├── PROJECT_SPECIFICATION_FOR_CLAUDE_CODE (1).md
│   ├── Fuel_Vehicle_Management_System_Specification.md
│   ├── CREATE_DTT_REDESIGN_SUMMARY.md
│   ├── GOOGLE_DRIVE_SETUP.md
│   └── VEHICLE_IMPORT_GUIDE.md
│
└── Version Control
    └── .gitignore                 # Git ignore patterns
```

---

## Database Schema (Firestore)

### Collection: `users`

User accounts with role-based access control.

```javascript
{
  uid: "auth_uid_12345",           // Document ID (from Firebase Auth)
  email: "driver@dpwh.gov.ph",
  displayName: "Juan Dela Cruz",
  role: "driver",                   // 'driver' | 'emd' | 'spms' | 'admin'
  permissions: [],                  // Array for emd/spms permissions
  assignedVehicle: "H1 5750",      // For drivers only (optional)
  status: "Active",                 // 'Active' | 'Inactive'
  createdAt: Timestamp,
  createdBy: "admin_uid",
  lastLogin: Timestamp
}
```

### Collection: `vehicles`

Vehicle inventory with real-time fuel tracking.

```javascript
{
  plateNo: "H1 5750",              // Document ID and field
  dpwhNo: "DPWH-2024-001",
  brand: "Toyota",
  model: "Vios",
  fuelType: "Diesel",              // 'Diesel' | 'Gasoline'
  fuelCapacity: 60,                // Liters (tank capacity)
  currentFuelBalance: 43.5,        // Real-time balance (updated by system)
  status: "Available",             // 'Available' | 'In Use'
  createdAt: Timestamp,
  createdBy: "admin_uid",
  updatedAt: Timestamp
}
```

### Collection: `dtts`

Driver's Trip Tickets (travel authorization).

```javascript
{
  dttId: "DTT_1736217600000",     // Auto-generated: DTT_timestamp
  driverName: "Juan Dela Cruz",
  driverUid: "auth_uid_12345",
  driverEmail: "driver@dpwh.gov.ph",
  division: "Engineering Division",

  // Vehicle details
  plateNo: "H1 5750",
  vehicleModel: "Toyota Vios",
  dpwhNo: "DPWH-2024-001",

  // Trip details
  destination: "Butuan City",
  purpose: "Official travel to conduct training",
  purposes: ["Training", "Inspection"],  // Array for multiple purposes
  periodFrom: Date,
  periodTo: Date,

  // Trip completion (filled when closing trip)
  timeDepartOffice: "08:00 AM",
  timeArrivalDest: "10:30 AM",
  distanceTravelled: 100,          // km
  fuelConsumed: 10,                // Liters (calculated)
  speedometer: {
    start: 12000,                  // km
    end: 12100                     // km
  },

  // Status tracking
  status: "Pending",               // 'Pending' | 'Approved' | 'In-Progress' | 'Completed' | 'Rejected'
  approvedBy: "SPMS Staff Name",
  approvedByUid: "spms_uid",
  approvedAt: Timestamp,

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  completedAt: Timestamp           // When trip closed
}
```

### Collection: `risRequests`

Fuel requisition and issuance slips (RIS).

```javascript
{
  risId: "RIS_1736217700000",     // Temporary ID (auto-generated)
  requestType: "vehicle",          // 'vehicle' | 'non-vehicle' | 'dredge'
  status: "Pending",               // 'Pending' | 'Validated' | 'Finalized' | 'Rejected'

  // Requester info
  requestedBy: "Juan Dela Cruz",
  requestedByUid: "driver_uid",
  requestedByEmail: "driver@dpwh.gov.ph",
  requestedAt: Timestamp,

  // Fuel request details
  purpose: "Official travel to Butuan City",
  requisitionQty: 50,              // Liters requested
  issuanceQty: 50,                 // Approved quantity (can be adjusted by EMD)

  // Vehicle-specific (if requestType === 'vehicle')
  plateNo: "H1 5750",
  dpwhNo: "DPWH-2024-001",
  vehicle: "Toyota Vios",
  fuelBalanceBefore: 5.0,
  linkedDttId: "DTT_xxx",          // Optional link to DTT

  // Dredge-specific (if requestType === 'dredge')
  dredgeType: "Cutter Suction Dredge",

  // Non-vehicle-specific (if requestType === 'non-vehicle')
  equipmentName: "Generator Set",

  // EMD validation fields (status: Validated)
  validUntil: Date,                // Valid for issuance until date
  validatedQty: 50,                // EMD can adjust quantity
  emdRemarks: "Approved for official use",
  validatedBy: "David Hidalgo",
  validatedByUid: "emd_uid",
  validatedAt: Timestamp,

  // SPMS finalization fields (status: Finalized)
  realRisNo: "2025 01 0001",      // Official RIS number (YYYY MM ####)
  contractId: "CONTRACT_2024_001",
  contractNo: "2024-FUEL-001",
  pricePerLiter: 75.50,            // From priceMaster at time of finalization
  totalCost: 3775.00,              // issuanceQty * pricePerLiter
  spmsRemarks: "Finalized and charged to contract",
  finalizedBy: "Rhodelyn Orlanda",
  finalizedByUid: "spms_uid",
  finalizedAt: Timestamp,

  // Audit tracking
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `fuelContracts`

Fuel supply contracts with real-time balance tracking.

```javascript
{
  contractId: "CONTRACT_2024_001", // Auto-generated
  contractNo: "2024-FUEL-001",     // Display reference
  supplier: "Petron Corporation",
  fuelType: "Diesel",              // 'Diesel' | 'Gasoline' | 'Both'

  // Contract period
  startDate: Date,
  endDate: Date,
  status: "Active",                // 'Active' | 'Closed' | 'Expired'

  // Financial tracking
  totalLiters: 10000,              // Total contract liters
  pricePerLiter: 75.50,
  totalAmount: 755000.00,          // Original contract value (PHP)
  usedLiters: 50,                  // Auto-incremented when RIS finalized
  usedAmount: 3775.00,             // Auto-incremented when RIS finalized

  // Metadata
  createdBy: "SPMS Staff",
  createdByUid: "spms_uid",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `priceMaster`

Weekly fuel price updates.

```javascript
{
  priceId: "PRICE_20250107",       // Date-based ID
  provider: "Petron",              // 'Petron' | 'Shell' | 'Caltex' | etc.
  weekStartDate: Date,             // Effective date (usually Tuesday)
  dieselPrice: 75.50,              // PHP per liter
  gasolinePrice: 68.30,            // PHP per liter

  // Metadata
  enteredBy: "David Hidalgo",
  enteredByUid: "emd_uid",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `divisions`

Office/Division list for dropdown selections.

```javascript
{
  divisionId: "DIV_001",           // Auto-generated
  name: "Engineering Division",
  code: "ENG",
  isActive: true,
  createdAt: Timestamp,
  createdBy: "admin_uid"
}
```

---

## User Roles & Access Control

### Role Hierarchy

```
Admin
  ├── Full access to all features
  ├── Can perform EMD + SPMS functions
  └── User management (create/edit/delete users)

SPMS Staff (Supply & Property Management)
  ├── Approve Driver's Trip Tickets
  ├── Finalize RIS (generate Real RIS numbers)
  ├── Manage fuel contracts
  └── View analytics dashboard

EMD Staff (Equipment Management Division)
  ├── Manage vehicles (add/edit/status)
  ├── Manage Price Master (fuel prices)
  └── Validate RIS requests

Driver
  ├── Create Driver's Trip Tickets
  ├── Request fuel (standalone RIS)
  └── View trip history
```

### Access Matrix

| Feature | Driver | EMD | SPMS | Admin |
|---------|--------|-----|------|-------|
| Create DTT | ✓ | - | - | ✓ |
| Request Fuel (RIS) | ✓ | - | - | ✓ |
| View My Trips | ✓ | - | - | ✓ |
| Manage Vehicles | - | ✓ | - | ✓ |
| Manage Price Master | - | ✓ | - | ✓ |
| Validate RIS | - | ✓ | - | ✓ |
| Approve DTT | - | - | ✓ | ✓ |
| Finalize RIS | - | - | ✓ | ✓ |
| Manage Contracts | - | - | ✓ | ✓ |
| Create Users | - | - | - | ✓ |
| Analytics Dashboard | - | - | ✓ | ✓ |

### Role Detection Pattern

```javascript
// Standard pattern used across all pages
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    // Redirect to login
    window.location.href = 'index.html';
    return;
  }

  // Fetch user role from Firestore
  const userDoc = await db.collection('users').doc(user.uid).get();
  const userData = userDoc.data();
  const userRole = userData.role; // 'driver', 'emd', 'spms', 'admin'

  // Route based on role
  if (userRole === 'driver') {
    // Show driver interface
  } else if (userRole === 'emd' || userRole === 'spms' || userRole === 'admin') {
    // Redirect to staff dashboard
    window.location.href = 'staff-dashboard.html';
  }
});
```

---

## Code Organization & Patterns

### Firebase Configuration Pattern

Every page includes this standard Firebase initialization:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDTPngeGZviiOjv3N1V_wPTGvRUVFOPa14",
  authDomain: "fuel-vehicle-management.firebaseapp.com",
  projectId: "fuel-vehicle-management",
  storageBucket: "fuel-vehicle-management.firebasestorage.app",
  messagingSenderId: "821758027736",
  appId: "1:821758027736:web:3b1924046e73cb0c9434ad"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
```

### Data Access Patterns

**Create Document:**
```javascript
await db.collection('risRequests').doc(risId).set({
  risId: risId,
  status: 'Pending',
  requestedBy: userName,
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

**Read Document:**
```javascript
const doc = await db.collection('vehicles').doc(plateNo).get();
if (doc.exists) {
  const vehicleData = doc.data();
  console.log(vehicleData);
}
```

**Update Document:**
```javascript
await db.collection('fuelContracts').doc(contractId).update({
  usedLiters: firebase.firestore.FieldValue.increment(50),
  usedAmount: firebase.firestore.FieldValue.increment(3775.00),
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

**Query Collection:**
```javascript
const snapshot = await db.collection('dtts')
  .where('driverUid', '==', user.uid)
  .where('status', '==', 'Pending')
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get();

snapshot.forEach(doc => {
  const dttData = doc.data();
  // Process each document
});
```

**Delete Document:**
```javascript
await db.collection('risRequests').doc(risId).delete();
```

### Modal System Pattern

The application uses a custom Gmail-style modal system:

```javascript
// Global instance (loaded from modal-system.js)
const modalManager = new ModalManager();

// Open modal
modalManager.open(
  'Modal Title',           // Title
  contentHTML,             // HTML content string
  'modal-id',              // Unique ID
  true                     // Backdrop enabled
);

// Close modal
modalManager.close('modal-id');

// Close all modals
modalManager.closeAll();
```

### Section Navigation Pattern

Multi-section pages use hidden divs with visibility toggling:

```javascript
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('[id$="-section"]').forEach(section => {
    section.classList.add('d-none');
  });

  // Show selected section
  document.getElementById(sectionId).classList.remove('d-none');

  // Update active nav item
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  event.target.classList.add('active');
}
```

### Loading State Pattern

```javascript
async function loadData() {
  // Show loading indicator
  document.getElementById('loading-spinner').classList.remove('d-none');
  document.getElementById('content-area').classList.add('d-none');

  try {
    // Fetch data from Firestore
    const snapshot = await db.collection('vehicles').get();

    // Process data
    snapshot.forEach(doc => {
      // Render data
    });
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Failed to load data: ' + error.message);
  } finally {
    // Hide loading, show content
    document.getElementById('loading-spinner').classList.add('d-none');
    document.getElementById('content-area').classList.remove('d-none');
  }
}
```

### Error Handling Pattern

```javascript
try {
  // Firestore operation
  await db.collection('dtts').doc(dttId).set(dttData);

  // Success feedback
  alert('✓ DTT created successfully!');
  window.location.href = 'my-trips.html';
} catch (error) {
  console.error('Error creating DTT:', error);
  alert('Error: ' + error.message);
}
```

---

## Key Workflows

### Workflow 1: RIS Request Process

```
┌─────────────────────────────────────────────┐
│ 1. DRIVER REQUESTS FUEL                     │
│    - Creates RIS request                    │
│    - Status: Pending                        │
│    - Temp RIS ID generated                  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. EMD VALIDATES REQUEST                    │
│    - Reviews fuel request                   │
│    - Sets "Valid Until" date                │
│    - Adjusts quantity if needed             │
│    - Status: Pending → Validated            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. SPMS FINALIZES RIS                       │
│    - Links to fuel contract                 │
│    - Generates Real RIS Number              │
│    - Auto-calculates cost                   │
│    - Updates contract balance               │
│    - Updates vehicle fuel balance           │
│    - Status: Validated → Finalized          │
└─────────────────────────────────────────────┘
```

### Workflow 2: Driver Trip Ticket (DTT)

```
┌─────────────────────────────────────────────┐
│ 1. DRIVER CREATES DTT                       │
│    - Fills trip details                     │
│    - Selects vehicle                        │
│    - Sets destination & purpose             │
│    - Status: Pending                        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. SPMS APPROVES DTT                        │
│    - Reviews trip details                   │
│    - Approves or rejects                    │
│    - Status: Pending → Approved             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. DRIVER COMPLETES TRIP                    │
│    - Enters end odometer                    │
│    - System calculates fuel used            │
│    - Status: Approved → Completed           │
└─────────────────────────────────────────────┘
```

### Workflow 3: Contract Balance Update

```
When SPMS finalizes a RIS:

1. RIS document updated:
   - status: 'Finalized'
   - realRisNo: '2025 01 0001'
   - pricePerLiter: 75.50
   - totalCost: 3775.00

2. Contract balance auto-updated (Firestore transaction):
   - usedLiters: INCREMENT(50)
   - usedAmount: INCREMENT(3775.00)

3. Vehicle fuel balance auto-updated (if vehicle type):
   - currentFuelBalance: INCREMENT(50)
```

---

## Development Conventions

### Coding Standards

1. **Use Bootstrap Classes** - Prefer Bootstrap utilities over custom CSS
2. **Consistent Naming** - Use camelCase for JavaScript, kebab-case for IDs
3. **Comment Complex Logic** - Add comments for business logic and calculations
4. **Error Handling** - Always wrap Firestore operations in try-catch
5. **Loading States** - Show loading indicators for async operations
6. **Responsive Design** - Test on mobile devices regularly

### Bootstrap Conventions

**Color Scheme:**
```css
Primary Blue:    #003f87, #1e3c72 (DPWH brand colors)
Secondary:       #764ba2, #7e22ce (Purple gradients)
Success:         #28a745 (Green for approved/success)
Warning:         #ffc107 (Yellow for pending)
Danger:          #dc3545 (Red for rejected/errors)
```

**Common Patterns:**
```html
<!-- Card with shadow -->
<div class="card shadow-sm mb-4">
  <div class="card-body">
    <!-- Content -->
  </div>
</div>

<!-- Primary button -->
<button class="btn btn-primary w-100">
  Submit
</button>

<!-- Badge for status -->
<span class="badge bg-success">Approved</span>
<span class="badge bg-warning text-dark">Pending</span>
<span class="badge bg-danger">Rejected</span>

<!-- Form group -->
<div class="mb-3">
  <label for="inputId" class="form-label">Label</label>
  <input type="text" class="form-control" id="inputId">
</div>
```

### File Naming Conventions

- **HTML pages** - lowercase with hyphens: `create-dtt.html`
- **JavaScript utilities** - lowercase with hyphens: `modal-system.js`
- **CSS files** - lowercase with hyphens: `modal-styles.css`
- **Documentation** - UPPERCASE with underscores: `SYSTEM_OVERVIEW.md`

### Timestamp Conventions

- **Storage** - Always use `firebase.firestore.FieldValue.serverTimestamp()`
- **Display** - Format as `MM/DD/YYYY` or `Jan 24, 2025`
- **Timezone** - Asia/Manila (UTC+8)

```javascript
// Create timestamp
createdAt: firebase.firestore.FieldValue.serverTimestamp()

// Format for display
const date = new Date(timestamp.toDate());
const formatted = date.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});
```

---

## Common Development Tasks

### Task 1: Add a New Page

1. Create new HTML file (e.g., `new-feature.html`)
2. Copy template structure from existing page
3. Include Firebase configuration
4. Add authentication check
5. Implement page-specific logic
6. Update navigation links in other pages
7. Test locally
8. Deploy to Firebase

### Task 2: Add a New Firestore Collection

1. Define schema in this document (Database Schema section)
2. Update Firestore security rules (not in repo)
3. Create sample documents for testing
4. Add CRUD functions in relevant pages
5. Add indexes if needed (Firestore console)
6. Update SYSTEM_OVERVIEW.md

### Task 3: Modify UI Component

1. Locate the HTML file containing the component
2. Use Bootstrap classes for styling
3. Test responsiveness on mobile
4. Ensure accessibility (ARIA labels, etc.)
5. Clear browser cache (`Ctrl + Shift + R`)
6. Test on multiple browsers

### Task 4: Add a New User Role Permission

1. Update `users` collection schema
2. Modify authentication check in affected pages
3. Update Access Matrix in this document
4. Add UI elements for new permission
5. Update Firestore security rules
6. Test with test user accounts

### Task 5: Debug Firestore Data Issues

1. Open Firebase Console → Firestore
2. Navigate to collection
3. Check document structure
4. Verify field types match schema
5. Check browser console for errors
6. Use `console.log()` to debug data flow
7. Check Firestore security rules

---

## Firebase Configuration

### Project Details

```
Project ID:       fuel-vehicle-management
Project Name:     Fuel & Vehicle Management
Hosting URL:      https://fuel-vehicle-management.web.app
Firebase Console: https://console.firebase.google.com/project/fuel-vehicle-management
```

### Enabled Services

- ✅ Authentication (Email/Password)
- ✅ Cloud Firestore (Database)
- ✅ Firebase Hosting
- ⏳ Cloud Functions (future)
- ⏳ Cloud Storage (future)

### Security Rules

Current security rules (development mode):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ IMPORTANT:** Production rules should implement proper role-based access control.

### Required Firestore Indexes

```
Collection: risRequests
- (status, validatedAt) DESC
- (status, finalizedAt) DESC

Collection: dtts
- (driverUid, status, createdAt) DESC
- (status, createdAt) DESC

Collection: fuelContracts
- (status, endDate) DESC

Collection: priceMaster
- (provider, weekStartDate) DESC
```

---

## Deployment Guide

### Prerequisites

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Deploy to Firebase Hosting

```bash
# Navigate to project directory
cd /path/to/driver-pwa

# Deploy all services
firebase deploy

# Deploy only hosting (faster)
firebase deploy --only hosting

# Deploy only functions (future)
firebase deploy --only functions
```

### Local Testing

```bash
# Serve locally on http://localhost:5000
firebase serve

# Test with emulators
firebase emulators:start
```

### Post-Deployment Checklist

1. ✅ Clear browser cache (`Ctrl + Shift + R`)
2. ✅ Test authentication flow
3. ✅ Test critical features (create DTT, request fuel)
4. ✅ Check Firestore data writes
5. ✅ Test on mobile device
6. ✅ Verify PWA installation works
7. ✅ Check Service Worker updates

---

## Testing Strategy

### Manual Testing Checklist

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Logout and verify redirect
- [ ] Session persistence across page refreshes

**Driver Functions:**
- [ ] Create DTT with all required fields
- [ ] Request fuel (vehicle type)
- [ ] Request fuel (non-vehicle type)
- [ ] Request fuel (dredge type)
- [ ] View trip history
- [ ] Edit profile

**EMD Functions:**
- [ ] Add new vehicle
- [ ] Edit vehicle details
- [ ] Add fuel price to Price Master
- [ ] Validate pending RIS
- [ ] Adjust RIS quantity

**SPMS Functions:**
- [ ] Approve pending DTT
- [ ] Finalize validated RIS
- [ ] Create fuel contract
- [ ] View contract balance updates
- [ ] Check analytics dashboard

**Data Validation:**
- [ ] Verify Firestore writes
- [ ] Check timestamp formats
- [ ] Verify calculated fields (fuel used, distances, costs)
- [ ] Check contract balance decrements
- [ ] Verify vehicle fuel balance increments

### Test User Accounts

Create test accounts for each role:

```javascript
// Example test users (create via admin-setup.html)
driver1@test.com      (role: driver)
emd1@test.com         (role: emd)
spms1@test.com        (role: spms)
admin@test.com        (role: admin)
```

---

## Troubleshooting

### Issue 1: "Permission Denied" in Firestore

**Symptoms:** Console shows Firestore permission errors

**Solutions:**
1. Check user is authenticated (`firebase.auth().currentUser`)
2. Verify Firestore security rules allow operation
3. Check document ID format matches rules
4. Ensure user role has permission for operation

### Issue 2: Changes Not Showing After Deployment

**Symptoms:** Old code still running after `firebase deploy`

**Solutions:**
1. Hard refresh browser (`Ctrl + Shift + R`)
2. Clear browser cache completely
3. Test in incognito/private window
4. Clear Service Worker cache
5. Unregister Service Worker and re-register

### Issue 3: Modal Not Opening

**Symptoms:** Modal doesn't appear when triggered

**Solutions:**
1. Check `modal-system.js` is loaded before usage
2. Verify `modalManager` global variable exists
3. Check for JavaScript errors in console
4. Ensure modal ID is unique
5. Check z-index conflicts with other elements

### Issue 4: Firebase API Key Errors

**Symptoms:** "API key not valid" or similar errors

**Solutions:**
1. Verify `firebaseConfig` object is correct
2. Check Firebase project settings in console
3. Ensure API key restrictions allow web domain
4. Clear browser cache and hard refresh

### Issue 5: Dropdown Not Populating

**Symptoms:** Vehicle or division dropdowns are empty

**Solutions:**
1. Check Firestore collection has documents
2. Verify collection name matches query
3. Check browser console for query errors
4. Ensure authentication is complete before query
5. Check Firestore security rules allow read

### Issue 6: Calculations Not Working

**Symptoms:** Fuel used, costs, or distances incorrect

**Solutions:**
1. Check all input values are numbers (use `parseFloat()`)
2. Verify calculation formulas match requirements
3. Check for NaN or undefined values
4. Log intermediate values with `console.log()`
5. Verify Firestore FieldValue.increment() usage

---

## Critical Business Rules

### Rule 1: RIS Number Format

**Real RIS Number:** `YYYY MM ####`
- YYYY: Year (e.g., 2025)
- MM: Month with leading zero (01-12)
- ####: Sequential counter (resets monthly)
- Example: `2025 01 0001`, `2025 01 0002`

**Temporary RIS Number:** `RIS_timestamp`
- Used for internal tracking only
- Replaced with Real RIS No upon finalization

### Rule 2: Fuel Balance Calculation

**Vehicle Fuel Balance:**
```
New Balance = Current Balance + Fuel Added (RIS) - Fuel Used (DTT)
```

**Fuel Used (when closing DTT):**
```javascript
distanceTraveled = odometerEnd - odometerStart
fuelUsed = distanceTraveled / standardKmPerLiter
newFuelBalance = currentBalance - fuelUsed
```

### Rule 3: Contract Balance Management

**Deduction (when RIS finalized):**
```javascript
totalCost = issuanceQty * pricePerLiter
newBalance = currentBalance - totalCost

// Validation
if (newBalance < 0) {
  throw new Error('Insufficient contract balance');
}
```

**Auto-update using Firestore FieldValue:**
```javascript
await db.collection('fuelContracts').doc(contractId).update({
  usedLiters: firebase.firestore.FieldValue.increment(issuanceQty),
  usedAmount: firebase.firestore.FieldValue.increment(totalCost),
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

### Rule 4: Price Master Logic

- EMD updates fuel prices weekly (usually Tuesday)
- System uses **most recent** price when calculating RIS costs
- Price at time of finalization is stored in RIS document
- Historical prices preserved for audit trail

**Fetch Latest Price:**
```javascript
async function getLatestPrice(fuelType, provider) {
  const snapshot = await db.collection('priceMaster')
    .where('provider', '==', provider)
    .orderBy('weekStartDate', 'desc')
    .limit(1)
    .get();

  const latestPrice = snapshot.docs[0].data();
  return fuelType === 'Diesel' ? latestPrice.dieselPrice : latestPrice.gasolinePrice;
}
```

### Rule 5: Status Transitions

**RIS Status Flow:**
```
Pending → Validated → Finalized
        ↘ Rejected
```

**DTT Status Flow:**
```
Pending → Approved → In-Progress → Completed
        ↘ Rejected
```

**Contract Status:**
- `Active` - Current valid contract
- `Closed` - Manually closed by SPMS
- `Expired` - End date passed
- `Depleted` - Balance ≤ 0

---

## Development Workflow Best Practices

### Before Making Changes

1. ✅ Read this CLAUDE.md document thoroughly
2. ✅ Understand the affected workflow/feature
3. ✅ Check related database schema
4. ✅ Review existing code patterns
5. ✅ Identify test user accounts needed

### During Development

1. ✅ Follow existing code patterns
2. ✅ Use Bootstrap classes for UI
3. ✅ Add error handling (try-catch)
4. ✅ Add loading states for async operations
5. ✅ Test on mobile viewport
6. ✅ Console.log for debugging
7. ✅ Comment complex logic

### After Making Changes

1. ✅ Test locally with `firebase serve`
2. ✅ Test all user roles affected
3. ✅ Verify Firestore data writes
4. ✅ Check browser console for errors
5. ✅ Test on mobile device
6. ✅ Update documentation if needed
7. ✅ Commit with clear message
8. ✅ Deploy to Firebase
9. ✅ Hard refresh and verify

### Git Commit Messages

Use clear, descriptive commit messages:

```bash
# Good examples
git commit -m "Add vehicle fuel balance display to RIS finalization"
git commit -m "Fix contract balance calculation rounding error"
git commit -m "Update CLAUDE.md with new RIS workflow"

# Bad examples (avoid)
git commit -m "Update"
git commit -m "Fix bug"
git commit -m "Changes"
```

---

## Helpful Resources

### Firebase Documentation
- Firestore: https://firebase.google.com/docs/firestore
- Authentication: https://firebase.google.com/docs/auth
- Hosting: https://firebase.google.com/docs/hosting
- Cloud Functions: https://firebase.google.com/docs/functions

### Bootstrap Documentation
- Components: https://getbootstrap.com/docs/5.3/components/
- Utilities: https://getbootstrap.com/docs/5.3/utilities/
- Grid: https://getbootstrap.com/docs/5.3/layout/grid/

### JavaScript References
- MDN Web Docs: https://developer.mozilla.org/
- Firebase SDK Reference: https://firebase.google.com/docs/reference/js

---

## Quick Reference Commands

```bash
# Firebase deployment
firebase deploy                    # Deploy all
firebase deploy --only hosting    # Deploy hosting only
firebase serve                     # Test locally

# Git version control
git status                         # Check status
git add .                          # Stage all changes
git commit -m "Message"           # Commit changes
git push origin branch-name       # Push to remote

# Browser testing
Ctrl + Shift + R                  # Hard refresh (Windows/Linux)
Cmd + Shift + R                   # Hard refresh (Mac)
F12                               # Open DevTools
Ctrl + Shift + I                  # Open DevTools (alternative)
```

---

## Contact & Support

**Developer:** Beginner (Learning Phase)
**Organization:** DPWH Regional Office II
**Repository:** https://github.com/yowbhergie2/driver-pwa
**Firebase Project:** fuel-vehicle-management

For issues or questions:
1. Check this CLAUDE.md document
2. Review SYSTEM_OVERVIEW.md
3. Check browser console for errors
4. Review Firestore security rules
5. Test with different user roles

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-24 | Initial comprehensive documentation for AI assistants |

---

**END OF CLAUDE.MD**

This document provides complete context for AI assistants (like Claude) to understand the codebase structure, development workflows, and key conventions. Always keep this file updated when making significant architectural changes.
