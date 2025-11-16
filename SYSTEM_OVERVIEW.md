# DPWH Vehicle Management System - Complete Overview

## System Architecture

### **Primary Goal**
Link travel authorization with fuel issuance, update contract balances in real-time, and analyze fuel efficiency through a fuel-by-contract arrangement system.

---

## User Roles & Access

### 1. **Admin**
- Full access to all features
- Can perform both EMD and SPMS functions
- Manages user accounts via admin-setup.html

### 2. **Driver**
- Create Driver's Trip Tickets (DTT)
- Request fuel (standalone RIS)
- View trip history and fuel requests
- Dashboard: index.html (driver interface)

### 3. **EMD Staff** (Equipment Management Division)
- Manage vehicles (add, edit, change status, fuel balance)
- Manage Price Master Table (weekly fuel prices)
- Validate RIS requests → Issue Temporary RIS
- Dashboard: staff-dashboard.html (EMD tabs)

### 4. **SPMS Staff** (Supply and Property Management Section)
- Manage fuel contracts
- Approve Driver's Trip Tickets
- Finalize RIS → Generate Real RIS numbers
- Post deductions to contract balance
- Dashboard: staff-dashboard.html (SPMS tabs)

---

## RIS Workflow (Fuel Request Process)

```
┌─────────────┐
│   DRIVER    │
│  Submits    │
│  RIS Request│
└──────┬──────┘
       │ Status: Pending
       ▼
┌─────────────┐
│  EMD STAFF  │
│  Validates  │
│ Temp RIS ID │
└──────┬──────┘
       │ Status: Validated
       │ Sets: Valid Until Date
       ▼
┌─────────────┐
│ SPMS STAFF  │
│  Finalizes  │
│  Real RIS   │
└──────┬──────┘
       │ Status: Finalized
       │ Generates: Real RIS No
       │ Links to: Fuel Contract
       │ Updates: Contract Balance
       │ Updates: Vehicle Fuel Balance (if vehicle type)
       ▼
   [COMPLETE]
```

---

## Firestore Collections

### **users**
Stores user profiles with roles
```javascript
{
  email: string,
  displayName: string,
  role: 'admin' | 'driver' | 'emd' | 'spms',
  permissions: array (for emd/spms),
  assignedVehicle: string (for driver),
  createdAt: timestamp
}
```

### **vehicles**
Vehicle database
```javascript
{
  brand: string,
  model: string,
  plateNo: string,
  dpwhNo: string,
  fuelCapacity: number,
  currentFuelBalance: number,
  status: 'Available' | 'In Use',
  createdAt: timestamp,
  createdBy: uid
}
```

### **priceMaster**
Weekly fuel prices by provider (managed by EMD)
```javascript
{
  provider: string, // Petron, Shell, Caltex, Seaoil, Phoenix, Total, Unioil, PTT, Other
  weekStartDate: date,
  dieselPrice: number,
  gasolinePrice: number,
  createdBy: uid,
  createdAt: timestamp,
  updatedAt: timestamp (optional)
}
```

### **fuelContracts**
Fuel-by-contract arrangements (managed by SPMS)
```javascript
{
  contractNo: string,
  supplier: string,
  fuelType: 'Gasoline' | 'Diesel',
  startDate: date,
  endDate: date,
  totalLiters: number,
  pricePerLiter: number,
  totalAmount: number,
  usedLiters: number,      // Auto-incremented when RIS finalized
  usedAmount: number,      // Auto-incremented when RIS finalized
  status: 'Active' | 'Closed' | 'Expired',
  createdBy: string,
  createdAt: timestamp
}
```

