# FUEL & VEHICLE MANAGEMENT SYSTEM
## Project Specification for Claude Code Handoff

**Project Status:** 50% Complete (Driver PWA in progress)  
**Last Updated:** January 2025  
**Developer:** Beginner (learning Firebase + Web Development)

---

## 🎯 PROJECT OVERVIEW

### Purpose
Build a system to track fuel consumption, manage Driver's Trip Tickets (DTTs), automate Requisition and Issuance Slips (RISs), and monitor "Fuel by Contract" balance for DepEd Caraga Region.

### Primary Goals
1. Track "Fuel by Contract" balance in real-time (PHP amount)
2. Automate COA-compliant audit trail by linking DTTs to RISs
3. Streamline physical workflow between Driver, EMD, and SPMS
4. Monitor fuel efficiency (km/L) to detect excessive consumption
5. Separate authorization to travel (DTT) from fuel withdrawal (RIS)

### System Philosophy
**"Preparation and Finalization Tool"** - Supports physical, signature-based workflow with digital tracking. Three user types manage two interconnected processes: Travel (DTTs) and Fuel Issuance (RISs).

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────┐
│         FIREBASE BACKEND (Cloud)                │
├─────────────────────────────────────────────────┤
│  • Firestore Database (NoSQL)                   │
│  • Firebase Authentication                      │
│  • Cloud Functions (auto-calculations)          │
│  • Firebase Storage (PDF documents)             │
│  • Firebase Hosting (PWA deployment)            │
└─────────────────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ DRIVER │  │  EMD   │  │  SPMS  │
    │  PWA   │  │ Google │  │ Google │
    │  (Web) │  │ Sheets │  │ Sheets │
    │        │  │ Modal  │  │ Modal  │
    └────────┘  └────────┘  └────────┘
```

### User Roles & Interfaces

**1. DRIVER (Vehicle Operator)**
- Interface: Progressive Web App (PWA)
- Technology: HTML/JavaScript/Tailwind CSS
- Hosting: Firebase Hosting
- URL: https://fuel-vehicle-management.web.app
- Actions:
  - Create DTT (Driver's Trip Ticket)
  - Request fuel (if needed)
  - Close DTT (end trip with odometer reading)
  - View trip history

**2. EMD STAFF (Equipment Management Division)**
- Interface: Google Apps Script Custom Modal
- Technology: HTML/JavaScript/Tailwind CSS
- Hosting: Google Sheets (bound script)
- Actions:
  - Validate fuel requests
  - Check "Matrix Distance" (destination vs fuel quantity)
  - Print Temporary RIS (with Temporary Ref No.)
  - Manage Price Master Table (weekly fuel prices)

**3. SPMS STAFF (Supply & Property Management Section)**
- Interface: Google Apps Script Custom Modal
- Technology: HTML/JavaScript/Tailwind CSS
- Hosting: Google Sheets (bound script)
- Actions:
  - Finalize RIS (generate Real RIS Number)
  - Deduct from "Fuel by Contract" balance
  - Manage contracts
  - View dashboard (contract balance, statistics)

---

## 💾 FIREBASE CONFIGURATION

**Project Details:**
```javascript
Project ID: fuel-vehicle-management
Project Name: Fuel & Vehicle Management

