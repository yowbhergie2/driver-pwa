# Vehicle Import Guide

## Fixed Issues

### ✅ Authentication Error
**Problem**: "Missing or insufficient permissions" when importing vehicles
**Solution**: Added admin login screen to admin-setup.html

### ✅ Invalid Document Reference
**Problem**: Plate numbers with `/` (like `SGZ-900 / XNK-990`) caused Firestore errors
**Solution**: Automatically sanitize plate numbers - replace `/`, spaces, and special chars with `_`

## How to Import Vehicles

### Step 1: Create Admin Account

First, you need an admin account to access the admin panel.

**Option A: Use create-test-users.html**
```
1. Open: http://localhost:5000/create-test-users.html
2. Email: admin@dpwh.gov.ph
3. Password: admin123 (or your choice)
4. Click "Create User"
```

**Option B: Use Firebase Console**
1. Go to Firebase Console → Authentication
2. Add user manually
3. Note the email and password

### Step 2: Login to Admin Panel

```
1. Open: http://localhost:5000/admin-setup.html
2. Login with admin credentials you created
3. You'll see the admin panel after successful login
```

### Step 3: Format Your CSV

Your vehicle list should be in this format:
```
Brand,Model,PlateNo,DpwhNo
```

**Example:**
```
TOYOTA,VIOS,H1 5750,DPWH-001
MITSUBISHI,STRADA,H1 5751,DPWH-002
ISUZU,D-MAX,SGZ-900 / XNK-990,DPWH-003
```

**Special Cases Handled:**
- Spaces in plate numbers: `H1 5750` → `H1_5750` (document ID)
- Slashes in plate numbers: `SGZ-900 / XNK-990` → `SGZ-900___XNK-990` (document ID)
- Original plate number is preserved in the `plateNo` field

### Step 4: Import

1. Copy your CSV data
2. Paste into the textarea in **Step 2: Import Service Vehicles**
3. Click **Import Vehicles**
4. Wait for confirmation

## Troubleshooting

### Error: "Missing or insufficient permissions"
- **Cause**: Not logged in
- **Solution**: Login via the admin panel first

### Error: "Invalid document reference"
- **Cause**: Special characters in plate numbers
- **Solution**: This is now fixed automatically! Just import normally.

### Error: "Email already in use"
- **Cause**: Admin account already exists
- **Solution**: Use existing admin credentials to login

### Vehicles not showing up
- **Cause**: May need to refresh
- **Solution**: Click the "Refresh List" button in Step 4

## CSV Format Tips

### ✅ Correct Format
```
TOYOTA,VIOS,H1 5750,DPWH-001
MITSUBISHI,STRADA,H1 5751,DPWH-002
```

### ❌ Common Mistakes
```
# Missing DPWH No
TOYOTA,VIOS,H1 5750

# Extra commas
TOYOTA,VIOS,H1 5750,DPWH-001,

# Missing commas
TOYOTA VIOS H1 5750 DPWH-001
```

## After Import

After successful import, you can:

1. **View All Vehicles**: Scroll to **Step 4: Current Vehicles in Database**
2. **Add Single Vehicle**: Use **Step 3** for manual entry
3. **Create EMD Account**: Use **Step 1** to create EMD staff accounts

## Database Structure

Each vehicle is stored with this structure:
```javascript
{
  brand: "TOYOTA",              // Vehicle brand (uppercase)
  model: "VIOS",                // Vehicle model (uppercase)
  plateNo: "H1 5750",           // Original plate number (uppercase)
  dpwhNo: "DPWH-001",           // DPWH inventory number (uppercase)
  fuelCapacity: 50,             // Default fuel capacity in liters
  currentFuelBalance: 0,        // Current fuel balance
  status: "Available",          // Vehicle status
  createdAt: <timestamp>        // Creation timestamp
}
```

## Next Steps

After importing vehicles:

1. ✅ Create EMD Staff account (Step 1)
2. ✅ Import vehicles (Step 2)
3. 🔄 Test driver workflow
4. 🚀 Deploy to production

---

**Last Updated**: 2025-11-14
**Author**: Claude Code Assistant