### **risRequests**
Fuel requisition and issue slips
```javascript
{
  // Base fields
  risId: string (Temp RIS ID: RIS_timestamp),
  requestType: 'vehicle' | 'non-vehicle' | 'dredge',
  status: 'Pending' | 'Validated' | 'Finalized' | 'Rejected',

  // Requester info
  requestedBy: string,
  requestedByUid: uid,
  requestedByEmail: email,
  requestedAt: timestamp,

  // Fuel details
  requisitionQty: number,
  issuanceQty: number,
  purpose: string,

  // Vehicle-specific (if requestType === 'vehicle')
  plateNo: string,
  dpwhNo: string,
  vehicle: string (brand + model),
  fuelBalanceBefore: number,
  linkedDttId: string (optional),

  // Dredge-specific (if requestType === 'dredge')
  dredgeType: string,
  dpwhNo: string,

  // Non-vehicle-specific (if requestType === 'non-vehicle')
  equipmentName: string,

  // EMD validation (status: Validated)
  validUntil: date,
  validatedQty: number (EMD can adjust the requested quantity),
  totalStockAfter: number (optional - remaining inventory after issuance),
  lastIssuanceDetails: { (optional - historical issuance tracking)
    date: date,
    controlNo: string,
    quantityStation: string,
    chargeInvoiceDate: string
  },
  emdRemarks: string,
  validatedBy: string,
  validatedByUid: uid,
  validatedAt: timestamp,

  // SPMS finalization (status: Finalized)
  realRisNo: string (Official RIS number),
  contractId: string (linked fuel contract),
  pricePerLiter: number,
  totalCost: number,
  spmsRemarks: string,
  finalizedBy: string,
  finalizedByUid: uid,
  finalizedAt: timestamp
}
```