Firebase Config:
{
  apiKey: "AIzaSyDTPngeGZviiOjv3N1V_wPTGvRUVFOPa14",
  authDomain: "fuel-vehicle-management.firebaseapp.com",
  projectId: "fuel-vehicle-management",
  storageBucket: "fuel-vehicle-management.firebasestorage.app",
  messagingSenderId: "821758027736",
  appId: "1:821758027736:web:3b1924046e73cb0c9434ad"
}
```

**Enabled Services:**
- ✅ Firestore Database (production mode)
- ✅ Authentication (Email/Password)
- ✅ Hosting
- ⏳ Cloud Functions (to be deployed)
- ⏳ Storage (for PDFs - future)

**Security Rules (Current - Development Mode):**
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

---

## 📊 DATABASE STRUCTURE (FIRESTORE COLLECTIONS)

### 1. **users** Collection
User accounts with role-based access.

```javascript
users/{userId}
├── userId: "auth_uid_12345" (string)
├── email: "driver@depedcaraga.ph" (string)
├── role: "driver" | "emd" | "spms" (string)
├── firstName: "Juan" (string)
├── lastName: "Dela Cruz" (string)
├── phoneNumber: "+639171234567" (string)
├── assignedVehicles: ["H1 5750"] (array) // For drivers only
├── status: "Active" | "Inactive" (string)
├── createdAt: Timestamp
└── lastLogin: Timestamp
```

---

### 2. **vehicles** Collection
Master data for all vehicles with current fuel status.

```javascript
vehicles/{plateNo}
├── plateNo: "H1 5750" (string) // Document ID and field
├── vehicleType: "Sedan" (string)
├── brand: "Toyota" (string)
├── model: "Vios" (string)
├── fuelType: "Diesel" | "Gasoline" (string)
├── tankCapacity: 60 (number) // Liters
├── currentFuelBalance: 43.5 (number) // Real-time balance
├── standardKmPerLiter: 10.5 (number) // Expected efficiency
├── status: "Active" | "Under Repair" | "Retired" (string)
├── lastOdometerReading: 12500 (number)
├── lastUpdated: Timestamp
└── createdAt: Timestamp
```

**Business Logic:**
- `currentFuelBalance` updated by Cloud Functions when:
  - DTT is closed (fuel used calculated)
  - RIS is finalized (fuel added)

---

### 3. **dtts** Collection (Driver's Trip Tickets)
All travel authorizations initiated by drivers.

```javascript
dtts/{dttId}
├── dttId: "DTT_1736217600000" (string) // Auto-generated: DTT_timestamp
├── driverUid: "auth_uid_12345" (string)
├── driverEmail: "driver@test.com" (string)
├── driverName: "Juan Dela Cruz" (string)
├── plateNo: "H1 5750" (string)
│
// Trip Details
├── purpose: "Official travel to conduct training" (string)
├── destination: "Butuan City" (string)
│
// Odometer & Fuel
├── odometerStart: 12000 (number) // km
├── odometerEnd: 12100 (number) // km, null until closed
├── distanceTraveled: 100 (number) // Auto-calculated
├── fuelBalanceStart: 45.0 (number) // Liters
├── fuelBalanceEnd: 35.0 (number) // Auto-calculated
├── fuelUsed: 10.0 (number) // Auto-calculated
├── kmPerLiter: 10.0 (number) // Auto-calculated
│
// Fuel Request (Optional)
├── requestFuel: true (boolean)
├── requisitionQty: 50 (number) // Liters requested
├── linkedRisId: "RIS_1736217700000" (string) // Null until RIS created
│
// Status & Timestamps
├── status: "Draft" | "Approved" | "In-Progress" | "Closed" (string)
├── createdAt: Timestamp
├── updatedAt: Timestamp
└── closedAt: Timestamp
```

**Status Flow:**
1. **Draft** → Driver creates DTT
2. **Approved** → Gets offline signature (Division Chief)
3. **In-Progress** → Driver starts trip
4. **Closed** → Driver enters end odometer

---

### 4. **risRequests** Collection (Requisition & Issuance Slips)
All fuel issuance requests from initiation to finalization.

```javascript
risRequests/{risId}
├── risId: "RIS_1736217700000" (string) // Auto-generated
│
// Link to DTT
├── linkedDttId: "DTT_1736217600000" (string) // Null for standalone
├── plateNo: "H1 5750" (string)
├── purpose: "Official travel to Butuan City" (string)
│
// Requester
├── requestedBy: "Juan Dela Cruz" (string)
├── requestedByUid: "auth_uid_12345" (string)
├── requestedAt: Timestamp
│
// Quantities
├── requisitionQty: 50 (number) // Liters requested
├── issuanceQty: 50 (number) // Approved by EMD (can be adjusted)
│
// Temporary RIS Stage (EMD)
├── temporaryRefNo: "8112" (string) // Sequential counter
├── validatedBy: "David Hidalgo" (string)
├── validatedByUid: "auth_uid_emd_001" (string)
├── validatedAt: Timestamp
│
// Final RIS Stage (SPMS)
├── realRisNo: "2025 01 0001" (string) // Format: YYYY MM ####
├── contractId: "CONTRACT_2024_001" (string)
├── contractNo: "2024-FUEL-001" (string)
│
// Financial Calculations (Auto-calculated by Cloud Function)
├── pricePerLiter: 75.50 (number) // From priceMaster
├── totalCost: 3775.00 (number) // issuanceQty * pricePerLiter
├── lastIssuance: {
│   ├── risNo: "2025 01 0000" (string)
│   ├── qty: 57.505 (number)
│   └── date: Timestamp
│   }
├── contractBalanceBefore: 500000.00 (number)
├── contractBalanceAfter: 496225.00 (number)
│
// SPMS Info
├── finalizedBy: "Rhodelyn Orlanda" (string)
├── finalizedByUid: "auth_uid_spms_001" (string)
├── finalizedAt: Timestamp
│
// Status
├── status: "Pending" | "Temporary" | "Finalized" | "Cancelled" (string)
│
// Documents (URLs to Firebase Storage)
├── temporaryPdfUrl: "https://storage.../temp_ris_8112.pdf" (string)
├── finalPdfUrl: "https://storage.../final_ris_2025_01_0001.pdf" (string)
│
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

