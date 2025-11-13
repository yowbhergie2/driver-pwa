# FUEL & VEHICLE MANAGEMENT SYSTEM
## Complete Technical Specification Document

---

## SYSTEM OVERVIEW

Build a comprehensive **Fuel & Vehicle Management System** to track fuel consumption, manage Driver's Trip Tickets (DTTs), automate Requisition and Issuance Slips (RISs), monitor the "Fuel by Contract" balance, and enforce COA-compliant audit trails for DepEd Caraga Region.

### Primary Goals:
1. **Track "Fuel by Contract" balance** in real-time based on PHP amount
2. **Automate COA-compliant audit trail** by linking DTTs to RISs
3. **Streamline physical workflow** between Driver, EMD, and SPMS
4. **Automate calculations** (Last Issuance, Total Stock after Issuance)
5. **Monitor fuel efficiency** (km/L) to detect excessive consumption
6. **Separate authorization to travel (DTT)** from withdrawal of fuel (RIS)
7. **Create digital link** between DTTs and RISs when fuel is needed

### System Philosophy:
This is a **"Preparation and Finalization"** tool that supports a physical, signature-based workflow with three user types managing two interconnected processes: **Travel (DTTs)** and **Fuel Issuance (RISs)**.

---

## TECHNOLOGY STACK

### Driver Interface
- **Platform:** Flutter Mobile App (iOS + Android)
- **Authentication:** Firebase Authentication (Email/Password or Phone)
- **UI Framework:** Flutter Material Design + Custom Tailwind-inspired styling
- **Offline Support:** Local SQLite cache with Firebase sync
- **Push Notifications:** Firebase Cloud Messaging (FCM)

### EMD & SPMS Staff Interface
- **Platform:** Google Apps Script HTML Service (Custom Modals)
- **UI Framework:** Tailwind CSS
- **Deployment:** Bound to Google Sheets
- **Authentication:** Google Account (shared Firebase auth via REST)

### Backend & Database
- **Database:** Firebase Firestore (NoSQL)
- **Server Logic:** Cloud Functions for Firebase (auto-calculations)
- **File Storage:** Firebase Storage (PDF documents)
- **Authentication:** Firebase Auth with custom claims (roles)
- **API:** REST API for GAS integration

### Reporting & Export
- **PDF Generation:** jsPDF library (for DTTs and RISs)
- **Excel Export:** SheetJS library (xlsx.js)
- **Date/Time:** Asia/Manila timezone
- **Date Format:** MM/DD/YYYY for display

---

## DATABASE STRUCTURE (FIRESTORE COLLECTIONS)

### A. **users** Collection
User accounts with role-based access control.

```javascript
users/{userId}
├── userId: "auth_uid_12345"
├── email: "driver@depedcaraga.ph"
├── role: "driver" | "emd" | "spms"
├── firstName: "Juan"
├── lastName: "Dela Cruz"
├── middleName: "Santos"
├── phoneNumber: "+639171234567"
├── assignedVehicles: ["H1 5750", "H1 5751"]  // For drivers only
├── office: "Regional Office"
├── position: "Administrative Assistant III"
├── status: "Active" | "Inactive"
├── createdAt: Timestamp
├── lastLogin: Timestamp
└── profilePhotoUrl: "https://..."
```

**Indexes Required:**
- Composite: `role` ASC, `status` ASC
- Single: `email` ASC

---

### B. **vehicles** Collection
Master data for all vehicles with current fuel status.

```javascript
vehicles/{plateNo}
├── plateNo: "H1 5750"  // Document ID and field
├── vehicleType: "Sedan" | "Van" | "Motorcycle" | "Truck"
├── brand: "Toyota"
├── model: "Vios"
├── yearModel: 2020
├── fuelType: "Diesel" | "Gasoline"
├── tankCapacity: 60  // Liters
├── currentFuelBalance: 43.5  // Liters (real-time)
├── standardKmPerLiter: 10.5  // For comparison
├── status: "Active" | "Under Repair" | "Retired"
├── assignedDriver: "auth_uid_12345"  // Current driver
├── lastOdometerReading: 12500
├── lastUpdated: Timestamp
├── createdAt: Timestamp
└── remarks: "Regular maintenance on MM/DD/YYYY"
```

**Business Rules:**
- `currentFuelBalance` is updated by Cloud Functions after:
  - DTT is closed (fuel used calculated)
  - RIS is finalized (fuel added)
- `plateNo` is unique and serves as document ID

---

### C. **dtts** (Driver's Trip Tickets) Collection
All travel authorizations initiated by drivers.

```javascript
dtts/{dttId}
├── dttId: "DTT_20250107_001"  // Auto-generated
├── driverUid: "auth_uid_12345"
├── driverName: "Juan Dela Cruz"
├── plateNo: "H1 5750"
├── purpose: "Official travel to conduct training"
├── destination: "Butuan City"
├── passengers: ["Maria Santos", "Pedro Reyes"]
├── passengersCount: 2
│
├── odometerStart: 12000
├── odometerEnd: 12100  // Null until closed
├── distanceTraveled: 100  // Auto-calculated
│
├── fuelBalanceStart: 45.0  // Liters (from vehicle record)
├── fuelBalanceEnd: 35.0  // Auto-calculated after close
├── fuelUsed: 10.0  // Auto-calculated (distance / kmPerLiter)
├── kmPerLiter: 10.0  // Auto-calculated
│
├── timeOfDeparture: Timestamp
├── timeOfArrival: Timestamp  // Null until closed
│
├── requestFuel: true  // Checkbox
├── requisitionQty: 50  // Liters requested
├── linkedRisId: "RIS_20250107_001"  // Null until RIS created
│
├── status: "Draft" | "Approved" | "In-Progress" | "Closed"
├── approvedBy: "Bernard Calabazaron"  // Division Chief (offline signature)
├── approvedAt: Timestamp
│
├── createdAt: Timestamp
├── updatedAt: Timestamp
├── closedAt: Timestamp
└── remarks: "Additional remarks"
```

**Status Flow:**
1. **Draft** → Driver creates DTT
2. **Approved** → Gets offline signature from Division Chief
3. **In-Progress** → Driver starts trip
4. **Closed** → Driver enters end odometer

**Indexes Required:**
- Composite: `driverUid` ASC, `status` ASC, `createdAt` DESC
- Composite: `plateNo` ASC, `createdAt` DESC
- Single: `status` ASC

---

### D. **risRequests** (Requisition & Issuance Slips) Collection
All fuel issuance requests from initiation to finalization.

```javascript
risRequests/{risId}
├── risId: "RIS_20250107_001"  // Auto-generated
│
// Link to DTT (if applicable)
├── linkedDttId: "DTT_20250107_001"  // Null for non-vehicle requests
├── plateNo: "H1 5750"  // From DTT or manual entry
├── purpose: "Official travel to Butuan City"  // From DTT or manual
│
// Requester Info
├── requestedBy: "Juan Dela Cruz"
├── requestedByUid: "auth_uid_12345"
├── requestedAt: Timestamp
├── approvedBy: "Bernard Calabazaron"  // Division Chief (offline)
│
// Quantities
├── requisitionQty: 50  // Liters requested
├── issuanceQty: 50  // Liters approved by EMD (can be adjusted)
│
// Temporary RIS (EMD Stage)
├── temporaryRefNo: "8112"  // Sequential number for internal tracking
├── validatedBy: "David Hidalgo"  // EMD Staff name
├── validatedByUid: "auth_uid_emd_001"
├── validatedAt: Timestamp
│
// Final RIS (SPMS Stage)
├── realRisNo: "2025 10 1815"  // Format: YYYY MM ####
├── contractId: "CONTRACT_2024_001"
├── contractNo: "2024-FUEL-001"  // Display value
│
// Financial Calculations (auto-calculated by Cloud Function)
├── pricePerLiter: 75.50  // From priceMaster on finalization date
├── totalCost: 3775.00  // issuanceQty * pricePerLiter
├── lastIssuance: {
│   ├── risNo: "2025 10 1814"
│   ├── qty: 57.505
│   ├── date: Timestamp
│   └── plateNo: "H1 5751"
│   }
├── contractBalanceBefore: 500000.00  // PHP
├── contractBalanceAfter: 496225.00  // PHP (before - totalCost)
│
// SPMS Info
├── finalizedBy: "Rhodelyn Orlanda"  // SPMS Staff name
├── finalizedByUid: "auth_uid_spms_001"
├── finalizedAt: Timestamp
│
// Status
├── status: "Pending" | "Temporary" | "Finalized" | "Cancelled"
│
// Documents
├── draftPdfUrl: "https://storage.../draft_ris_8112.pdf"
├── temporaryPdfUrl: "https://storage.../temp_ris_8112.pdf"
├── finalPdfUrl: "https://storage.../final_ris_2025_10_1815.pdf"
│
├── createdAt: Timestamp
├── updatedAt: Timestamp
└── remarks: "Additional fuel for extended trip"
```

**Status Flow:**
1. **Pending** → Driver requests fuel (linked to DTT or standalone)
2. **Temporary** → EMD validates and prints Temporary RIS
3. **Finalized** → SPMS approves, generates Real RIS No., deducts from contract
4. **Cancelled** → Request rejected (with reason)

**Indexes Required:**
- Composite: `status` ASC, `createdAt` DESC
- Composite: `linkedDttId` ASC, `status` ASC
- Composite: `plateNo` ASC, `createdAt` DESC
- Single: `temporaryRefNo` ASC
- Single: `realRisNo` ASC

---

### E. **contracts** (Fuel by Contract) Collection
Master data for fuel supply contracts.

```javascript
contracts/{contractId}
├── contractId: "CONTRACT_2024_001"  // Auto-generated
├── contractNo: "2024-FUEL-001"  // Display/Reference number
├── supplierName: "Petron Corporation"
├── contactPerson: "Maria Santos"
├── contactNumber: "+639171234567"
│
// Financial Info
├── totalContractAmount: 500000.00  // PHP (original)
├── currentBalance: 496225.00  // PHP (real-time, updated by Cloud Function)
├── totalUsed: 3775.00  // PHP (sum of all finalized RISs)
│
// Contract Period
├── startDate: Timestamp
├── endDate: Timestamp
├── status: "Active" | "Depleted" | "Expired"
│
// Tracking
├── fuelType: "Diesel" | "Gasoline" | "Both"
├── totalLitersIssued: 50  // Sum of all issuanceQty
├── numberOfIssuances: 1  // Count of finalized RISs
├── lastIssuanceDate: Timestamp
├── lastIssuanceRisNo: "2025 10 1815"
│
├── createdAt: Timestamp
├── updatedAt: Timestamp
├── createdBy: "Rhodelyn Orlanda"
└── remarks: "Contract with Petron - Main Office"
```

**Business Rules:**
- `currentBalance` is updated by Cloud Function when RIS is finalized
- Status automatically changes to "Depleted" when `currentBalance` <= 0
- Status automatically changes to "Expired" when `endDate` is past

---

### F. **priceMaster** Collection
Weekly fuel price updates (every Tuesday).

```javascript
priceMaster/{priceId}
├── priceId: "PRICE_20250107"  // Date-based ID
├── effectiveDate: Timestamp  // Tuesday of the week
├── diesel: 75.50  // PHP per liter
├── gasoline: 68.30  // PHP per liter
├── enteredBy: "David Hidalgo"  // EMD or SPMS staff
├── enteredByUid: "auth_uid_emd_001"
├── createdAt: Timestamp
└── source: "DOE Oil Monitor" | "Petron Website" | "Manual Entry"
```

**Business Rules:**
- New price entry every Tuesday
- Cloud Function uses the **most recent** price when calculating RIS costs
- Price at time of finalization is stored in `risRequests.pricePerLiter`

**Indexes Required:**
- Single: `effectiveDate` DESC (for fetching latest price)

---

### G. **ledger** Collection
Transaction history for all fuel movements (DTTs and RISs).