### **dtts**
Driver's Trip Tickets
```javascript
{
  dttId: string,
  driverName: string,
  driverUid: uid,
  plateNo: string,
  vehicleModel: string,
  destination: string,
  purpose: string,
  periodFrom: date,
  periodTo: date,
  status: 'Pending' | 'Approved' | 'In-Progress' | 'Completed' | 'Rejected',

  // Trip details (filled when closing trip)
  timeDepartOffice: time,
  timeArrivalDest: time,
  timeDepartDest: time,
  timeArrivalOffice: time,
  approximateDistance: number,

  // Fuel consumption (filled when closing trip)
  balanceInTank: number,
  issuedByOffice: number,
  purchasedDuringTrip: number,
  totalGasoline: number,
  speedometerStart: number,
  speedometerEnd: number,
  distanceTravelled: number,

  // Approval tracking
  approvedBy: string,
  approvedByUid: uid,
  approvedAt: timestamp,

  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Key Features by Module

### **EMD Staff Dashboard**

#### 1. Vehicle Management
- Add new vehicles (brand, model, plate no, DPWH no)
- Edit vehicle details and current fuel balance
- Change vehicle status (Available ↔ In Use)
- View all vehicles in sortable table

#### 2. Price Master Table
- Add new fuel prices by gasoline provider
- Support for multiple providers (Petron, Shell, Caltex, Seaoil, Phoenix, Total, Unioil, PTT, Other)
- Weekly price tracking per provider
- Each provider can have different prices for Gasoline and Diesel
- Edit existing prices
- Historical price tracking by provider

#### 3. RIS Validation
- View all pending fuel requests
- Set "Valid for Issuance until" date
- **Validate and adjust quantity** (can re-set from requested quantity)
- **Track total stock after issuance** (optional - remaining inventory)
- **Record Last Issuance Details:**
  - RIS/Last Issuance Date
  - Control No.
  - Quantity/Gasoline Station
  - Charge Invoice/Date
- Add EMD remarks
- Validate (Pending → Validated) or Reject
- Issues Temporary RIS ID

### **SPMS Staff Dashboard**

#### 1. Fuel Contracts Management
- Add new contracts (contract no, supplier, dates, quantities)
- Real-time balance tracking
  - Total contract amount
  - Used amount
  - Remaining balance
  - Utilization percentage (progress bar)
- View contract details with linked RIS history
- Close expired contracts

#### 2. DTT Approval
- View all pending trip tickets
- Approve or reject DTTs
- Track approver and timestamps

#### 3. RIS Finalization
- View all validated RIS (with Temp RIS ID)
- Select fuel contract to charge against
- Generate Real RIS number (official)
- Set actual issuance quantity
- Auto-calculate cost from Price Master
- **Real-time contract balance update:**
  - Increments `usedLiters` in contract
  - Increments `usedAmount` in contract
- **Auto-update vehicle fuel balance** (for vehicle types)
- Validated → Finalized status change

#### 4. Analytics Dashboard
- Total finalized RIS count
- Total liters issued
- Total fuel cost
- Trip tickets count
- (Future: fuel efficiency per vehicle, trends, monthly reports)

### **Driver Dashboard**

#### 1. Create Driver's Trip Ticket
- Vehicle search with modal picker
- Date validation (From ≤ To)
- Trip details deferred to "Close Trip" function
- Submit for SPMS approval

#### 2. Request Fuel (Standalone RIS)
- Three request types:
  1. **For Vehicle** - Search and select vehicle, optional link to DTT
  2. **For Non-Vehicle** - Generator, portable equipment
  3. **For Dredge** - DPWH No + Equipment Type (no DTT required)
- Set fuel quantity and purpose
- "Valid for Issuance until" shown (disabled, set by EMD)

---

## Real-Time Contract Balance Updates

### When SPMS finalizes a RIS:

1. **RIS Document Updated:**
   ```javascript
   {
     status: 'Finalized',
     contractId: 'FC-2025-001',
     realRisNo: 'RIS-2025-001',
     issuanceQty: 50,
     pricePerLiter: 65.50,
     totalCost: 3275.00,
     finalizedBy: 'Juan Dela Cruz',
     finalizedAt: timestamp
   }
   ```

2. **Contract Balance Auto-Updated:**
   ```javascript
   fuelContracts/FC-2025-001:
   {
     usedLiters: INCREMENT(50),      // Adds 50 liters
     usedAmount: INCREMENT(3275.00), // Adds ₱3,275.00
     updatedAt: timestamp
   }
   ```

3. **Vehicle Fuel Balance Auto-Updated** (if vehicle type):
   ```javascript
   vehicles/PLATE_NO:
   {
     currentFuelBalance: INCREMENT(50), // Adds 50 liters
     updatedAt: timestamp
   }
   ```

---

## File Structure

```
driver-pwa/
├── index.html                 # Driver login & dashboard
├── create-dtt.html            # Create trip ticket
├── request-fuel.html          # Request fuel (RIS)
├── my-trips.html              # View trip history
├── profile.html               # Driver profile
├── staff-dashboard.html       # EMD & SPMS consolidated dashboard
├── admin-setup.html           # Admin: create users, import vehicles
├── modal-system.js            # Gmail-style modal system
├── modal-styles.css           # Modal CSS
├── firebase-config.js         # Firebase configuration
├── manifest.json              # PWA manifest
├── service-worker.js          # Offline support
└── SYSTEM_OVERVIEW.md         # This file
```

---

## Workflow Examples

### Example 1: Vehicle Fuel Request

1. **Driver** creates RIS for vehicle H1 5750, requests 50 liters
   - Status: **Pending**
   - Temp RIS ID: **RIS_1704524400000**

2. **EMD Staff** validates the request
   - Sets Valid Until: **2025-01-15**
   - Validates quantity: **50 liters** (confirmed from requested)
   - Sets total stock after issuance: **950 liters** (tracking inventory)
   - Records Last Issuance Details:
     - Date: **2025-01-10**
     - Control No: **CTRL-2025-001**
     - Quantity/Station: **50L / Petron Station**
     - Charge Invoice/Date: **INV-2025-001 / 01/10/2025**
   - Adds remark: "Approved for regular patrol"
   - Status: **Validated**

3. **SPMS Staff** finalizes the RIS
   - Links to Contract: **FC-2025-001** (Petron, 10,000L remaining)
   - Generates Real RIS No: **RIS-2025-001**
   - Issuance: **50 liters**
   - Price: **₱65.50/L** (from Price Master)
   - Total Cost: **₱3,275.00**
   - Status: **Finalized**
   - **Contract FC-2025-001**:
     - Used: 50L (was 0L)
     - Remaining: 9,950L (was 10,000L)
   - **Vehicle H1 5750**:
     - Fuel Balance: 50L (was 0L)

### Example 2: Dredge Fuel Request

1. **Driver** creates RIS for dredge operations
   - Type: **Dredge**
   - DPWH No: **DPWH-DREDGE-001**
   - Equipment: **Cutter Suction Dredge**
   - Quantity: **200 liters**
   - **No DTT required** ✓

2. **EMD validates** → **SPMS finalizes** (same as above)

---

## Benefits of This System

### 1. **Real-Time Contract Tracking**
- Instant visibility of contract utilization
- Prevents over-spending
- Alerts when contract balance is low

### 2. **Linked Travel Authorization**
- DTT must be approved before fuel can be issued
- Optional linking of RIS to specific trips
- Complete audit trail

### 3. **Fuel Efficiency Analytics**
- Track fuel consumption per vehicle
- Compare with distance traveled (from DTT)
- Identify inefficient vehicles or unusual consumption

### 4. **Accurate Cost Allocation**
- Price Master ensures correct pricing
- Historical price tracking
- Contract-specific pricing honored

### 5. **Audit Compliance**
- Temporary RIS → Real RIS workflow
- Two-level approval (EMD → SPMS)
- Complete timestamps and approval history
- Linked to specific contracts for accountability

### 6. **No Manual Balance Updates**
- Firestore transactions ensure atomic updates
- Contract balances auto-decrement
- Vehicle fuel balances auto-increment
- Eliminates human error

---

## RIS Document Format

### Official DPWH RIS Structure

**Header:**
- RIS Number (e.g., 2025-08-1489)
- Division
- Date

**Body:**
- Stock No
- Unit (liters)
- Description (Diesel/Gasoline)
- Quantity
- Gasoline Provider
- Total Stock After Issuance (PHP or Liters)
- Validity (e.g., Valid for Issuance until: November 17, 2025)
- Passenger/s
- Inclusive Dates of
- Purpose/s
- Model / Plate / DPWH No.

**Last Issuance Details:**
- RIS No./Last Issuance Date
- Control No.
- Quantity/Gasoline Station
- Charge Invoice/Date

---

## Next Steps (Future Enhancements)

1. **Print Temporary RIS** (EMD)
   - Generate PDF using official DPWH RIS format
   - Populate header with Temp RIS ID, Division, Date
   - Include all body fields: Stock No, Unit, Description, Quantity
   - Show Gasoline Provider and Total Stock After Issuance
   - Display Validity date set by EMD
   - Include Last Issuance Details section
   - EMD signature field
   - Print for physical records

2. **Print Real RIS** (SPMS)
   - Generate official RIS PDF using same format
   - Replace Temp RIS ID with Real RIS Number
   - Include contract details (Supplier, Contract No.)
   - Show final issuance quantity and pricing
   - Link to Fuel Contract information
   - SPMS signature and approval
   - Include contract deduction details

3. **Close DTT with Trip Details**
   - Record actual times, distances, fuel consumed
   - Calculate fuel efficiency (km/L)
   - Link to related RIS requests

4. **Advanced Analytics**
   - Fuel efficiency per vehicle
   - Monthly consumption trends
   - Contract utilization forecasting
   - Cost per kilometer analysis

5. **Mobile Optimizations**
   - Better offline support
   - Push notifications for approvals
   - Camera integration for receipts

6. **Email Notifications**
   - RIS approval notifications
   - Low contract balance alerts
   - Weekly summary reports

---

## Technical Notes

### Firestore Security Rules Needed
```javascript
// Allow authenticated users to read/write their own data
// Allow EMD to manage vehicles and prices
// Allow SPMS to manage contracts and finalize RIS
// Allow drivers to create DTT and RIS
```

### Firestore Indexes Required
```
risRequests: (status, validatedAt) DESC
risRequests: (status, finalizedAt) DESC
risRequests: (contractId, status, finalizedAt) DESC
fuelContracts: (status, startDate) DESC
dtts: (driverUid, status, createdAt) DESC
priceMaster: (fuelType, effectiveDate) DESC
```

---

## Summary

This system achieves the primary goal of linking travel authorization (DTT) with fuel issuance (RIS), updating contract balances in real-time, and providing analytics for fuel efficiency. The three-tier approval workflow (Driver → EMD → SPMS) ensures accountability, while automatic balance updates eliminate manual errors and provide instant visibility into contract utilization.