**Status Flow:**
1. **Pending** → Driver requests fuel
2. **Temporary** → EMD validates, prints Temporary RIS
3. **Finalized** → SPMS approves, generates Real RIS No., deducts from contract
4. **Cancelled** → Request rejected (with reason)

---

### 5. **contracts** Collection (Fuel by Contract)
Master data for fuel supply contracts.

```javascript
contracts/{contractId}
├── contractId: "CONTRACT_2024_001" (string)
├── contractNo: "2024-FUEL-001" (string) // Display reference
├── supplierName: "Petron Corporation" (string)
│
// Financial
├── totalContractAmount: 500000.00 (number) // PHP original
├── currentBalance: 496225.00 (number) // Real-time (updated by Cloud Function)
├── totalUsed: 3775.00 (number) // Sum of all finalized RISs
│
// Contract Period
├── startDate: Timestamp
├── endDate: Timestamp
├── status: "Active" | "Depleted" | "Expired" (string)
│
// Tracking
├── fuelType: "Diesel" | "Gasoline" | "Both" (string)
├── totalLitersIssued: 50 (number)
├── numberOfIssuances: 1 (number)
├── lastIssuanceDate: Timestamp
├── lastIssuanceRisNo: "2025 01 0001" (string)
│
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

---

### 6. **priceMaster** Collection
Weekly fuel price updates (every Tuesday).

```javascript
priceMaster/{priceId}
├── priceId: "PRICE_20250107" (string) // Date-based ID
├── effectiveDate: Timestamp // Tuesday of the week
├── diesel: 75.50 (number) // PHP per liter
├── gasoline: 68.30 (number)
├── enteredBy: "David Hidalgo" (string)
├── enteredByUid: "auth_uid_emd_001" (string)
├── createdAt: Timestamp
└── source: "DOE Oil Monitor" (string)
```

---

### 7. **ledger** Collection
Transaction history for all fuel movements.

```javascript
ledger/{ledgerId}
├── ledgerId: "LEDGER_1736217800000" (string)
├── transactionDate: Timestamp
├── transactionType: "Fuel Added" | "Fuel Used" | "DTT Closed" (string)
│
// Vehicle Info
├── plateNo: "H1 5750" (string)
│
// Fuel Changes
├── litersChange: 50.0 (number) // Positive for added, negative for used
├── balanceBefore: 5.0 (number)
├── balanceAfter: 55.0 (number)
│
// Financial (for Fuel Added only)
├── pricePerLiter: 75.50 (number)
├── totalCost: 3775.00 (number)
├── contractBalanceBefore: 500000.00 (number)
├── contractBalanceAfter: 496225.00 (number)
│
// References
├── referenceId: "RIS_1736217700000" (string)
├── referenceType: "RIS" | "DTT" (string)
├── referenceNo: "2025 01 0001" (string)
│
// Actors
├── performedBy: "Juan Dela Cruz" (string)
├── performedByUid: "auth_uid_12345" (string)
├── performedByRole: "driver" | "emd" | "spms" (string)
│
└── createdAt: Timestamp
```

---

### 8. **systemCounters** Collection
Auto-incrementing counters for sequential IDs.

```javascript
systemCounters/risCounter
├── year: 2025 (number)
├── month: 1 (number)
├── count: 1 (number) // Last RIS number issued (resets monthly)