```javascript
ledger/{ledgerId}
├── ledgerId: "LEDGER_20250107_001"  // Auto-generated
│
// Transaction Info
├── transactionDate: Timestamp
├── transactionType: "Fuel Added" | "Fuel Used" | "DTT Closed"
│
// Vehicle Info
├── plateNo: "H1 5750"
├── vehicleType: "Sedan"
│
// Fuel Changes
├── litersChange: 50.0  // Positive for added, negative for used
├── balanceBefore: 5.0
├── balanceAfter: 55.0
│
// Financial Info (for Fuel Added only)
├── pricePerLiter: 75.50
├── totalCost: 3775.00  // litersChange * pricePerLiter
├── contractBalanceBefore: 500000.00
├── contractBalanceAfter: 496225.00
│
// References
├── referenceId: "RIS_20250107_001" | "DTT_20250107_001"
├── referenceType: "RIS" | "DTT"
├── referenceNo: "2025 10 1815" | "DTT_20250107_001"
│
// Actors
├── performedBy: "Juan Dela Cruz"
├── performedByUid: "auth_uid_12345"
├── performedByRole: "driver" | "emd" | "spms"
│
├── createdAt: Timestamp
└── remarks: "Fuel added via RIS finalization"
```

**Transaction Types:**
1. **Fuel Added** → When RIS is finalized (positive litersChange)
2. **Fuel Used** → When DTT is closed (negative litersChange)
3. **DTT Closed** → Combined entry with km/L calculation

**Indexes Required:**
- Composite: `plateNo` ASC, `transactionDate` DESC
- Composite: `referenceId` ASC, `transactionType` ASC
- Single: `transactionDate` DESC

---

### H. **offices** Collection (Master Data)
List of offices for employee assignment.

```javascript
offices/{officeId}
├── officeId: "OFFICE_001"
├── officeName: "Regional Office"
├── shortCode: "RO"
├── status: "Active" | "Inactive"
└── createdAt: Timestamp
```

---

### I. **positions** Collection (Master Data)
List of positions for employee assignment.

```javascript
positions/{positionId}
├── positionId: "POSITION_001"
├── positionTitle: "Administrative Assistant III"
├── salaryGrade: "SG-8"
├── status: "Active" | "Inactive"
└── createdAt: Timestamp
```

---

### J. **holidays** Collection
Holiday calendar for detecting overtime on holidays.

```javascript
holidays/{holidayId}
├── holidayId: "HOLIDAY_20250101"
├── date: Timestamp
├── name: "New Year's Day"
├── type: "Regular" | "Special Non-Working"
├── isRecurring: true  // Annual holidays
└── createdAt: Timestamp
```

**Note:** This system doesn't calculate overtime, but can be used for future enhancements or reference.

---

### K. **systemCounters** Collection
Auto-incrementing counters for sequential IDs.

```javascript
systemCounters/risCounter
├── year: 2025
├── month: 10
├── count: 1815  // Last RIS number issued

systemCounters/dttCounter
├── date: "20250107"
├── count: 1  // Daily counter

systemCounters/temporaryRisCounter
├── count: 8112  // Global counter
```

**Business Rules:**
- RIS Real Number: `YYYY MM ####` (resets monthly)
- Temporary RIS: Sequential global counter (never resets)
- DTT ID: `DTT_YYYYMMDD_###` (resets daily)

---

### L. **signatory** Collection
Signatory information for PDF generation.

```javascript
signatory/default
├── name: "RHODELYN P. ORLANDA"
├── position: "Administrative Officer V"
├── office: "Supply and Property Management Section"
└── updatedAt: Timestamp
```

---

### M. **auditLog** Collection
System-wide audit trail for critical actions.

```javascript
auditLog/{logId}
├── logId: "AUDIT_20250107_001"
├── action: "RIS_FINALIZED" | "DTT_CLOSED" | "CONTRACT_UPDATED"
├── performedBy: "Rhodelyn Orlanda"
├── performedByUid: "auth_uid_spms_001"
├── role: "spms"
├── targetCollection: "risRequests"
├── targetDocumentId: "RIS_20250107_001"
├── changes: {
│   ├── before: {...}
│   └── after: {...}
│   }
├── ipAddress: "123.45.67.89"
├── userAgent: "Mozilla/5.0..."
├── timestamp: Timestamp
└── remarks: "Finalized RIS and deducted from Contract 2024-FUEL-001"
```

---

## KEY FEATURES TO IMPLEMENT

### FEATURE A: DASHBOARD (Role-Based Views)

#### Driver Dashboard (Mobile App)
```
┌─────────────────────────────────────┐
│  Good Morning, Juan!                │
├─────────────────────────────────────┤
│  📊 Quick Stats                     │
│  ┌───────────┬───────────┐          │
│  │ My Trips  │ Fuel Req. │          │
│  │    15     │     3     │          │
│  └───────────┴───────────┘          │
├─────────────────────────────────────┤
│  🚗 My Vehicles                     │
│  • H1 5750 - 43.5L remaining        │
│  • H1 5751 - 28.0L remaining        │
├─────────────────────────────────────┤
│  📋 Recent DTTs                     │
│  • 01/07 - Butuan (Closed)          │
│  • 01/06 - Surigao (In-Progress)    │
├─────────────────────────────────────┤
│  [+ New Trip]  [Request Fuel]       │
└─────────────────────────────────────┘
```

**Features:**
- Personalized greeting with current time
- Quick stats cards (total trips, pending fuel requests)
- Vehicle fuel balance overview
- Recent trips list (last 5)
- Quick action buttons

#### EMD Staff Dashboard (GAS Modal)
```
┌─────────────────────────────────────┐
│  EMD Dashboard                      │
├─────────────────────────────────────┤
│  📊 Statistics                      │
│  ┌──────────┬──────────┬──────────┐ │
│  │ Pending  │ Today's  │  This    │ │
│  │  Fuel    │ Issues   │  Month   │ │
│  │  Req.    │          │          │ │
│  │    3     │    8     │   125    │ │
│  └──────────┴──────────┴──────────┘ │
├─────────────────────────────────────┤
│  ⚠️ Alerts                          │
│  • 2 vehicles below 10L fuel        │
│  • 1 excessive km/L detected        │
├─────────────────────────────────────┤
│  📈 Fuel Efficiency Report          │
│  • H1 5750: 10.5 km/L (Good)        │
│  • H1 5751: 7.2 km/L (⚠️ Low)       │
└─────────────────────────────────────┘
```

**Features:**
- Pending fuel request count (requires action)
- Daily/monthly issuance statistics
- Vehicle fuel level alerts
- km/L monitoring dashboard
- Price update reminder (every Tuesday)

#### SPMS Staff Dashboard (GAS Modal)
```
┌─────────────────────────────────────┐
│  SPMS Dashboard                     │
├─────────────────────────────────────┤
│  💰 Contract Balance                │
│  ┌─────────────────────────────────┐│
│  │ Contract: 2024-FUEL-001         ││
│  │ Supplier: Petron                ││
│  │                                 ││
│  │ Total:   ₱500,000.00            ││
│  │ Used:    ₱  3,775.00            ││
│  │ Balance: ₱496,225.00 (99.2%)    ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  📊 This Month                      │
│  • Issuances: 25                    │
│  • Total Liters: 1,250.5            │
│  • Total Cost: ₱94,412.75           │
├─────────────────────────────────────┤
│  🔔 Alerts                          │
│  • 3 Temporary RIS awaiting finalization │
│  • Contract expires in 45 days      │
└─────────────────────────────────────┘
```

**Features:**
- Real-time contract balance (PHP and %)
- Progress bar visualization
- Monthly issuance summary
- Pending temporary RIS count
- Contract expiry alerts

---

### FEATURE B: DTT MANAGEMENT (Driver Mobile App)

#### B1. Create New DTT

**Screen: New DTT Form**

**UI Components:**
```dart
// Flutter Widget Structure
Scaffold(
  appBar: AppBar(title: "New Trip Ticket"),
  body: Form(
    child: ListView(
      children: [
        // Vehicle Selection
        DropdownField(
          label: "Vehicle",
          items: ["H1 5750 - Toyota Vios", "H1 5751 - Honda City"],
          hint: "Select vehicle"
        ),
        
        // Auto-display fuel balance
        FuelBalanceCard(
          plateNo: "H1 5750",
          currentBalance: "43.5L",
          tankCapacity: "60L",
          percentage: 72.5
        ),
        
        // Trip Details
        TextField(label: "Purpose", maxLines: 2),
        TextField(label: "Destination"),
        ChipList(
          label: "Passengers",
          onAdd: () => showPassengerDialog()
        ),
        
        // Odometer
        NumberField(
          label: "Odometer Start",
          suffix: "km",
          keyboard: TextInputType.number,
          camera: true  // Option to capture photo
        ),
        
        // Fuel Request Checkbox
        CheckboxTile(
          title: "Request Fuel for this trip",
          onChanged: (val) => setState(() => requestFuel = val)
        ),
        
        // Conditional: Fuel Request Fields
        if (requestFuel) ...[
          NumberField(
            label: "Liters Needed",
            suffix: "L",
            max: tankCapacity - currentBalance
          ),
          InfoCard(
            "Fuel balance after refuel: ${currentBalance + litersNeeded}L"
          )
        ],
        
        // Action Buttons
        Row(
          children: [
            OutlinedButton(text: "Save as Draft"),
            ElevatedButton(text: "Submit for Approval")
          ]
        )
      ]
    )
  )
)
```

**Validation Rules:**
- Vehicle: Required
- Purpose: Required, min 10 characters
- Destination: Required
- Odometer Start: Required, must be >= last reading
- Liters Needed: If requesting fuel, required and > 0

**Business Logic:**
1. Fetch driver's assigned vehicles from Firestore
2. On vehicle selection, fetch current fuel balance from `vehicles` collection
3. Calculate available capacity: `tankCapacity - currentBalance`
4. If "Request Fuel" checked, enable fuel quantity field
5. Validate fuel request doesn't exceed tank capacity
6. Save to `dtts` collection with status "Draft"
7. If submitted, change status to "Approved" (assumes offline signature)

**Cloud Function Trigger:**
```javascript
// onCreate trigger for dtts collection
exports.onDttCreated = functions.firestore
  .document('dtts/{dttId}')
  .onCreate(async (snap, context) => {
    const dtt = snap.data();
    
    // If fuel requested, auto-create RIS request
    if (dtt.requestFuel && dtt.requisitionQty > 0) {
      const risId = generateRisId();
      await db.collection('risRequests').doc(risId).set({
        risId: risId,
        linkedDttId: dtt.dttId,
        plateNo: dtt.plateNo,
        purpose: dtt.purpose,
        requestedBy: dtt.driverName,
        requestedByUid: dtt.driverUid,
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        requisitionQty: dtt.requisitionQty,
        status: 'Pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Link RIS to DTT
      await snap.ref.update({
        linkedRisId: risId
      });
    }
    
    return null;
  });
```

---

#### B2. View My Trips

**Screen: Trips List**

**UI Components:**
```dart
// Tabs: Active | Completed | All
TabBarView(
  children: [
    // Active Trips Tab
    ListView.builder(
      itemBuilder: (context, index) {
        return TripCard(
          dttNo: "DTT_20250107_001",
          date: "Jan 7, 2025",
          destination: "Butuan City",
          plateNo: "H1 5750",
          status: "In-Progress",
          statusColor: Colors.blue,
          onTap: () => navigateToTripDetails(dttId),
          actions: [
            if (status == "In-Progress")
              IconButton(
                icon: Icon(Icons.check_circle),
                label: "Close Trip",
                onPressed: () => showCloseDialog()
              )
          ]
        );
      }
    ),
    // Completed Trips Tab
    CompletedTripsListView(),
    // All Trips Tab
    AllTripsListView()
  ]
)
```

**Features:**
- Filterable tabs (Active, Completed, All)
- Swipe to refresh
- Search by destination or purpose
- Status badges (Draft, Approved, In-Progress, Closed)
- Pull-up to load more (pagination)

---

#### B3. Close DTT

**Screen: Close Trip Dialog**

**UI Components:**
```dart
AlertDialog(
  title: Text("Close Trip Ticket"),
  content: Form(
    child: Column(
      children: [
        // Show trip summary
        InfoRow("Odometer Start", "12,000 km"),
        InfoRow("Distance Traveled", "100 km (estimated)"),
        
        Divider(),
        
        // Input: Odometer End
        NumberField(
          label: "Odometer End",
          suffix: "km",
          autofocus: true,
          camera: true,
          validation: (val) {
            if (val <= odometerStart) {
              return "Must be greater than start odometer";
            }
            return null;
          }
        ),
        
        // Auto-calculated fields
        InfoCard(
          child: Column([
            InfoRow("Distance Traveled", "${end - start} km"),
            InfoRow("Fuel Used (est.)", "${(end-start)/kmPerLiter} L"),
            InfoRow("New Fuel Balance", "${currentBalance - fuelUsed} L"),
            InfoRow("Fuel Efficiency", "${(end-start)/fuelUsed} km/L")
          ])
        ),
        
        TextField(
          label: "Remarks (optional)",
          maxLines: 2
        )
      ]
    )
  ),
  actions: [
    TextButton("Cancel"),
    ElevatedButton("Close Trip")
  ]
)
```