systemCounters/temporaryRisCounter
├── count: 8112 (number) // Global counter (never resets)
```

---

## 🔄 THE 3 WORKFLOWS (SENARYO)

### SENARYO 1: DTT Only (No Fuel Request)

**Use Case:** Driver has enough fuel, no refueling needed.

**Steps:**
1. **Driver (PWA):**
   - Creates new DTT
   - Selects vehicle (sees fuel balance: 45L)
   - Enters purpose, destination, odometer start
   - Does NOT check "Request Fuel"
   - Submits

2. **Firestore:**
   ```javascript
   dtts/DTT_xxx {
     status: "Draft",
     requestFuel: false,
     fuelBalanceStart: 45.0
   }
   ```

3. **Offline:**
   - Driver gets signature from Division Chief
   - Performs trip

4. **Driver (PWA) - After Trip:**
   - Opens "My Trips"
   - Selects the DTT
   - Clicks "Close Trip"
   - Enters odometer end: 12100 km
   - System calculates:
     - Distance: 100 km
     - Fuel used: 100 / 10 = 10L
     - New balance: 45 - 10 = 35L
     - Fuel efficiency: 10 km/L

5. **Cloud Function Trigger (onDttClosed):**
   - Updates `vehicles/H1_5750`:
     ```javascript
     currentFuelBalance: 35.0
     lastOdometerReading: 12100
     ```
   - Creates ledger entry:
     ```javascript
     transactionType: "Fuel Used"
     litersChange: -10.0
     ```

**Result:** Trip completed, fuel balance updated, no RIS involved.

---

### SENARYO 2: DTT + RIS (Main Workflow)

**Use Case:** Driver needs fuel for authorized trip.

**Steps:**
1. **Driver (PWA):**
   - Creates new DTT
   - Sees fuel balance: 5L (Low!)
   - Checks "Request Fuel" ✅
   - Enters 50L needed
   - Submits

2. **Cloud Function (onDttCreated):**
   - Auto-creates RIS request:
     ```javascript
     risRequests/RIS_xxx {
       linkedDttId: "DTT_xxx",
       status: "Pending",
       requisitionQty: 50
     }
     ```
   - Links to DTT:
     ```javascript
     dtts/DTT_xxx {
       linkedRisId: "RIS_xxx"
     }
     ```

3. **Offline:**
   - Driver prints Draft DTT
   - Gets signature from Division Chief
   - Goes to EMD office with signed DTT

4. **EMD Staff (GAS Modal):**
   - Logs into Google Sheets
   - Opens custom modal
   - Sees "Pending Fuel Requests"
   - Clicks on RIS_xxx
   - Validates:
     - Checks signature (offline)
     - Checks "Matrix Distance" (Butuan = 120km)
     - Approves 50L
   - Clicks "Print Temporary RIS"
   - System generates:
     - Temporary Ref No: 8112
     - Status: "Temporary"
   - Prints PDF with Temp Ref No

5. **Offline:**
   - Driver takes Temporary RIS to SPMS office

6. **SPMS Staff (GAS Modal):**
   - Logs into Google Sheets
   - Opens custom modal
   - Sees "Temporary RIS for Finalization"
   - Clicks on Temp Ref 8112
   - Selects contract: "2024-FUEL-001"
   - System auto-calculates:
     - Latest price: ₱75.50/L (from priceMaster)
     - Total cost: 50 × 75.50 = ₱3,775
     - Contract balance: ₱500,000
     - Balance after: ₱496,225
     - Last issuance: RIS 2025 01 0000
   - Verifies calculations
   - Clicks "Finalize & Print RIS"

7. **Cloud Function (onRisFinalized):**
   - Generates Real RIS No: "2025 01 0001"
   - Updates RIS:
     ```javascript
     status: "Finalized",
     realRisNo: "2025 01 0001",
     pricePerLiter: 75.50,
     totalCost: 3775.00
     ```
   - Updates contract:
     ```javascript
     currentBalance: 496225.00,
     totalUsed: 3775.00
     ```
   - Updates vehicle:
     ```javascript
     currentFuelBalance: 55.0  // 5 + 50
     ```
   - Creates ledger entry:
     ```javascript
     transactionType: "Fuel Added",
     litersChange: +50.0
     ```

8. **Offline:**
   - Driver receives notification
   - Takes Final RIS to gas station
   - Gets 50L of fuel
   - Performs trip

9. **Driver (PWA) - After Trip:**
   - Closes DTT (enters end odometer)
   - System calculates fuel used
   - Updates balance: 55 - 10 = 45L

**Result:** Complete workflow, all data tracked, audit trail created.

---

### SENARYO 3: RIS Only (No DTT)

**Use Case A:** Additional fuel mid-trip  
**Use Case B:** Fuel for non-vehicle (generator)

**Steps (Case A - Additional Fuel):**
1. Driver realizes 50L not enough mid-trip
2. Creates standalone fuel request (30L more)
3. System links to existing DTT
4. EMD validates (no new signature needed - already approved trip)
5. SPMS finalizes
6. New RIS generated
7. Vehicle balance updated: +30L

**Steps (Case B - Generator):**
1. Staff creates standalone fuel request
2. Purpose: "Fuel for generator set"
3. No vehicle linked (plateNo: null)
4. Gets signature from Division Chief
5. EMD validates quantity
6. SPMS finalizes
7. Contract deducted, no vehicle update

---

## 📁 PROJECT FILE STRUCTURE

### Current Structure (Driver PWA)

```
driver-pwa/
├── index.html              ✅ COMPLETE (Login + Dashboard)
├── create-dtt.html         ✅ COMPLETE (New trip form)
├── my-trips.html          ✅ COMPLETE (Trip list with tabs)
├── close-dtt.html         ⏳ TODO (End trip form)
├── request-fuel.html      ⏳ TODO (Standalone fuel request)
├── profile.html           ⏳ TODO (User profile)
│
├── manifest.json          ✅ COMPLETE (PWA config)
├── service-worker.js      ✅ COMPLETE (Offline support)
├── firebase.json          ✅ COMPLETE (Hosting config)
├── .firebaserc            ✅ COMPLETE (Project config)
│
└── .gitignore             ⏳ TODO (Git ignore file)
```

### Future Structure (EMD/SPMS - Google Apps Script)

```
Google Apps Script Project/
├── Code.gs                   (Server-side functions)
│
├── SHARED:
│   ├── Main.html            (Container)
│   ├── navigation.html      (Navbar)
│   ├── styles.html          (Tailwind CSS)
│   └── firebase-config.html (Firebase SDK)
│
├── EMD INTERFACE:
│   ├── emd-dashboard.html
│   ├── emd-pending-ris.html
│   ├── emd-validate-ris.html
│   └── emd-price-master.html
│
├── SPMS INTERFACE:
│   ├── spms-dashboard.html
│   ├── spms-finalize-ris.html
│   ├── spms-contracts.html
│   └── spms-reports.html
│
└── MODALS:
    ├── modal-validate-ris.html
    ├── modal-finalize-ris.html
    └── modal-success.html
```

---

## 🎨 UI/UX DESIGN STANDARDS

### Design System (Tailwind CSS)

**Colors:**
```css
Primary Blue:    #2196F3  (bg-blue-600)
Orange:          #FF9800  (bg-orange-600)
Green:           #4CAF50  (bg-green-600)
Red:             #F44336  (bg-red-600)
Gray:            #6B7280  (text-gray-600)
```

**Component Patterns:**

**1. Stat Cards:**
```html
<div class="bg-white rounded-lg shadow-md p-4">
  <div class="text-3xl font-bold text-blue-600">15</div>
  <div class="text-sm text-gray-600">My Trips</div>
</div>
```

**2. Form Inputs:**
```html
<input type="text" 
       class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
       placeholder="Enter destination">
```

**3. Buttons:**
```html
<!-- Primary -->
<button class="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition">
  ✓ Submit
</button>

<!-- Secondary -->
<button class="w-full bg-white text-blue-600 py-4 rounded-lg font-semibold shadow-md border-2 border-blue-600 hover:bg-blue-50 transition">
  📋 View
</button>
```

**4. Status Badges:**
```html
<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
  Approved
</span>
```

**5. Navigation:**
```html
<!-- Top Bar -->
<div class="bg-blue-600 text-white p-4 shadow-lg flex items-center">
  <button onclick="goBack()" class="mr-3">
    <span class="text-2xl">←</span>
  </button>
  <h1 class="text-xl font-bold">Page Title</h1>