**Business Logic:**
1. Fetch DTT data from Firestore
2. Fetch vehicle's `currentFuelBalance` and `standardKmPerLiter`
3. On odometer input:
   - Calculate: `distanceTraveled = odometerEnd - odometerStart`
   - Calculate: `fuelUsed = distanceTraveled / standardKmPerLiter`
   - Calculate: `kmPerLiter = distanceTraveled / fuelUsed`
   - Calculate: `fuelBalanceEnd = fuelBalanceStart - fuelUsed`
4. Validate: `odometerEnd > odometerStart`
5. Update DTT document:
   ```javascript
   {
     odometerEnd: value,
     distanceTraveled: calculated,
     fuelUsed: calculated,
     kmPerLiter: calculated,
     fuelBalanceEnd: calculated,
     timeOfArrival: now,
     status: 'Closed',
     closedAt: now
   }
   ```
6. Show success message
7. Navigate back to list

**Cloud Function Trigger:**
```javascript
// onUpdate trigger when DTT is closed
exports.onDttClosed = functions.firestore
  .document('dtts/{dttId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if status changed to 'Closed'
    if (before.status !== 'Closed' && after.status === 'Closed') {
      const dtt = after;
      
      // Update vehicle fuel balance
      await db.collection('vehicles').doc(dtt.plateNo).update({
        currentFuelBalance: dtt.fuelBalanceEnd,
        lastOdometerReading: dtt.odometerEnd,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create ledger entry
      const ledgerId = generateLedgerId();
      await db.collection('ledger').doc(ledgerId).set({
        ledgerId: ledgerId,
        transactionDate: dtt.closedAt,
        transactionType: 'Fuel Used',
        plateNo: dtt.plateNo,
        litersChange: -dtt.fuelUsed,
        balanceBefore: dtt.fuelBalanceStart,
        balanceAfter: dtt.fuelBalanceEnd,
        referenceId: dtt.dttId,
        referenceType: 'DTT',
        referenceNo: dtt.dttId,
        performedBy: dtt.driverName,
        performedByUid: dtt.driverUid,
        performedByRole: 'driver',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        remarks: `Fuel used: ${dtt.distanceTraveled} km @ ${dtt.kmPerLiter.toFixed(1)} km/L`
      });
      
      // Check if km/L is below threshold (alert EMD)
      const vehicle = await db.collection('vehicles').doc(dtt.plateNo).get();
      const standardKmPerLiter = vehicle.data().standardKmPerLiter;
      const threshold = standardKmPerLiter * 0.8; // 80% of standard
      
      if (dtt.kmPerLiter < threshold) {
        // Create notification for EMD
        await db.collection('notifications').add({
          type: 'LOW_FUEL_EFFICIENCY',
          title: 'Low Fuel Efficiency Detected',
          message: `${dtt.plateNo} achieved only ${dtt.kmPerLiter.toFixed(1)} km/L (expected: ${standardKmPerLiter} km/L)`,
          targetRole: 'emd',
          dttId: dtt.dttId,
          plateNo: dtt.plateNo,
          priority: 'high',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    return null;
  });
```

---

### FEATURE C: RIS WORKFLOW (Multi-Stage Process)

The RIS workflow has **3 stages** with **3 different users**:

```
Stage 1: Driver (Mobile)     →  Create RIS Request (Pending)
Stage 2: EMD (GAS Modal)      →  Validate & Print Temporary RIS
Stage 3: SPMS (GAS Modal)     →  Finalize & Print Real RIS
```

---

#### C1. Stage 1: Create RIS Request (Driver)

**Two Scenarios:**

**Scenario A: Linked to DTT (Most Common)**
- Driver creates DTT with "Request Fuel" checked
- Cloud Function auto-creates RIS request (status: Pending)
- No manual action needed by driver

**Scenario B: Standalone Request (Additional/Non-Vehicle)**
- Driver manually creates RIS without DTT
- Examples: "Additional fuel needed mid-trip" or "Fuel for generator"

**Screen: Request Fuel (Standalone)**

```dart
Scaffold(
  appBar: AppBar(title: "Request Fuel"),
  body: Form(
    child: ListView(
      children: [
        // Type Selection
        SegmentedButton(
          options: ["For Vehicle", "For Equipment"],
          selected: requestType,
          onChanged: (val) => setState()
        ),
        
        if (requestType == "For Vehicle") ...[
          DropdownField(
            label: "Vehicle",
            items: assignedVehicles
          ),
          // Option to link to existing DTT
          DropdownField(
            label: "Link to Trip (optional)",
            items: activeDtts,
            hint: "Select if related to an active trip"
          )
        ],
        
        TextField(
          label: "Purpose",
          hint: "E.g., Additional fuel, Fuel for generator",
          required: true
        ),
        
        NumberField(
          label: "Liters Needed",
          suffix: "L",
          required: true
        ),
        
        TextField(
          label: "Remarks (optional)",
          maxLines: 2
        ),
        
        ElevatedButton(
          text: "Submit Request",
          onPressed: () => submitRisRequest()
        )
      ]
    )
  )
)
```

**Submission Logic:**
```javascript
async function submitRisRequest(data) {
  const risId = generateRisId();
  
  await db.collection('risRequests').doc(risId).set({
    risId: risId,
    linkedDttId: data.dttId || null,
    plateNo: data.plateNo || null,
    purpose: data.purpose,
    requestedBy: currentUser.displayName,
    requestedByUid: currentUser.uid,
    requestedAt: serverTimestamp(),
    requisitionQty: data.litersNeeded,
    status: 'Pending',
    createdAt: serverTimestamp(),
    remarks: data.remarks || ''
  });
  
  // If linked to DTT, update DTT
  if (data.dttId) {
    await db.collection('dtts').doc(data.dttId).update({
      linkedRisId: risId
    });
  }
  
  // Send notification to EMD
  await createNotification({
    targetRole: 'emd',
    type: 'NEW_FUEL_REQUEST',
    message: `New fuel request from ${currentUser.displayName}`,
    risId: risId
  });
  
  showSuccess("Fuel request submitted. Please bring signed DTT to EMD office.");
}
```

---

#### C2. Stage 2: EMD Validates & Prints Temporary RIS

**Access:** EMD Staff via Google Sheets Custom Modal

**Screen: Pending Fuel Requests**

**UI (Tailwind):**
```html
<div class="container mx-auto p-6">
  <div class="bg-white rounded-lg shadow-md">
    <div class="px-6 py-4 border-b">
      <h2 class="text-2xl font-bold text-gray-800">Pending Fuel Requests</h2>
      <p class="text-sm text-gray-600">Validate quantities and print Temporary RIS</p>
    </div>
    
    <div class="p-6">
      <!-- Loading Spinner -->
      <div id="loading" class="text-center py-8">
        <div class="spinner-border text-blue-500" role="status"></div>
        <p class="mt-2 text-gray-600">Loading requests...</p>
      </div>
      
      <!-- Requests Table -->
      <table id="requests-table" class="w-full hidden" style="display:none;">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Temp Ref</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requested By</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vehicle</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Purpose</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Req. Qty</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody id="requests-body" class="bg-white divide-y divide-gray-200">
          <!-- Populated dynamically -->
        </tbody>
      </table>
    </div>
  </div>
</div>
```

**Validate & Print Modal:**
```html
<div id="validate-modal" class="modal">
  <div class="modal-content max-w-2xl">
    <div class="modal-header bg-blue-600 text-white">
      <h3 class="text-lg font-semibold">Validate Fuel Request</h3>
    </div>
    
    <div class="modal-body p-6">
      <!-- Request Details -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label class="text-sm font-medium text-gray-700">Requested By</label>
          <p class="text-gray-900" id="modal-requester">Juan Dela Cruz</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700">Vehicle</label>
          <p class="text-gray-900" id="modal-vehicle">H1 5750</p>
        </div>
        <div class="col-span-2">
          <label class="text-sm font-medium text-gray-700">Purpose</label>
          <p class="text-gray-900" id="modal-purpose">Official travel to Butuan City</p>
        </div>
      </div>
      
      <!-- Matrix Distance Validation (EMD Business Rule) -->
      <div class="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
        <h4 class="font-semibold text-yellow-800 mb-2">🗺️ Matrix Distance Check</h4>
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span class="text-gray-600">Destination:</span>
            <span class="font-medium" id="modal-destination">Butuan City</span>
          </div>
          <div>
            <span class="text-gray-600">Matrix Distance:</span>
            <span class="font-medium" id="modal-matrix-km">120 km</span>
          </div>
          <div>
            <span class="text-gray-600">Est. Fuel Needed:</span>
            <span class="font-medium" id="modal-est-fuel">12 L</span>
          </div>
        </div>
      </div>
      
      <!-- Quantity Validation -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Requisition Quantity
        </label>
        <div class="flex items-center gap-2">
          <input type="number" 
                 id="modal-req-qty" 
                 class="form-input w-32" 
                 value="50" 
                 readonly>
          <span class="text-gray-600">Liters (as requested)</span>
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Issuance Quantity (can adjust)
        </label>
        <div class="flex items-center gap-2">
          <input type="number" 
                 id="modal-issue-qty" 
                 class="form-input w-32 border-blue-300 focus:ring-blue-500" 
                 value="50"
                 min="1"
                 step="0.1">
          <span class="text-gray-600">Liters</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Adjust if needed based on matrix distance or vehicle capacity
        </p>
      </div>
      
      <!-- Remarks -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          EMD Remarks (optional)
        </label>
        <textarea id="modal-remarks" 
                  rows="2" 
                  class="form-input w-full"
                  placeholder="E.g., Adjusted based on matrix distance"></textarea>
      </div>
    </div>
    
    <div class="modal-footer bg-gray-50 px-6 py-4 flex justify-end gap-3">
      <button onclick="closeValidateModal()" 
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
        Cancel
      </button>
      <button onclick="printTemporaryRis()" 
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Validate & Print Temporary RIS
      </button>
    </div>
  </div>
</div>
```

**Server-Side Function (Code.gs):**
```javascript
function validateAndPrintTemporaryRis(data) {
  try {
    const firestore = getFirestoreService();
    const risId = data.risId;
    
    // Generate Temporary Reference Number (sequential)
    const tempRefNo = getNextTemporaryRefNo();
    
    // Update RIS request
    firestore.updateDocument('risRequests/' + risId, {
      status: 'Temporary',
      issuanceQty: data.issuanceQty,
      temporaryRefNo: tempRefNo,
      validatedBy: Session.getActiveUser().getEmail(),
      validatedByUid: 'emd_' + Session.getActiveUser().getEmail(),
      validatedAt: new Date().toISOString(),
      emdRemarks: data.remarks || ''
    });
    
    // Generate Temporary RIS PDF
    const pdfUrl = generateTemporaryRisPdf(risId, tempRefNo, data);
    
    // Store PDF URL
    firestore.updateDocument('risRequests/' + risId, {
      temporaryPdfUrl: pdfUrl
    });
    
    // Send notification to SPMS
    createNotification({
      targetRole: 'spms',
      type: 'TEMPORARY_RIS_READY',
      message: `Temporary RIS ${tempRefNo} ready for finalization`,
      risId: risId
    });
    
    return {
      success: true,
      tempRefNo: tempRefNo,
      pdfUrl: pdfUrl
    };
    
  } catch (error) {
    Logger.log('Error in validateAndPrintTemporaryRis: ' + error);
    throw new Error('Failed to process RIS: ' + error.message);
  }
}

function getNextTemporaryRefNo() {
  const firestore = getFirestoreService();
  const counterDoc = firestore.getDocument('systemCounters/temporaryRisCounter');
  
  let currentCount = counterDoc ? (counterDoc.fields.count || 0) : 0;
  const newCount = currentCount + 1;
  
  // Update counter
  firestore.updateDocument('systemCounters/temporaryRisCounter', {
    count: newCount
  });
  
  return newCount.toString();
}

function generateTemporaryRisPdf(risId, tempRefNo, data) {
  // Fetch RIS details
  const firestore = getFirestoreService();
  const ris = firestore.getDocument('risRequests/' + risId);
  
  // Create PDF from Google Docs template
  const templateId = '1ABC...'; // Temporary RIS template
  const template = DriveApp.getFileById(templateId);
  const copy = template.makeCopy('Temp_RIS_' + tempRefNo);
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();
  
  // Replace placeholders
  body.replaceText('{{TEMP_REF_NO}}', tempRefNo);
  body.replaceText('{{DATE}}', Utilities.formatDate(new Date(), 'Asia/Manila', 'MM/dd/yyyy'));
  body.replaceText('{{REQUESTED_BY}}', ris.fields.requestedBy);
  body.replaceText('{{PLATE_NO}}', ris.fields.plateNo || 'N/A');
  body.replaceText('{{PURPOSE}}', ris.fields.purpose);
  body.replaceText('{{REQ_QTY}}', ris.fields.requisitionQty);
  body.replaceText('{{ISSUE_QTY}}', data.issuanceQty);
  body.replaceText('{{EMD_STAFF}}', Session.getActiveUser().getEmail());
  
  doc.saveAndClose();
  
  // Convert to PDF
  const pdf = copy.getAs('application/pdf');
  pdf.setName('Temporary_RIS_' + tempRefNo + '.pdf');
  
  // Upload to Drive
  const folder = DriveApp.getFolderById('folder_id_here');
  const file = folder.createFile(pdf);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // Delete temp doc
  copy.setTrashed(true);
  
  return file.getUrl();
}
```