</div>

<!-- Bottom Navigation -->
<div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
  <div class="flex justify-around py-3">
    <button class="flex flex-col items-center text-blue-600">
      <span class="text-2xl">🏠</span>
      <span class="text-xs">Home</span>
    </button>
  </div>
</div>
```

---

## ⚙️ CRITICAL BUSINESS RULES

### Rule 1: Sequential Numbering

**RIS Real Number Format:** `YYYY MM ####`
- YYYY: Year (2025)
- MM: Month (01-12)
- ####: Sequential counter (resets monthly)
- Example: `2025 01 0001`, `2025 01 0002`

**Temporary RIS Number:**
- Global sequential counter (never resets)
- Simple integer: 8112, 8113, 8114...
- Used for internal tracking only

**Implementation:**
```javascript
// Cloud Function
function generateRealRisNo() {
  const counterRef = db.doc('systemCounters/risCounter');
  return db.runTransaction(async (t) => {
    const doc = await t.get(counterRef);
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    
    let count = 1;
    if (doc.data().year === year && doc.data().month === month) {
      count = (doc.data().count || 0) + 1;
    }
    
    t.update(counterRef, {year, month, count});
    
    const paddedCount = String(count).padStart(4, '0');
    const paddedMonth = String(month).padStart(2, '0');
    return `${year} ${paddedMonth} ${paddedCount}`;
  });
}
```

---

### Rule 2: Fuel Balance Calculation

**Vehicle Fuel Balance = Real-Time Tracking**

**Formula:**
```
New Balance = Current Balance + Fuel Added (RIS) - Fuel Used (DTT)
```

**Fuel Used Calculation:**
```javascript
fuelUsed = distanceTraveled / standardKmPerLiter

// Example:
distance = 100 km
standardKmPerLiter = 10
fuelUsed = 100 / 10 = 10 liters
```

**Fuel Efficiency (km/L):**
```javascript
kmPerLiter = distanceTraveled / fuelUsed
```

**Alert Threshold:**
- If `kmPerLiter < (standardKmPerLiter * 0.8)` → Alert EMD
- Example: If standard is 10 km/L, alert if below 8 km/L

---

### Rule 3: Contract Balance Management

**Contract Balance = Real-Time PHP Amount**

**Deduction:**
```javascript
totalCost = issuanceQty * pricePerLiter
newBalance = currentBalance - totalCost

// Example:
issuanceQty = 50 liters
pricePerLiter = 75.50 PHP
totalCost = 50 * 75.50 = 3,775.00 PHP
newBalance = 500,000 - 3,775 = 496,225.00 PHP
```

**Validation:**
```javascript
if (newBalance < 0) {
  throw new Error('Insufficient contract balance');
}
```

**Status Updates:**
- `currentBalance <= 0` → status = "Depleted"
- `endDate < today` → status = "Expired"

---

### Rule 4: Price Master Logic

**Weekly Price Updates (Every Tuesday):**
- EMD enters new prices every Tuesday
- System uses **most recent** price when calculating RIS costs
- Price at time of finalization is stored in RIS document

**Fetch Latest Price:**
```javascript
async function getLatestPrice(fuelType) {
  const snapshot = await db.collection('priceMaster')
    .orderBy('effectiveDate', 'desc')
    .limit(1)
    .get();
  
  const latestPrice = snapshot.docs[0].data();
  return latestPrice[fuelType.toLowerCase()]; // 'diesel' or 'gasoline'
}
```

---

### Rule 5: Audit Trail Requirements

**Every Critical Action Must:**
1. Create ledger entry
2. Include actor info (who, when, role)
3. Include before/after values
4. Be immutable (never delete, only status update)

**Ledger Entry Template:**
```javascript
{
  transactionType: "Fuel Added",
  transactionDate: serverTimestamp(),
  plateNo: "H1 5750",
  litersChange: 50.0,
  balanceBefore: 5.0,
  balanceAfter: 55.0,
  pricePerLiter: 75.50,
  totalCost: 3775.00,
  referenceId: "RIS_xxx",
  referenceType: "RIS",
  performedBy: "Juan Dela Cruz",
  performedByUid: "auth_uid_xxx",
  performedByRole: "driver"
}
```