---

#### C3. Stage 3: SPMS Finalizes & Prints Real RIS

**Access:** SPMS Staff via Google Sheets Custom Modal

**Screen: Temporary RIS for Finalization**

**UI (Tailwind):**
```html
<div class="container mx-auto p-6">
  <div class="bg-white rounded-lg shadow-md">
    <div class="px-6 py-4 border-b">
      <h2 class="text-2xl font-bold text-gray-800">Finalize RIS</h2>
      <p class="text-sm text-gray-600">Generate Real RIS Number and deduct from contract</p>
    </div>
    
    <div class="p-6">
      <!-- Temporary RIS Table -->
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">Temp Ref</th>
            <th class="px-4 py-3 text-left">Date</th>
            <th class="px-4 py-3 text-left">Vehicle</th>
            <th class="px-4 py-3 text-left">Purpose</th>
            <th class="px-4 py-3 text-left">Qty (L)</th>
            <th class="px-4 py-3 text-left">Validated By</th>
            <th class="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Rows populated dynamically -->
        </tbody>
      </table>
    </div>
  </div>
</div>
```

**Finalization Modal:**
```html
<div id="finalize-modal" class="modal">
  <div class="modal-content max-w-3xl">
    <div class="modal-header bg-violet-600 text-white">
      <h3 class="text-lg font-semibold">Finalize RIS</h3>
    </div>
    
    <div class="modal-body p-6">
      <!-- RIS Details -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label class="text-sm font-medium text-gray-700">Temporary Ref No.</label>
          <p class="text-xl font-bold text-gray-900" id="finalize-temp-ref">8112</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700">Requested By</label>
          <p class="text-gray-900" id="finalize-requester">Juan Dela Cruz</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700">Vehicle</label>
          <p class="text-gray-900" id="finalize-vehicle">H1 5750</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700">Issuance Qty</label>
          <p class="text-gray-900" id="finalize-qty">50.0 L</p>
        </div>
      </div>
      
      <!-- Contract Selection -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Contract <span class="text-red-500">*</span>
        </label>
        <select id="finalize-contract" class="form-select w-full">
          <option value="">-- Select Contract --</option>
          <!-- Populated dynamically with active contracts -->
        </select>
      </div>
      
      <!-- Auto-Calculated Financial Summary -->
      <div id="financial-summary" class="bg-blue-50 border border-blue-200 rounded p-4 mb-4" style="display:none;">
        <h4 class="font-semibold text-blue-800 mb-3">💰 Financial Summary (Auto-Calculated)</h4>
        
        <div class="grid grid-cols-2 gap-3 text-sm mb-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Price per Liter:</span>
            <span class="font-medium" id="calc-price-per-liter">₱75.50</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Issuance Qty:</span>
            <span class="font-medium" id="calc-qty">50.0 L</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Total Cost:</span>
            <span class="font-medium text-red-600" id="calc-total-cost">₱3,775.00</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Contract Balance:</span>
            <span class="font-medium" id="calc-contract-balance">₱500,000.00</span>
          </div>
        </div>
        
        <div class="border-t border-blue-300 pt-3">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700">Balance After Issuance:</span>
            <span class="text-xl font-bold text-green-600" id="calc-balance-after">₱496,225.00</span>
          </div>
        </div>
      </div>
      
      <!-- Last Issuance Info -->
      <div class="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
        <h4 class="font-semibold text-gray-800 mb-2">📋 Last Issuance</h4>
        <div class="text-sm">
          <div class="flex justify-between mb-1">
            <span class="text-gray-600">RIS No:</span>
            <span class="font-medium" id="last-ris-no">2025 10 1814</span>
          </div>
          <div class="flex justify-between mb-1">
            <span class="text-gray-600">Quantity:</span>
            <span class="font-medium" id="last-qty">57.505 L</span>
          </div>
          <div class="flex justify-between mb-1">
            <span class="text-gray-600">Vehicle:</span>
            <span class="font-medium" id="last-plate">H1 5751</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Date:</span>
            <span class="font-medium" id="last-date">01/06/2025</span>
          </div>
        </div>
      </div>
      
      <!-- Date of Issuance -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Date of Issuance
        </label>
        <input type="date" 
               id="finalize-date-issuance" 
               class="form-input w-full"
               value="">
        <p class="text-xs text-gray-500 mt-1">
          Default: Today's date
        </p>
      </div>
    </div>
    
    <div class="modal-footer bg-gray-50 px-6 py-4 flex justify-end gap-3">
      <button onclick="closeFinalizeModal()" 
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
        Cancel
      </button>
      <button onclick="finalizeRis()" 
              id="finalize-btn"
              class="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50"
              disabled>
        Finalize & Print RIS
      </button>
    </div>
  </div>
</div>
```

**JavaScript Logic:**
```javascript
// On contract selection, fetch latest price and calculate
document.getElementById('finalize-contract').addEventListener('change', async function() {
  const contractId = this.value;
  if (!contractId) {
    document.getElementById('financial-summary').style.display = 'none';
    document.getElementById('finalize-btn').disabled = true;
    return;
  }
  
  showSpinner('Calculating...');
  
  try {
    // Call server function to get calculations
    const result = await google.script.run
      .withSuccessHandler(onCalculationsReady)
      .withFailureHandler(showError)
      .calculateRisFinancials(risId, contractId);
  } catch (error) {
    showError('Failed to calculate: ' + error.message);
  }
});

function onCalculationsReady(data) {
  hideSpinner();
  
  // Populate calculated fields
  document.getElementById('calc-price-per-liter').textContent = '₱' + data.pricePerLiter.toFixed(2);
  document.getElementById('calc-qty').textContent = data.issuanceQty.toFixed(1) + ' L';
  document.getElementById('calc-total-cost').textContent = '₱' + data.totalCost.toLocaleString('en-PH', {minimumFractionDigits: 2});
  document.getElementById('calc-contract-balance').textContent = '₱' + data.contractBalance.toLocaleString('en-PH', {minimumFractionDigits: 2});
  document.getElementById('calc-balance-after').textContent = '₱' + data.balanceAfter.toLocaleString('en-PH', {minimumFractionDigits: 2});
  
  // Last Issuance
  if (data.lastIssuance) {
    document.getElementById('last-ris-no').textContent = data.lastIssuance.risNo;
    document.getElementById('last-qty').textContent = data.lastIssuance.qty + ' L';
    document.getElementById('last-plate').textContent = data.lastIssuance.plateNo;
    document.getElementById('last-date').textContent = data.lastIssuance.date;
  } else {
    document.getElementById('last-ris-no').textContent = 'N/A (First issuance)';
  }
  
  // Show summary and enable button
  document.getElementById('financial-summary').style.display = 'block';
  document.getElementById('finalize-btn').disabled = false;
  
  // Validate sufficient balance
  if (data.balanceAfter < 0) {
    showWarning('Insufficient contract balance!');
    document.getElementById('finalize-btn').disabled = true;
  }
}
```

**Server-Side Function (Code.gs):**
```javascript
function calculateRisFinancials(risId, contractId) {
  try {
    const firestore = getFirestoreService();
    
    // Fetch RIS
    const ris = firestore.getDocument('risRequests/' + risId);
    const issuanceQty = ris.fields.issuanceQty;
    
    // Fetch Contract
    const contract = firestore.getDocument('contracts/' + contractId);
    const contractBalance = contract.fields.currentBalance;
    
    // Get latest fuel price
    const pricePerLiter = getLatestFuelPrice(ris.fields.plateNo);
    
    // Calculate
    const totalCost = issuanceQty * pricePerLiter;
    const balanceAfter = contractBalance - totalCost;
    
    // Get last issuance
    const lastIssuance = getLastIssuance(contractId);
    
    return {
      issuanceQty: issuanceQty,
      pricePerLiter: pricePerLiter,
      totalCost: totalCost,
      contractBalance: contractBalance,
      balanceAfter: balanceAfter,
      lastIssuance: lastIssuance
    };
    
  } catch (error) {
    Logger.log('Error in calculateRisFinancials: ' + error);
    throw new Error('Calculation failed: ' + error.message);
  }
}

function getLatestFuelPrice(plateNo) {
  const firestore = getFirestoreService();
  
  // Fetch vehicle to get fuel type
  const vehicle = firestore.getDocument('vehicles/' + plateNo);
  const fuelType = vehicle.fields.fuelType.toLowerCase(); // 'diesel' or 'gasoline'
  
  // Query priceMaster for latest price
  const prices = firestore.query('priceMaster')
    .orderBy('effectiveDate', 'desc')
    .limit(1)
    .execute();
  
  if (prices.length === 0) {
    throw new Error('No fuel price found in Price Master. Please add latest price.');
  }
  
  const latestPrice = prices[0];
  return latestPrice.fields[fuelType];
}

function getLastIssuance(contractId) {
  const firestore = getFirestoreService();
  
  // Query risRequests for last finalized RIS
  const lastRis = firestore.query('risRequests')
    .where('contractId', '==', contractId)
    .where('status', '==', 'Finalized')
    .orderBy('finalizedAt', 'desc')
    .limit(1)
    .execute();
  
  if (lastRis.length === 0) {
    return null; // First issuance
  }
  
  const ris = lastRis[0];
  return {
    risNo: ris.fields.realRisNo,
    qty: ris.fields.issuanceQty,
    plateNo: ris.fields.plateNo,
    date: Utilities.formatDate(new Date(ris.fields.finalizedAt), 'Asia/Manila', 'MM/dd/yyyy')
  };
}

function finalizeRis(data) {
  try {
    const firestore = getFirestoreService();
    const risId = data.risId;
    const contractId = data.contractId;
    const dateOfIssuance = new Date(data.dateOfIssuance);
    
    // Generate Real RIS Number
    const realRisNo = generateRealRisNo(dateOfIssuance);
    
    // Fetch calculations (already done, but re-fetch for safety)
    const calculations = calculateRisFinancials(risId, contractId);
    
    // Update RIS Request
    firestore.updateDocument('risRequests/' + risId, {
      status: 'Finalized',
      realRisNo: realRisNo,
      contractId: contractId,
      contractNo: data.contractNo,
      pricePerLiter: calculations.pricePerLiter,
      totalCost: calculations.totalCost,
      lastIssuance: calculations.lastIssuance,
      contractBalanceBefore: calculations.contractBalance,
      contractBalanceAfter: calculations.balanceAfter,
      finalizedBy: Session.getActiveUser().getEmail(),
      finalizedByUid: 'spms_' + Session.getActiveUser().getEmail(),
      finalizedAt: new Date().toISOString()
    });
    
    // Update Contract Balance (CRITICAL)
    firestore.updateDocument('contracts/' + contractId, {
      currentBalance: calculations.balanceAfter,
      totalUsed: FieldValue.increment(calculations.totalCost),
      totalLitersIssued: FieldValue.increment(calculations.issuanceQty),
      numberOfIssuances: FieldValue.increment(1),
      lastIssuanceDate: new Date().toISOString(),
      lastIssuanceRisNo: realRisNo
    });
    
    // Update Vehicle Fuel Balance (via Cloud Function trigger)
    // (See Cloud Function below)
    
    // Generate Final RIS PDF
    const finalPdfUrl = generateFinalRisPdf(risId, realRisNo, calculations);
    
    // Store PDF URL
    firestore.updateDocument('risRequests/' + risId, {
      finalPdfUrl: finalPdfUrl
    });
    
    // Create Ledger Entry
    createLedgerEntry({
      transactionType: 'Fuel Added',
      plateNo: data.plateNo,
      litersChange: calculations.issuanceQty,
      pricePerLiter: calculations.pricePerLiter,
      totalCost: calculations.totalCost,
      referenceId: risId,
      referenceType: 'RIS',
      referenceNo: realRisNo,
      performedBy: Session.getActiveUser().getEmail(),
      performedByRole: 'spms'
    });
    
    // Send notification to Driver
    createNotification({
      targetUid: data.driverUid,
      type: 'RIS_FINALIZED',
      message: `Your fuel request (RIS ${realRisNo}) is approved. Please proceed to gas station.`,
      risId: risId
    });
    
    return {
      success: true,
      realRisNo: realRisNo,
      pdfUrl: finalPdfUrl
    };
    
  } catch (error) {
    Logger.log('Error in finalizeRis: ' + error);
    throw new Error('Finalization failed: ' + error.message);
  }
}

function generateRealRisNo(dateOfIssuance) {
  const firestore = getFirestoreService();
  const year = Utilities.formatDate(dateOfIssuance, 'Asia/Manila', 'yyyy');
  const month = Utilities.formatDate(dateOfIssuance, 'Asia/Manila', 'MM');
  
  // Get or create counter for this year-month
  const counterPath = 'systemCounters/risCounter';
  const counterDoc = firestore.getDocument(counterPath);
  
  let currentCount = 0;
  if (counterDoc && counterDoc.fields.year == year && counterDoc.fields.month == month) {
    currentCount = counterDoc.fields.count;
  }
  
  const newCount = currentCount + 1;
  
  // Update counter
  firestore.updateDocument(counterPath, {
    year: parseInt(year),
    month: parseInt(month),
    count: newCount
  });
  
  // Format: YYYY MM ####
  const paddedCount = String(newCount).padStart(4, '0');
  return `${year} ${month} ${paddedCount}`;
}

function generateFinalRisPdf(risId, realRisNo, calculations) {
  // Similar to Temporary RIS PDF generation
  // Use "Final RIS" template with more details
  // Include: Real RIS No, Last Issuance, Total Cost, Contract Balance After
  
  const firestore = getFirestoreService();
  const ris = firestore.getDocument('risRequests/' + risId);
  
  const templateId = '1XYZ...'; // Final RIS template
  const template = DriveApp.getFileById(templateId);
  const copy = template.makeCopy('Final_RIS_' + realRisNo.replace(/ /g, '_'));
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();
  
  // Replace placeholders
  body.replaceText('{{RIS_NO}}', realRisNo);
  body.replaceText('{{DATE}}', Utilities.formatDate(new Date(), 'Asia/Manila', 'MM/dd/yyyy'));
  body.replaceText('{{PLATE_NO}}', ris.fields.plateNo || 'N/A');
  body.replaceText('{{PURPOSE}}', ris.fields.purpose);
  body.replaceText('{{ISSUE_QTY}}', calculations.issuanceQty.toFixed(1));
  body.replaceText('{{PRICE_PER_LITER}}', '₱' + calculations.pricePerLiter.toFixed(2));
  body.replaceText('{{TOTAL_COST}}', '₱' + calculations.totalCost.toFixed(2));
  
  // Last Issuance
  if (calculations.lastIssuance) {
    body.replaceText('{{LAST_RIS_NO}}', calculations.lastIssuance.risNo);
    body.replaceText('{{LAST_QTY}}', calculations.lastIssuance.qty.toFixed(3));
  } else {
    body.replaceText('{{LAST_RIS_NO}}', 'N/A');
    body.replaceText('{{LAST_QTY}}', 'N/A');
  }
  
  body.replaceText('{{CONTRACT_BALANCE_AFTER}}', '₱' + calculations.balanceAfter.toFixed(2));
  body.replaceText('{{SIGNATORY_NAME}}', getSignatoryName());
  body.replaceText('{{SIGNATORY_POSITION}}', getSignatoryPosition());
  
  doc.saveAndClose();
  
  // Convert to PDF and upload
  const pdf = copy.getAs('application/pdf');
  pdf.setName('Final_RIS_' + realRisNo.replace(/ /g, '_') + '.pdf');
  
  const folder = DriveApp.getFolderById('folder_id_here');
  const file = folder.createFile(pdf);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  copy.setTrashed(true);
  
  return file.getUrl();
}
```

**Cloud Function Trigger (Auto-Update Vehicle):**
```javascript
// Cloud Function: Update vehicle fuel balance when RIS is finalized
exports.onRisFinalized = functions.firestore
  .document('risRequests/{risId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if status changed to 'Finalized'
    if (before.status !== 'Finalized' && after.status === 'Finalized') {
      const ris = after;
      
      // Only update if linked to a vehicle
      if (!ris.plateNo) {
        return null;
      }
      
      // Fetch current vehicle fuel balance
      const vehicleRef = db.collection('vehicles').doc(ris.plateNo);
      const vehicle = await vehicleRef.get();
      
      if (!vehicle.exists) {
        console.error(`Vehicle ${ris.plateNo} not found`);
        return null;
      }
      
      const currentBalance = vehicle.data().currentFuelBalance || 0;
      const newBalance = currentBalance + ris.issuanceQty;
      
      // Update vehicle
      await vehicleRef.update({
        currentFuelBalance: newBalance,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create ledger entry
      const ledgerId = generateLedgerId();
      await db.collection('ledger').doc(ledgerId).set({
        ledgerId: ledgerId,
        transactionDate: ris.finalizedAt,
        transactionType: 'Fuel Added',
        plateNo: ris.plateNo,
        litersChange: ris.issuanceQty,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        pricePerLiter: ris.pricePerLiter,
        totalCost: ris.totalCost,
        contractBalanceBefore: ris.contractBalanceBefore,
        contractBalanceAfter: ris.contractBalanceAfter,
        referenceId: ris.risId,
        referenceType: 'RIS',
        referenceNo: ris.realRisNo,
        performedBy: ris.finalizedBy,
        performedByUid: ris.finalizedByUid,
        performedByRole: 'spms',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        remarks: `Fuel added via RIS ${ris.realRisNo}`
      });
      
      console.log(`Updated vehicle ${ris.plateNo}: ${currentBalance}L → ${newBalance}L`);
    }
    
    return null;
  });
```

---

## THE 3 WORKFLOWS (SENARYO 1, 2, 3)

### SENARYO 1: DTT Only (No Fuel Request)

**Use Case:** Driver has enough fuel for the trip, no refueling needed.

**Step-by-Step:**

1. **Driver (Mobile App):**
   - Opens "New Trip" form
   - Selects vehicle: H1 5750
   - System shows fuel balance: 45.0L
   - Enters purpose: "Official travel to conduct training"
   - Enters destination: "Butuan City"
   - Enters odometer start: 12000 km
   - Does NOT check "Request Fuel" (sees 45L is enough for 120km trip)
   - Taps "Submit for Approval"

2. **Firestore:**
   ```javascript
   dtts/DTT_20250107_001 {
     dttId: "DTT_20250107_001",
     driverUid: "auth_uid_driver1",
     driverName: "Juan Dela Cruz",
     plateNo: "H1 5750",
     purpose: "Official travel to conduct training",
     destination: "Butuan City",
     odometerStart: 12000,
     fuelBalanceStart: 45.0,
     requestFuel: false,
     status: "Approved",
     createdAt: Timestamp
   }
   ```

3. **Offline:**
   - Driver prints Draft DTT from mobile app (PDF)
   - Gets wet signature from Division Chief (Bernard Calabazaron)
   - Performs the trip (official travel)

4. **Driver (Mobile App) - After Trip:**
   - Opens "My Trips"
   - Selects "DTT_20250107_001"
   - Taps "Close Trip"
   - Enters odometer end: 12100 km
   - System auto-calculates:
     - Distance: 100 km
     - Fuel used: 100 / 10 = 10.0L (using standard km/L)
     - New balance: 45.0 - 10.0 = 35.0L
     - Fuel efficiency: 100 / 10 = 10.0 km/L
   - Taps "Close Trip"

5. **Cloud Function Trigger:**
   ```javascript
   // onDttClosed function executes
   - Updates vehicles/H1_5750:
     {
       currentFuelBalance: 35.0,
       lastOdometerReading: 12100,
       lastUpdated: now
     }
   
   - Creates ledger entry:
     {
       transactionType: "Fuel Used",
       plateNo: "H1 5750",
       litersChange: -10.0,
       balanceBefore: 45.0,
       balanceAfter: 35.0,
       referenceId: "DTT_20250107_001",
       remarks: "Fuel used: 100 km @ 10.0 km/L"
     }
   
   - Checks km/L threshold (10.0 >= 8.0): ✅ Good, no alert
   ```

6. **Result:**
   - DTT closed successfully
   - Vehicle fuel balance updated to 35.0L
   - Ledger recorded fuel consumption
   - No RIS involved

---

### SENARYO 2: DTT + RIS (Main Workflow)

**Use Case:** Driver needs fuel for authorized trip.

**Step-by-Step:**

1. **Driver (Mobile App):**
   - Opens "New Trip" form
   - Selects vehicle: H1 5750
   - System shows fuel balance: 5.0L (Low!)
   - Enters purpose: "Official travel to Butuan City"
   - Enters destination: "Butuan City"
   - Enters odometer start: 12000 km
   - **CHECKS "Request Fuel"** ✅
   - Enters liters needed: 50L
   - Taps "Submit for Approval"

2. **Cloud Function (onDttCreated):**
   ```javascript
   // Auto-creates RIS request
   risRequests/RIS_20250107_001 {
     risId: "RIS_20250107_001",
     linkedDttId: "DTT_20250107_001",
     plateNo: "H1 5750",
     purpose: "Official travel to Butuan City",
     requestedBy: "Juan Dela Cruz",
     requestedByUid: "auth_uid_driver1",
     requestedAt: Timestamp,
     requisitionQty: 50,
     status: "Pending",
     createdAt: Timestamp
   }
   
   // Updates DTT with link
   dtts/DTT_20250107_001 {
     ...existing fields,
     linkedRisId: "RIS_20250107_001"
   }
   
   // Sends notification to EMD
   notifications/ {
     targetRole: "emd",
     type: "NEW_FUEL_REQUEST",
     message: "New fuel request from Juan Dela Cruz"
   }
   ```

3. **Offline:**
   - Driver prints Draft DTT (shows "Fuel Requested: 50L")
   - Gets wet signature from Division Chief
   - Goes to EMD office with signed DTT

4. **EMD Staff (GAS Modal):**
   - Logs into Google Sheets
   - Opens "Pending Fuel Requests" page
   - Sees RIS_20250107_001 in the table
   - Clicks "Validate" button
   - Modal opens with:
     - Requester: Juan Dela Cruz
     - Vehicle: H1 5750
     - Purpose: Official travel to Butuan City
     - Requisition Qty: 50L
   - Validates against "Matrix Distance":
     - Destination: Butuan = 120 km
     - Est. fuel: 120 / 10 = 12L
     - Requested: 50L (reasonable for round trip + buffer)
   - Adjusts Issuance Qty (if needed): 50L ✅
   - Clicks "Validate & Print Temporary RIS"

5. **Server Function (validateAndPrintTemporaryRis):**
   ```javascript
   // Generates Temporary Ref No: 8112
   // Updates RIS:
   risRequests/RIS_20250107_001 {
     ...existing,
     status: "Temporary",
     issuanceQty: 50,
     temporaryRefNo: "8112",
     validatedBy: "David Hidalgo",
     validatedAt: Timestamp,
     temporaryPdfUrl: "https://drive.google.com/..."
   }
   
   // Increments counter:
   systemCounters/temporaryRisCounter {
     count: 8113
   }
   
   // Sends notification to SPMS:
   notifications/ {
     targetRole: "spms",
     message: "Temporary RIS 8112 ready for finalization"
   }
   ```

6. **Offline:**
   - Driver takes printed "Temporary RIS #8112" to SPMS office