---

## 🚀 CURRENT PROJECT STATUS

### ✅ COMPLETED (50%)

**Infrastructure:**
- ✅ Firebase project created
- ✅ Firestore database enabled
- ✅ Authentication enabled (Email/Password)
- ✅ Firebase Hosting configured
- ✅ PWA deployed and accessible
- ✅ Test user created (driver1@test.com)

**Driver PWA:**
- ✅ Login/Logout functionality
- ✅ Dashboard (home page with stats)
- ✅ Create DTT page (full form with validation)
- ✅ My Trips page (list with Active/Closed tabs)
- ✅ Vehicle dropdown loads from Firestore
- ✅ Fuel balance display
- ✅ Request fuel checkbox functionality

**Database:**
- ✅ Sample vehicle added (H1 5750)
- ✅ Security rules configured (allow authenticated users)
- ✅ DTT documents saving correctly

---

### ⏳ IN PROGRESS (Next Tasks)

**Driver PWA:**
1. **Close DTT Page** (High Priority)
   - Form to enter end odometer
   - Calculate distance, fuel used, km/L
   - Update DTT status to "Closed"
   - Trigger Cloud Function to update vehicle balance

2. **Standalone Fuel Request** (Medium Priority)
   - Page to request fuel without DTT
   - Link to existing DTT (optional)
   - For "additional fuel" or "non-vehicle" scenarios

3. **Profile Page** (Low Priority)
   - User info display
   - Change password
   - Logout

---

### 📋 TODO (Remaining 50%)

**Cloud Functions (Backend Logic):**
- ⏳ `onDttCreated` - Auto-create RIS if fuel requested
- ⏳ `onDttClosed` - Update vehicle fuel balance, create ledger entry
- ⏳ `onRisFinalized` - Update vehicle balance, contract balance, create ledger
- ⏳ `generateRealRisNo` - Sequential RIS number generation
- ⏳ `checkContractExpiry` - Daily check for expired contracts
- ⏳ `checkLowFuelEfficiency` - Alert EMD if km/L below threshold

**EMD Interface (Google Apps Script):**
- ⏳ Dashboard (pending requests count, stats)
- ⏳ Pending Fuel Requests page
- ⏳ Validate RIS modal
- ⏳ Print Temporary RIS (PDF generation)
- ⏳ Price Master management
- ⏳ km/L monitoring report

**SPMS Interface (Google Apps Script):**
- ⏳ Dashboard (contract balance, statistics)
- ⏳ Finalize RIS page
- ⏳ Auto-calculations display
- ⏳ Print Final RIS (PDF generation)
- ⏳ Contract management (CRUD)
- ⏳ Reports (ledger, RIS summary)

**Reports & Analytics:**
- ⏳ Vehicle ledger (transaction history)
- ⏳ Contract usage report
- ⏳ Fuel efficiency report
- ⏳ Excel export functionality

**Master Data:**
- ⏳ Add more vehicles
- ⏳ Add contracts
- ⏳ Add price history
- ⏳ User management (create EMD/SPMS accounts)

---

## 🎯 DEVELOPMENT PRIORITIES

### Phase 1: Complete Driver PWA (Week 1-2)
1. Build "Close DTT" page
2. Build "Standalone Fuel Request" page
3. Test full driver workflow (create → close)
4. Deploy and verify on mobile

### Phase 2: Cloud Functions (Week 3)
1. Write all Cloud Functions
2. Deploy to Firebase
3. Test triggers (onCreate, onUpdate)
4. Verify calculations (fuel balance, contract deduction)

### Phase 3: EMD Interface (Week 4)
1. Create Google Apps Script project
2. Build EMD dashboard
3. Build validate RIS workflow
4. Implement PDF generation (Temporary RIS)

### Phase 4: SPMS Interface (Week 5)
1. Build SPMS dashboard
2. Build finalize RIS workflow
3. Implement auto-calculations
4. Implement PDF generation (Final RIS)

### Phase 5: Testing & Refinement (Week 6)
1. End-to-end testing (all 3 scenarios)
2. Bug fixes
3. Performance optimization
4. User training materials