7. **SPMS Staff (GAS Modal):**
   - Logs into Google Sheets
   - Opens "Finalize RIS" page
   - Sees Temp RIS 8112 in the table
   - Clicks "Finalize" button
   - Modal opens with RIS details
   - Selects Contract: "2024-FUEL-001"
   - System auto-calculates:
     - Latest price: ₱75.50/L (from priceMaster)
     - Total cost: 50 × 75.50 = ₱3,775.00
     - Contract balance: ₱500,000.00
     - Balance after: ₱496,225.00 ✅
     - Last Issuance: RIS 2025 10 1814 (57.505L)
   - Verifies calculations
   - Clicks "Finalize & Print RIS"

8. **Server Function (finalizeRis):**
   ```javascript
   // Generates Real RIS No: 2025 10 1815
   // Updates RIS:
   risRequests/RIS_20250107_001 {
     ...existing,
     status: "Finalized",
     realRisNo: "2025 10 1815",
     contractId: "CONTRACT_2024_001",
     contractNo: "2024-FUEL-001",
     pricePerLiter: 75.50,
     totalCost: 3775.00,
     lastIssuance: {risNo: "2025 10 1814", qty: 57.505, ...},
     contractBalanceBefore: 500000.00,
     contractBalanceAfter: 496225.00,
     finalizedBy: "Rhodelyn Orlanda",
     finalizedAt: Timestamp,
     finalPdfUrl: "https://drive.google.com/..."
   }
   
   // Updates Contract:
   contracts/CONTRACT_2024_001 {
     ...existing,
     currentBalance: 496225.00,
     totalUsed: 3775.00,
     totalLitersIssued: 50,
     numberOfIssuances: 1,
     lastIssuanceRisNo: "2025 10 1815"
   }
   
   // Increments RIS counter:
   systemCounters/risCounter {
     year: 2025,
     month: 10,
     count: 1815
   }
   
   // Sends notification to Driver:
   notifications/ {
     targetUid: "auth_uid_driver1",
     message: "Your fuel request (RIS 2025 10 1815) is approved"
   }
   ```

9. **Cloud Function (onRisFinalized):**
   ```javascript
   // Updates Vehicle:
   vehicles/H1_5750 {
     ...existing,
     currentFuelBalance: 55.0,  // 5.0 + 50.0
     lastUpdated: Timestamp
   }
   
   // Creates Ledger Entry:
   ledger/LEDGER_20250107_002 {
     transactionType: "Fuel Added",
     plateNo: "H1 5750",
     litersChange: 50.0,
     balanceBefore: 5.0,
     balanceAfter: 55.0,
     pricePerLiter: 75.50,
     totalCost: 3775.00,
     contractBalanceBefore: 500000.00,
     contractBalanceAfter: 496225.00,
     referenceId: "RIS_20250107_001",
     referenceType: "RIS",
     referenceNo: "2025 10 1815",
     performedBy: "Rhodelyn Orlanda",
     performedByRole: "spms",
     remarks: "Fuel added via RIS 2025 10 1815"
   }
   ```

10. **Offline:**
    - Driver receives push notification
    - Driver takes "Final RIS 2025 10 1815" to gas station
    - Gas station fills 50L of diesel
    - Driver performs the trip

11. **Driver (Mobile App) - After Trip:**
    - Opens "My Trips"
    - Selects "DTT_20250107_001"
    - Taps "Close Trip"
    - Enters odometer end: 12100 km
    - System auto-calculates:
      - Distance: 100 km
      - Fuel used: 100 / 10 = 10.0L
      - New balance: 55.0 - 10.0 = 45.0L (Note: Started with 5, added 50, used 10)
      - Fuel efficiency: 100 / 10 = 10.0 km/L
    - Taps "Close Trip"

12. **Cloud Function (onDttClosed):**
    ```javascript
    // Updates Vehicle:
    vehicles/H1_5750 {
      currentFuelBalance: 45.0,
      lastOdometerReading: 12100,
      lastUpdated: Timestamp
    }
    
    // Creates Ledger Entry:
    ledger/LEDGER_20250107_003 {
      transactionType: "Fuel Used",
      plateNo: "H1 5750",
      litersChange: -10.0,
      balanceBefore: 55.0,
      balanceAfter: 45.0,
      referenceId: "DTT_20250107_001",
      referenceType: "DTT",
      remarks: "Fuel used: 100 km @ 10.0 km/L"
    }
    ```

13. **Final State:**
    - DTT closed ✅
    - RIS finalized ✅
    - Vehicle fuel: 45.0L
    - Contract balance: ₱496,225.00
    - Ledger has 2 entries:
      1. Fuel Added: +50.0L
      2. Fuel Used: -10.0L
    - Audit trail complete

---

### SENARYO 3: RIS Only (No DTT)

**Two Sub-Cases:**

#### Case A: Additional Fuel (Kulang ang Na-request)

**Scenario:** Driver underestimated fuel needed, requires additional fuel mid-trip.

**Step-by-Step:**

1. **Situation:**
   - Driver is on DTT_20250107_001 (from Senaryo 2)
   - Initial RIS: 2025 10 1815 (50L)
   - During trip, realizes 50L is insufficient for extended route
   - Current fuel: 30L remaining
   - Needs: 30L more

2. **Driver (Mobile App):**
   - Opens "My Trips"
   - Selects active trip: DTT_20250107_001
   - Taps "Request Additional Fuel"
   - Enters liters needed: 30L
   - Enters reason: "Extended route due to road closure"
   - Taps "Submit"

3. **Cloud Function:**
   ```javascript
   // Creates new RIS linked to same DTT
   risRequests/RIS_20250107_002 {
     risId: "RIS_20250107_002",
     linkedDttId: "DTT_20250107_001",  // Same DTT
     plateNo: "H1 5750",
     purpose: "Additional fuel - Extended route",
     requestedBy: "Juan Dela Cruz",
     requestedByUid: "auth_uid_driver1",
     requisitionQty: 30,
     status: "Pending",
     remarks: "Additional fuel for active trip",
     createdAt: Timestamp
   }
   ```

4. **Offline:**
   - Driver goes directly to EMD (no new Division Chief signature needed)
   - Explains it's additional fuel for already-approved trip

5. **EMD Staff (GAS Modal):**
   - Sees RIS_20250107_002 marked as "Additional"
   - Notes it's linked to approved DTT_20250107_001
   - Validates: 30L reasonable for road detour
   - Approves Issuance Qty: 30L
   - Clicks "Print Temporary RIS"
   - System generates: Temp RIS 8113

6. **Offline:**
   - Driver takes Temp RIS 8113 to SPMS

7. **SPMS Staff (GAS Modal):**
   - Finalizes Temp RIS 8113
   - Selects same contract: 2024-FUEL-001
   - System calculates:
     - Price: ₱75.50/L
     - Total cost: 30 × 75.50 = ₱2,265.00
     - Contract balance before: ₱496,225.00
     - Balance after: ₱493,960.00
     - **Last Issuance: RIS 2025 10 1815** (the previous one)
   - Clicks "Finalize"
   - System generates: Real RIS 2025 10 1816

8. **Result:**
   - Vehicle fuel: 30L → 60L
   - Contract balance: ₱493,960.00
   - Same DTT now has 2 linked RISs
   - Ledger entry created for +30L

---

#### Case B: Non-Vehicle Fuel (Generator Set)

**Scenario:** Office needs fuel for generator, not for a vehicle.

**Step-by-Step:**

1. **Staff (any role, e.g., Admin Officer):**
   - Needs fuel for office generator set
   - Requests fuel through system

2. **Driver/Staff (Mobile or GAS):**
   - Opens "Request Fuel" (standalone)
   - Selects: "For Equipment" (not vehicle)
   - Enters purpose: "Fuel for generator set - Office 3rd floor"
   - Enters quantity: 100L
   - Taps "Submit"

3. **Firestore:**
   ```javascript
   risRequests/RIS_20250107_003 {
     risId: "RIS_20250107_003",
     linkedDttId: null,  // No DTT
     plateNo: null,  // No vehicle
     purpose: "Fuel for generator set - Office 3rd floor",
     requestedBy: "Maria Santos",
     requestedByUid: "auth_uid_admin1",
     requisitionQty: 100,
     status: "Pending",
     remarks: "Non-vehicle fuel request",
     createdAt: Timestamp
   }
   ```

4. **Offline:**
   - Requester prints Draft RIS
   - Gets wet signature from Division Chief
   - Goes to EMD

5. **EMD Staff:**
   - Verifies signature
   - Notes: Non-vehicle request
   - Approves 100L
   - Prints Temporary RIS 8114

6. **SPMS Staff:**
   - Finalizes Temp RIS 8114
   - Selects contract
   - Calculates cost: 100 × ₱75.50 = ₱7,550.00
   - Last Issuance: RIS 2025 10 1816
   - Generates Real RIS: 2025 10 1817

7. **Cloud Function (onRisFinalized):**
   ```javascript
   // Skips vehicle update (plateNo is null)
   // Only updates contract and creates ledger entry
   
   ledger/LEDGER_20250107_004 {
     transactionType: "Fuel Issued (Non-Vehicle)",
     plateNo: null,
     litersChange: 100.0,
     pricePerLiter: 75.50,
     totalCost: 7550.00,
     referenceId: "RIS_20250107_003",
     referenceType: "RIS",
     referenceNo: "2025 10 1817",
     performedBy: "Rhodelyn Orlanda",
     remarks: "Fuel for generator set"
   }
   ```

8. **Result:**
   - Contract balance deducted
   - No vehicle affected
   - No DTT involved
   - Ledger recorded transaction

---

## CRITICAL BUSINESS RULES

### Rule 1: FIFO for Fuel Deduction (Not Applicable)

**Note:** Unlike the COC system which tracks individual "batches" of hours, this fuel system uses a **real-time balance** approach. Each vehicle has a single `currentFuelBalance` field that is incremented when fuel is added (RIS) and decremented when fuel is used (DTT closed).

**There is NO FIFO deduction** because fuel is fungible (interchangeable) - you can't track "which fuel" was used. The system simply tracks total liters.

---

### Rule 2: Sequential Numbering

**RIS Real Number Format: `YYYY MM ####`**

- **YYYY:** Year (2025)
- **MM:** Month (01-12)
- **####:** Sequential counter (resets monthly)

**Examples:**
- First RIS of January 2025: `2025 01 0001`
- 1815th RIS of October 2025: `2025 10 1815`

**Implementation:**
```javascript
// Counter resets every month
systemCounters/risCounter {
  year: 2025,
  month: 10,
  count: 1815
}

// Check if month changed, reset counter to 1
if (currentYear != year || currentMonth != month) {
  count = 1;
} else {
  count++;
}
```

**Temporary RIS Number:**
- Global sequential counter (never resets)
- Simple integer: 8112, 8113, 8114...
- Used for internal tracking only

---

### Rule 3: Expiry Management (Contracts)

**Contract Expiry:**
- Each contract has `startDate` and `endDate`
- System auto-checks expiry daily via Cloud Function
- If `endDate` < today: status = "Expired"
- Prevent RIS finalization from expired contracts

**Implementation:**
```javascript
// Daily scheduled function
exports.checkContractExpiry = functions.pubsub
  .schedule('0 0 * * *')  // Every day at midnight
  .timeZone('Asia/Manila')
  .onRun(async (context) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await db.collection('contracts')
      .where('status', '==', 'Active')
      .get();
    
    const batch = db.batch();
    snapshot.forEach(doc => {
      const contract = doc.data();
      const endDate = new Date(contract.endDate);
      
      if (endDate < today) {
        batch.update(doc.ref, {
          status: 'Expired',
          expiredAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    
    await batch.commit();
    return null;
  });
```

---

### Rule 4: Balance Validation

**Prevent Negative Balances:**

1. **Contract Balance:**
   - Before finalizing RIS, validate: `contractBalance >= totalCost`
   - If insufficient, show error: "Insufficient contract balance"

2. **Vehicle Fuel Balance:**
   - Cannot go below 0
   - If DTT closure calculates negative fuel (odometer anomaly), flag for review

**Implementation:**
```javascript
// In finalizeRis function
if (calculations.balanceAfter < 0) {
  throw new Error('Insufficient contract balance. Current: ₱' + 
    contractBalance.toFixed(2) + ', Required: ₱' + totalCost.toFixed(2));
}

// In onDttClosed function
if (fuelBalanceEnd < 0) {
  // Create alert for EMD
  await db.collection('notifications').add({
    type: 'NEGATIVE_FUEL_BALANCE',
    message: `Vehicle ${plateNo} calculated negative fuel. Check odometer readings.`,
    targetRole: 'emd',
    dttId: dttId,
    priority: 'high'
  });
  
  // Set balance to 0 (prevent negative)
  fuelBalanceEnd = 0;
}
```