---

## 🔧 TECHNICAL NOTES

### Date/Time Handling
- **Timezone:** Asia/Manila (UTC+8)
- **Display Format:** MM/DD/YYYY
- **Storage:** Always use Firestore Timestamps

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

### Error Handling Pattern

```javascript
try {
  // Firestore operation
  await db.collection('dtts').doc(dttId).set(data);
  
  // Success feedback
  alert('✓ Success!');
} catch (error) {
  console.error('Error:', error);
  alert('Error: ' + error.message);
}
```

---

### Loading States

```html
<!-- Show while loading -->
<div id="loading" class="p-4 text-center">
  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  <p class="text-gray-600 mt-2">Loading...</p>
</div>

<!-- Hide after data loads -->
<script>
document.getElementById('loading').classList.add('hidden');
</script>
```

---

### Cache Busting Reminder
**ALWAYS hard refresh after deploying:**
- Desktop: `Ctrl + Shift + R`
- Mobile: Clear browser cache
- This is the #1 cause of "code not updating"!

---

## 📚 HELPFUL RESOURCES

**Firebase Documentation:**
- Firestore: https://firebase.google.com/docs/firestore
- Cloud Functions: https://firebase.google.com/docs/functions
- Hosting: https://firebase.google.com/docs/hosting

**Tailwind CSS:**
- Docs: https://tailwindcss.com/docs
- Components: https://tailwindui.com/components

**Google Apps Script:**
- Guides: https://developers.google.com/apps-script/guides
- HTML Service: https://developers.google.com/apps-script/guides/html

---

## 🎯 KEY COMMANDS

### Firebase Deployment
```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

### Local Testing
```bash
# Serve locally (PWA)
firebase serve

# Test functions locally
firebase emulators:start
```

### Git (Version Control)
```bash
# Initialize repo
git init

# Add all files
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin main
```

---

## 🆘 COMMON ISSUES & SOLUTIONS

### Issue 1: "Permission Denied" in Firestore
**Solution:** Check Security Rules, ensure authenticated

### Issue 2: "API Key Not Valid"
**Solution:** Clear cache (`Ctrl + Shift + R`), check config

### Issue 3: Dropdown Not Loading
**Solution:** Check Firestore has data, check console for errors

### Issue 4: "Changes Not Showing"
**Solution:** Clear browser cache, hard refresh

### Issue 5: Firebase CLI Not Found
**Solution:** `npm install -g firebase-tools`

---

## 💡 DEVELOPMENT TIPS

1. **Test in Incognito Mode** - Avoids cache issues
2. **Use Console Logs** - `console.log()` everywhere
3. **Check Firebase Console** - Verify data was saved
4. **One Feature at a Time** - Don't build everything at once
5. **Git Commit Often** - Save progress frequently
6. **Mobile Test Early** - Check on phone regularly
7. **Read Error Messages** - They usually tell you what's wrong
8. **Hard Refresh Always** - After every deploy

---

## 📞 PROJECT CONTACTS

**Developer:** Beginner (Learning Phase)  
**Organization:** DepEd Caraga Region  
**Purpose:** Internal Fuel Management System  
**Timeline:** 6 weeks (from setup to deployment)

---

## 🎯 HANDOFF TO CLAUDE CODE

**When switching to Claude Code, provide this context:**

1. **Current Status:**
   - Driver PWA 50% complete
   - Need to finish "Close DTT" page
   - Need to build Cloud Functions
   - Need to build EMD/SPMS interfaces

2. **Repository Location:**
   - Local: `Desktop/driver-pwa/`
   - Firebase Project: `fuel-vehicle-management`
   - Hosting URL: https://fuel-vehicle-management.web.app

3. **Key Files to Work On:**
   - `close-dtt.html` (next task)
   - Cloud Functions (to be created)
   - Google Apps Script (future)

4. **Important Constraints:**
   - Developer is beginner - needs clear explanations
   - Always use Tailwind CSS for styling
   - Follow existing UI patterns
   - Test on mobile (PWA)
   - Asia/Manila timezone
   - MM/DD/YYYY date format

---

**END OF SPECIFICATION DOCUMENT**

This document should give Claude Code (or any developer) complete context to continue building the system.