---

### Rule 5: Data Preservation (Firestore Updates)

**ALWAYS use `update()` not `set()`:**

```javascript
// ❌ BAD (overwrites entire document)
await db.collection('vehicles').doc(plateNo).set({
  currentFuelBalance: newBalance
});

// ✅ GOOD (updates only specified fields)
await db.collection('vehicles').doc(plateNo).update({
  currentFuelBalance: newBalance,
  lastUpdated: admin.firestore.FieldValue.serverTimestamp()
});
```

**Use `FieldValue.increment()` for counters:**
```javascript
// ✅ Atomic increment (safe for concurrent updates)
await db.collection('contracts').doc(contractId).update({
  totalUsed: admin.firestore.FieldValue.increment(totalCost),
  numberOfIssuances: admin.firestore.FieldValue.increment(1)
});
```

---

### Rule 6: Audit Trail Requirements

**Every critical action must create:**
1. **Ledger Entry** (financial/fuel transactions)
2. **Audit Log Entry** (system actions)

**Ledger Entry Required For:**
- Fuel Added (RIS finalized)
- Fuel Used (DTT closed)

**Audit Log Entry Required For:**
- RIS finalized
- Contract created/updated
- User role changed
- Price master updated

---

### Rule 7: Role-Based Access Control

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isDriver() {
      return isAuthenticated() && getUserRole() == 'driver';
    }
    
    function isEMD() {
      return isAuthenticated() && getUserRole() == 'emd';
    }
    
    function isSPMS() {
      return isAuthenticated() && getUserRole() == 'spms';
    }
    
    // DTTs: Drivers can create/read own, EMD/SPMS can read all
    match /dtts/{dttId} {
      allow create: if isDriver();
      allow read: if isAuthenticated();
      allow update: if isDriver() && resource.data.driverUid == request.auth.uid;
      allow delete: if false;  // Never allow delete
    }
    
    // RIS Requests: Complex rules
    match /risRequests/{risId} {
      allow create: if isDriver();
      allow read: if isAuthenticated();
      allow update: if (isEMD() && resource.data.status == 'Pending') ||
                       (isSPMS() && resource.data.status == 'Temporary');
      allow delete: if false;
    }
    
    // Contracts: Only SPMS can write
    match /contracts/{contractId} {
      allow read: if isAuthenticated();
      allow write: if isSPMS();
    }
    
    // Price Master: EMD and SPMS can write
    match /priceMaster/{priceId} {
      allow read: if isAuthenticated();
      allow write: if isEMD() || isSPMS();
    }
    
    // Vehicles: Drivers read only, EMD/SPMS can write
    match /vehicles/{plateNo} {
      allow read: if isAuthenticated();
      allow write: if isEMD() || isSPMS();
    }
    
    // Ledger: Read-only for all, system writes only
    match /ledger/{ledgerId} {
      allow read: if isAuthenticated();
      allow write: if false;  // Only Cloud Functions can write
    }
  }
}
```

---

## UI/UX REQUIREMENTS

### Mobile App Design Principles (Flutter)

**1. Bottom Navigation:**
```dart
BottomNavigationBar(
  items: [
    BottomNavigationBarItem(icon: Icon(Icons.home), label: "Home"),
    BottomNavigationBarItem(icon: Icon(Icons.local_shipping), label: "Trips"),
    BottomNavigationBarItem(icon: Icon(Icons.local_gas_station), label: "Fuel"),
    BottomNavigationBarItem(icon: Icon(Icons.person), label: "Profile")
  ]
)
```

**2. Color Scheme:**
- Primary: Blue (#2196F3)
- Accent: Violet (#9C27B0)
- Success: Green (#4CAF50)
- Warning: Orange (#FF9800)
- Danger: Red (#F44336)

**3. Card-Based Layouts:**
```dart
Card(
  elevation: 2,
  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  child: Padding(
    padding: EdgeInsets.all(16),
    child: Column(...)
  )
)
```

**4. Loading States:**
- Shimmer effect for lists
- Circular progress indicator for buttons
- Skeleton screens for complex layouts

**5. Empty States:**
- Friendly illustrations
- Actionable messages ("No trips yet. Create your first trip!")

---

### GAS Modal Design (Tailwind CSS)

**1. Top Navigation Bar:**
```html
<nav class="bg-blue-600 text-white px-6 py-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <img src="logo.png" class="h-10">
      <h1 class="text-xl font-bold">Fuel & Vehicle Management</h1>
    </div>
    
    <div class="flex items-center space-x-6">
      <!-- Navigation Items -->
      <a href="#" onclick="showPage('dashboard')" 
         class="hover:text-blue-200 transition">Dashboard</a>
      
      <div class="relative dropdown">
        <button class="hover:text-blue-200 transition">
          RIS Management ▼
        </button>
        <div class="dropdown-menu">
          <a href="#" onclick="showPage('pending-ris')">Pending Requests</a>
          <a href="#" onclick="showPage('finalize-ris')">Finalize RIS</a>
          <a href="#" onclick="showPage('view-certificates')">View RIS</a>
        </div>
      </div>
      
      <div class="relative dropdown">
        <button class="hover:text-blue-200 transition">
          Master Data ▼
        </button>
        <div class="dropdown-menu">
          <a href="#" onclick="showPage('contracts')">Contracts</a>
          <a href="#" onclick="showPage('price-master')">Price Master</a>
          <a href="#" onclick="showPage('vehicles')">Vehicles</a>
        </div>
      </div>
      
      <span class="text-sm">👤 rhodelyn.orlanda@depedcaraga.ph</span>
    </div>
  </div>
</nav>
```

**2. Page Structure:**
```html
<!-- All pages hidden by default -->
<div id="dashboard-page" class="page-content" data-page="dashboard">
  <div class="container mx-auto p-6">
    <!-- Page content -->
  </div>
</div>

<div id="pending-ris-page" class="page-content hidden" data-page="pending-ris">
  <div class="container mx-auto p-6">
    <!-- Page content -->
  </div>
</div>

<!-- JavaScript for page navigation -->
<script>
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.add('hidden');
  });
  
  // Show selected page
  const targetPage = document.querySelector(`[data-page="${pageName}"]`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
    
    // Refresh data for the page
    loadPageData(pageName);
  }
}
</script>
```

**3. Stat Cards:**
```html
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
  <!-- Total Contract Balance -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 mb-1">Contract Balance</p>
        <h3 class="text-2xl font-bold text-blue-600">₱496,225</h3>
        <p class="text-xs text-gray-500 mt-1">99.2% remaining</p>
      </div>
      <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-blue-600"><!-- icon --></svg>
      </div>
    </div>
  </div>
  
  <!-- Pending RIS -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 mb-1">Pending RIS</p>
        <h3 class="text-2xl font-bold text-orange-600">3</h3>
        <p class="text-xs text-gray-500 mt-1">Awaiting validation</p>
      </div>
      <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-orange-600"><!-- icon --></svg>
      </div>
    </div>
  </div>
  
  <!-- ... more cards -->
</div>
```

**4. Tables:**
```html
<div class="bg-white rounded-lg shadow-md overflow-hidden">
  <table class="w-full">
    <thead class="bg-gray-50 border-b">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
          Temp Ref
        </th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
          Date
        </th>
        <!-- ... more headers -->
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          8112
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          01/07/2025
        </td>
        <!-- ... more cells -->
      </tr>
    </tbody>
  </table>
</div>
```

**5. Modals:**
```html
<div id="modal-overlay" class="modal-overlay" onclick="closeModal()"></div>

<div id="custom-modal" class="modal">
  <div class="modal-content max-w-2xl">
    <div class="modal-header bg-blue-600 text-white px-6 py-4 rounded-t-lg">
      <h3 class="text-lg font-semibold">Modal Title</h3>
      <button onclick="closeModal()" class="text-white hover:text-gray-200">
        ✕
      </button>
    </div>
    
    <div class="modal-body p-6">
      <!-- Content -->
    </div>
    
    <div class="modal-footer bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
      <button class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
        Cancel
      </button>
      <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Confirm
      </button>
    </div>
  </div>
</div>

<style>
.modal-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

.modal {
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

.modal.show {
  display: block;
}

.modal-overlay.show {
  display: block;
}
</style>
```

**6. Form Validation:**
```javascript
function validateForm(formData) {
  const errors = [];
  
  if (!formData.plateNo) {
    errors.push('Vehicle is required');
  }
  
  if (!formData.requisitionQty || formData.requisitionQty <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (errors.length > 0) {
    showErrorModal(errors.join('<br>'));
    return false;
  }
  
  return true;
}
```

---

## GOOGLE APPS SCRIPT STRUCTURE

### File Organization

```
Project Files:
├── Code.gs (Server-side functions)
├── Main.html (Container)
├── navigation.html (Navbar)
├── page-views.html (All page content)
├── modals.html (Modal dialogs)
├── styles.html (CSS with Tailwind)
└── app-script.html (JavaScript + Firebase)
```

### Code.gs Functions

```javascript
// ===== FIREBASE SETUP =====
function getFirebaseConfig() {
  // Returns Firebase config object
}

function getServiceAccountKey() {
  // Returns service account JSON (from Script Properties)
}

function getFirestoreService() {
  // Returns FirestoreApp instance
}

// ===== DTT FUNCTIONS =====
function getAllDtts() {
  // Fetch all DTTs for display
}

function getDttById(dttId) {
  // Fetch specific DTT
}

// ===== RIS FUNCTIONS =====
function getPendingRisRequests() {
  // Fetch RIS with status='Pending' (for EMD)
}

function getTemporaryRisRequests() {
  // Fetch RIS with status='Temporary' (for SPMS)
}

function validateAndPrintTemporaryRis(data) {
  // EMD validates and generates Temp RIS
}

function calculateRisFinancials(risId, contractId) {
  // Calculate price, cost, balance for SPMS
}

function finalizeRis(data) {
  // SPMS finalizes RIS, generates Real RIS No.
}

// ===== CONTRACT FUNCTIONS =====
function getActiveContracts() {
  // Fetch contracts with status='Active'
}

function createContract(data) {
  // SPMS creates new contract
}

function updateContract(contractId, data) {
  // SPMS updates contract
}

// ===== PRICE MASTER FUNCTIONS =====
function addFuelPrice(data) {
  // EMD/SPMS adds weekly price
}

function getLatestFuelPrice() {
  // Fetch most recent price
}

// ===== VEHICLE FUNCTIONS =====
function getAllVehicles() {
  // Fetch all vehicles
}

function getVehicleById(plateNo) {
  // Fetch specific vehicle
}

function updateVehicleFuelBalance(plateNo, newBalance) {
  // Manual adjustment (EMD/SPMS only)
}

// ===== REPORTS =====
function getLedgerByVehicle(plateNo) {
  // Fetch ledger entries for a vehicle
}

function exportLedgerToExcel(plateNo) {
  // Generate Excel file and return download URL
}

// ===== UTILITIES =====
function generateRisId() {
  // Generate unique RIS ID
}

function generateLedgerId() {
  // Generate unique Ledger ID
}

function formatDate(date) {
  // Format date to MM/DD/YYYY (Asia/Manila)
}

function createNotification(data) {
  // Create in-app notification
}

// ===== HELPER =====
function doGet() {
  // Serve HTML UI
  return HtmlService.createTemplateFromFile('Main')
    .evaluate()
    .setTitle('Fuel & Vehicle Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  // Include other HTML files
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

---

## FIREBASE SETUP GUIDE

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter name: "Fuel Vehicle Management"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Firestore

1. In Firebase Console, click "Firestore Database"
2. Click "Create Database"
3. Select "Start in production mode"
4. Choose location: `asia-southeast1` (Singapore - closest to PH)
5. Click "Enable"

### Step 3: Enable Authentication

1. Click "Authentication" in sidebar
2. Click "Get Started"
3. Click "Sign-in method" tab

**For Driver Mobile App:**
- Enable "Email/Password"
- Enable "Phone" (optional, for SMS OTP)

**For Web (GAS):**
- Enable "Google" sign-in
- Add authorized domain: `script.google.com`

### Step 4: Create Service Account (for GAS)

1. Click ⚙️ (Settings) → "Project Settings"
2. Click "Service Accounts" tab
3. Click "Generate New Private Key"
4. Save JSON file securely
5. In Google Apps Script:
   - Go to Project Settings
   - Click "Script Properties"
   - Add property:
     - Key: `FIREBASE_SERVICE_ACCOUNT`
     - Value: Paste entire JSON content

### Step 5: Add Firebase SDK to Flutter

**pubspec.yaml:**
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.24.0
  firebase_auth: ^4.15.0
  cloud_firestore: ^4.13.0
  firebase_storage: ^11.5.0
  firebase_messaging: ^14.7.0
```

**main.dart:**
```dart
import 'package:firebase_core/firebase_core.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}
```

### Step 6: Configure Firestore Indexes

**Composite Indexes Required:**

```javascript
// In Firebase Console → Firestore → Indexes

1. Collection: dtts
   Fields: driverUid (ASC), status (ASC), createdAt (DESC)

2. Collection: risRequests
   Fields: status (ASC), createdAt (DESC)

3. Collection: risRequests
   Fields: linkedDttId (ASC), status (ASC)

4. Collection: ledger
   Fields: plateNo (ASC), transactionDate (DESC)

5. Collection: priceMaster
   Fields: effectiveDate (DESC)
```

**Note:** Firebase will auto-suggest these when you first run queries that need them.

### Step 7: Deploy Cloud Functions

**Install Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

**functions/index.js:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Copy all Cloud Function code here
// (onDttCreated, onDttClosed, onRisFinalized, etc.)

// Deploy
// firebase deploy --only functions
```

---

## STEP-BY-STEP DEVELOPMENT GUIDE

### PHASE 1: Setup & Authentication (Week 1)

**Tasks:**
1. Create Firebase project ✅
2. Enable Firestore & Auth ✅
3. Set up service account for GAS ✅
4. Create Flutter project ✅
5. Implement Firebase Auth in Flutter:
   - Login screen
   - Registration (for testing)
   - Email/password authentication
6. Create GAS project:
   - Basic HTML structure
   - Firebase REST API connection
   - Google Sign-In

**Deliverable:** Working authentication for both mobile (Flutter) and web (GAS)

---

### PHASE 2: Database Setup & Master Data (Week 2)

**Tasks:**
1. Create all Firestore collections (empty)
2. Set up Firestore Security Rules
3. Build Master Data UI (GAS):
   - Vehicles management
   - Offices management
   - Positions management
   - Contracts management
4. Implement CRUD functions in Code.gs
5. Create sample data for testing

**Deliverable:** Fully functional master data management

---

### PHASE 3: Driver DTT Module (Week 3-4)

**Tasks:**
1. Flutter UI:
   - Home dashboard
   - Create DTT form
   - My Trips list
   - Trip details screen
   - Close DTT dialog
2. Implement Firestore CRUD (Flutter)
3. Build Cloud Function: `onDttCreated`
4. Build Cloud Function: `onDttClosed`
5. Test entire DTT workflow (Senaryo 1)

**Deliverable:** Drivers can create and close DTTs, auto-calculations work

---

### PHASE 4: RIS Workflow - Stage 1 & 2 (Week 5-6)

**Tasks:**
1. Flutter: Request Fuel feature (linked to DTT)
2. GAS Modal: EMD Pending Requests page
3. GAS Modal: Validate & Print Temporary RIS
4. Server Function: `validateAndPrintTemporaryRis`
5. Server Function: `generateTemporaryRisPdf`
6. Implement Temporary RIS number counter
7. Test EMD workflow

**Deliverable:** EMD can validate fuel requests and print Temporary RIS

---

### PHASE 5: RIS Workflow - Stage 3 (Week 7-8)

**Tasks:**
1. GAS Modal: SPMS Finalize RIS page
2. Server Function: `calculateRisFinancials`
3. Server Function: `finalizeRis`
4. Server Function: `generateFinalRisPdf`
5. Server Function: `generateRealRisNo`
6. Build Cloud Function: `onRisFinalized`
7. Implement contract balance deduction
8. Test full RIS workflow (Senaryo 2)

**Deliverable:** SPMS can finalize RIS, contract balance updates, vehicle fuel updates

---

### PHASE 6: Price Master & Ledger (Week 9)

**Tasks:**
1. GAS Modal: Price Master management
2. Server Function: `addFuelPrice`
3. Server Function: `getLatestFuelPrice`
4. Implement ledger entry creation (all triggers)
5. GAS Modal: View Ledger page
6. Test price-based calculations

**Deliverable:** Weekly price updates work, ledger tracks all transactions

---

### PHASE 7: Additional Features (Week 10-11)

**Tasks:**
1. Flutter: Standalone fuel request (Senaryo 3-B)
2. Flutter: Additional fuel request (Senaryo 3-A)
3. GAS Modal: Dashboard (all 3 roles)
4. Implement km/L monitoring alerts
5. Implement contract expiry checks
6. Push notifications (Firebase Cloud Messaging)

**Deliverable:** All 3 scenarios work, monitoring & alerts functional

---

### PHASE 8: Reports & Export (Week 12)

**Tasks:**
1. GAS Modal: Reports page
   - Ledger by vehicle
   - RIS summary
   - Contract usage report
2. Server Function: Excel export with SheetJS
3. PDF generation improvements
4. Data visualization charts

**Deliverable:** Comprehensive reporting system

---

### PHASE 9: Testing & Bug Fixes (Week 13-14)

**Tasks:**
1. End-to-end testing (all scenarios)
2. User acceptance testing
3. Performance optimization
4. Bug fixes
5. Documentation updates

**Deliverable:** Production-ready system

---

### PHASE 10: Deployment & Training (Week 15)

**Tasks:**
1. Deploy Cloud Functions
2. Submit Flutter app (Android Play Store)
3. Deploy GAS as web app
4. User training materials
5. System handover

**Deliverable:** Live system with trained users

---

## SPECIAL REQUIREMENTS

### 1. Timezone Management (Asia/Manila)

**Flutter:**
```dart
import 'package:intl/intl.dart';

String formatDate(DateTime date) {
  final phTime = date.toUtc().add(Duration(hours: 8)); // UTC+8
  return DateFormat('MM/dd/yyyy').format(phTime);
}
```

**Google Apps Script:**
```javascript
function formatDate(date) {
  return Utilities.formatDate(date, 'Asia/Manila', 'MM/dd/yyyy');
}
```

**Firestore:**
- Always store timestamps in UTC
- Convert to Asia/Manila for display only

---

### 2. Error Handling

**Flutter:**
```dart
try {
  await FirebaseFirestore.instance
    .collection('dtts')
    .doc(dttId)
    .update(data);
  
  showSuccessDialog('DTT closed successfully');
} catch (e) {
  showErrorDialog('Failed to close DTT: ${e.message}');
  print('Error: $e');
}
```

**GAS:**
```javascript
function closeDtt(dttId, data) {
  try {
    const firestore = getFirestoreService();
    firestore.updateDocument('dtts/' + dttId, data);
    return {success: true};
  } catch (error) {
    Logger.log('Error in closeDtt: ' + error);
    return {
      success: false,
      error: 'Failed to close DTT: ' + error.message
    };
  }
}
```

---

### 3. Rate Limiting & Caching

**Problem:** Firestore has quotas (50K reads/day free)

**Solution:**
```javascript
// Cache frequently accessed data
const priceCache = {};

function getLatestFuelPrice() {
  const today = new Date().toDateString();
  
  // Check cache
  if (priceCache[today]) {
    return priceCache[today];
  }
  
  // Fetch from Firestore
  const price = fetchPriceFromFirestore();
  
  // Cache for 1 day
  priceCache[today] = price;
  
  return price;
}
```

---

### 4. Offline Support (Flutter)

**Enable Firestore Persistence:**
```dart
FirebaseFirestore.instance.settings = Settings(
  persistenceEnabled: true,
  cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
);
```

**Features:**
- View cached trips when offline
- Create draft DTTs offline (sync when online)
- Queue fuel requests (sync when online)

---

### 5. PDF Generation Best Practices

**Template Preparation:**
1. Create Google Docs template
2. Use `{{PLACEHOLDER}}` syntax
3. Share template (Anyone with link can view)
4. Get template ID from URL

**Code:**
```javascript
function generatePdf(templateId, data) {
  const template = DriveApp.getFileById(templateId);
  const copy = template.makeCopy('Temp_' + Date.now());
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();
  
  // Replace all placeholders
  Object.keys(data).forEach(key => {
    body.replaceText('{{' + key + '}}', data[key]);
  });
  
  doc.saveAndClose();
  
  // Convert to PDF
  const pdf = copy.getAs('application/pdf');
  const folder = DriveApp.getFolderById('FOLDER_ID');
  const file = folder.createFile(pdf);
  
  // Clean up
  copy.setTrashed(true);
  
  return file.getUrl();
}
```

---

## TROUBLESHOOTING GUIDE

### Issue 1: "Permission Denied" in Firestore

**Cause:** Security Rules blocking access

**Solution:**
```javascript
// Temporarily allow all (TESTING ONLY!)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // NEVER use in production!
    }
  }
}
```

Then implement proper role-based rules (see Rule 7 above).

---

### Issue 2: Cloud Function Not Triggering

**Cause:** Function not deployed or wrong trigger path

**Solution:**
1. Check function is deployed: `firebase functions:list`
2. Check trigger path matches collection: `dtts/{dttId}`
3. View logs: `firebase functions:log`

---

### Issue 3: Sequential Number Skipping

**Cause:** Race condition in counter update

**Solution:** Use Firestore Transactions
```javascript
const counterRef = db.doc('systemCounters/risCounter');
const newNo = await db.runTransaction(async (transaction) => {
  const doc = await transaction.get(counterRef);
  const newCount = (doc.data().count || 0) + 1;
  transaction.update(counterRef, {count: newCount});
  return newCount;
});
```

---

### Issue 4: Flutter App Crashes on Launch

**Cause:** Firebase not initialized

**Solution:**
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await Firebase.initializeApp();
  } catch (e) {
    print('Firebase init error: $e');
  }
  
  runApp(MyApp());
}
```

---

### Issue 5: GAS "Service Account Not Found"

**Cause:** Service account JSON not properly stored

**Solution:**
1. Go to Apps Script Project Settings
2. Script Properties → Add Property
3. Key: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Entire JSON (with outer curly braces)
5. Click Save

---

## IMPORTANT REMINDERS

### 1. COA Compliance ✅
- DTT must be signed by Division Chief BEFORE fuel issuance
- RIS must have Real RIS Number (format: YYYY MM ####)
- Complete audit trail in ledger (all fuel movements)
- Last Issuance must be shown on every new RIS

### 2. Data Integrity ✅
- NEVER delete documents (soft delete with status)
- ALWAYS use `update()` not `set()` (preserve fields)
- Use transactions for critical operations (counters)
- Validate ALL user inputs

### 3. Security ✅
- Implement proper Firestore Security Rules
- Never expose service account key in client-side code
- Use Firebase Auth custom claims for roles
- Sanitize inputs to prevent injection

### 4. Performance ✅
- Cache frequently accessed data (prices, vehicles)
- Use pagination for long lists (25-50 items per page)
- Implement Firestore offline persistence (Flutter)
- Debounce search inputs (300ms delay)

### 5. User Experience ✅
- Show loading states for all async operations
- Display user-friendly error messages
- Confirm destructive actions (modals, not alerts)
- Auto-save drafts to prevent data loss

### 6. Testing ✅
- Test all 3 scenarios thoroughly
- Test with multiple concurrent users
- Test offline functionality (Flutter)
- Test with real-world data volumes

---

## CONCLUSION

This comprehensive specification document provides:
- ✅ Complete database structure (13 collections)
- ✅ All 3 workflows (Senaryo 1, 2, 3) with step-by-step details
- ✅ Critical business rules (7 rules)
- ✅ UI/UX requirements (mobile + web)
- ✅ Firebase setup guide
- ✅ 15-week implementation plan
- ✅ Troubleshooting guide

**System Highlights:**
- 🚀 Real-time fuel balance tracking
- 💰 Automated contract deduction
- 📱 Mobile app for drivers (Flutter)
- 💻 Web modals for EMD/SPMS (GAS)
- 🔥 Firebase backend (Firestore + Cloud Functions)
- 📊 Comprehensive audit trail
- 🎨 Modern Tailwind UI

**Next Steps:**
1. Review this document thoroughly
2. Set up Firebase project (Phase 1)
3. Start with authentication (Phase 1)
4. Follow the 15-week plan sequentially
5. Test each phase before proceeding

**Good luck with your implementation! 🚀**

---

**Document Version:** 1.0  
**Last Updated:** January 7, 2025  
**Author:** AI Assistant  
**For:** DepEd Caraga Region - Fuel & Vehicle Management System
