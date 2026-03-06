# MedSync Web Application — Output Pages

This document lists all user-visible pages and views in the MedSync hospital admin web dashboard. It is intended to support the **Output Design** section of the project documentation.

---

## Page Name: Login

**Purpose:**
Provides a secure authentication interface for hospital administrators to access the web dashboard.

**Displays:**
- MedSync branding with animated ECG heartbeat line and tagline
- Username input field
- Password input field
- Error message on invalid credentials

**UI Components:**
- Glass-morphism login card (GlassSurface)
- Branded SVG animation (ECG line with glow effect)
- Form inputs with floating labels
- Gradient submit button
- Responsive layout (branding panel on desktop, compact on mobile)

---

## Page Name: Admin Dashboard

**Purpose:**
Displays a real-time overview of hospital activity, emergency status, and key operational metrics. This is the primary landing page after login.

**Displays:**
- Hospital rush level (LOW / MEDIUM / HIGH / CRITICAL) with animated gauge
- Number of doctors on duty vs. total doctors
- Count of active ambulances currently on duty
- SOS requests summary (Total, In Progress, Pending, Assigned)
- Critical alerts for equipment maintenance and low stock
- Patient inflow chart over the last 24 hours
- SOS trend bar chart over the last 24 hours

**UI Components:**
- Dashboard stat cards (GlassSurface panels)
- Rush level gauge (SVG needle indicator with color-coded arcs)
- SOS summary grid with color-coded status tiles
- Critical alerts list with severity indicators and scrollable container
- Patient inflow area/line chart (SVG with gradient fill)
- SOS trend bar chart (SVG bars with hover tooltips)
- Side navigation bar
- Top navigation bar with admin greeting
- Real-time polling (auto-refresh every 30 seconds)

---

## Page Name: Ambulance Dashboard

**Purpose:**
Provides a management view of all ambulance drivers associated with the hospital, including their availability and assignment status.

**Displays:**
- Summary counts: Total Drivers, Active, On Assignment, Inactive
- Hospital name associated with the admin
- List of all ambulance drivers with details:
  - Driver name
  - Phone number
  - Vehicle number
  - Active/Inactive status badge
  - Distance from hospital (in km)

**UI Components:**
- Summary stat cards (Total, Active, On Assignment, Inactive)
- Driver list table/cards with status badges
- Color-coded status indicators (green for active, red for inactive)
- Loading spinner during data fetch
- Error/empty state messages
- Real-time polling (auto-refresh every 30 seconds)
- Side navigation bar
- Top navigation bar

---

## Page Name: Doctors

**Purpose:**
Allows hospital administrators to view, search, filter, and add doctors registered under their hospital facility.

**Displays:**
- Total count of doctors and filtered result count
- Doctor list with:
  - Doctor name and initials avatar
  - Qualifications
  - On-Duty / Off-Duty status
  - Department
  - Last check-in time
- Add Doctor form (modal) with fields:
  - First name, Last name, Username, Email, Password
  - Phone, Date of birth, Gender
  - Medical Registration Number (MRN)
  - Department, Qualifications

**UI Components:**
- Data table with sortable columns (Name, Status, Department, Last Check-in)
- Department filter dropdown
- Status filter dropdown (All, On-Duty, Off-Duty)
- Search input (search by name, department, MRN)
- "Clear filters" action link
- "Add Doctor" button and modal dialog
- Modal form with input validation and success/error messages
- Color-coded status badges (green for On-Duty, red for Off-Duty)
- Loading spinner
- Side navigation bar
- Top navigation bar

---

## Page Name: Equipment

**Purpose:**
Enables hospital administrators to monitor, manage, and update the status of all hospital equipment in their facility.

**Displays:**
- Equipment status summary counts: Available, In Use, Maintenance, Out of Order
- Equipment list with:
  - Equipment name
  - Equipment-specific icon (ventilator, defibrillator, ECG, generic lab)
  - Current status (Available, In Use, Maintenance, Out of Order)
  - Last checked date and time
- Add Equipment form (modal)
- Status change dropdown per equipment item

**UI Components:**
- Summary stat cards with color-coded dot indicators
- Equipment card grid with icons and status badges
- Search bar for filtering by equipment name
- Status filter tabs (All, Available, In Use, Maintenance, Out of Order) with counts
- "Add Equipment" button and modal form
- Context menu (three-dot dropdown) for changing equipment status
- Color-coded status labels (green, blue, yellow, red)
- Loading and error states
- Side navigation bar

---

## Page Name: Alerts

**Purpose:**
Displays all hospital alerts including equipment warnings, low stock notifications, and inter-hospital messages. Also provides messaging capabilities to doctors and other hospitals.

**Displays:**
- Alert summary: Total, Critical, Warning, Info counts
- Alert list with:
  - Alert type (Equipment Maintenance, Low Stock, Hospital Message)
  - Severity level (critical, warning, info)
  - Alert title and description
  - Timestamp
  - Source hospital (for inter-hospital messages)
  - Read/unread status for hospital messages
- Send Message to Doctors modal:
  - List of hospital doctors with selection checkboxes
  - "Send to All" toggle
  - Message text input
- Send Message to Hospitals modal:
  - Searchable hospital list with fuzzy matching
  - Hospital selection checkboxes
  - "Send to All Hospitals" toggle
  - Subject, message, and priority (normal/urgent/emergency) fields
- Reply to Hospital Message modal

**UI Components:**
- Alert summary stat cards with colored badges
- Filter tabs (All, Critical, Warning, Info)
- Alert cards with severity-colored borders and icons
- "Message Doctors" button and modal with doctor checklist
- "Message Hospitals" button and modal with hospital selection and fuzzy search
- Reply modal for inter-hospital messages
- Mark-as-read functionality for hospital messages
- Color-coded severity badges and styling (red for critical, amber for warning, blue for info)
- Loading spinners and empty states
- Side navigation bar
- Top navigation bar

---

## Page Name: SOS Emergencies

**Purpose:**
Provides a real-time emergency tracking view showing incoming SOS requests assigned to the hospital, with an interactive map displaying patient, ambulance, and hospital locations.

**Displays:**
- List of incoming SOS emergency requests with:
  - SOS ID
  - Patient name
  - Severity level (Critical, Severe, Moderate, Mild)
  - Current status (Driver Assigned, Driver Arrived, Awaiting Driver)
  - Time since request
- Interactive map showing:
  - Hospital location marker (red)
  - Patient location marker (orange, animated pulse)
  - Ambulance/driver location marker (blue, animated bounce)
  - Animated route polyline (driver → patient → hospital)
- Selected SOS detail panel:
  - Patient information
  - Assigned driver/ambulance details
  - Vehicle number
  - Hospital destination

**UI Components:**
- SOS request list with severity-colored cards
- Leaflet.js interactive map with custom styled markers
- Animated map markers (pulse, bounce, ripple effects)
- Dashed animated route polyline between driver, patient, and hospital
- Map popups with entity details on marker click
- Severity badges (color-coded: red, orange, amber, green)
- Status badges (color-coded: blue, green, yellow)
- Time-ago formatting for request timestamps
- Auto-refresh polling every 5 seconds for real-time updates
- Side navigation bar
- Top navigation bar

---

## Page Name: Settings

**Purpose:**
Allows hospital administrators to manage their personal profile, hospital information, and account security settings.

**Displays:**
- **Profile Section:**
  - First name, Last name
  - Email, Phone
  - Username (read-only)
  - Role (read-only)
  - Date of birth
  - Gender
  - Address
- **Hospital Info Section:**
  - Hospital name
  - Hospital address
  - Hospital phone
  - Hospital email
  - District
- **Security Section:**
  - Current password field
  - New password field
  - Confirm password field

**UI Components:**
- Settings navigation sidebar with section tabs (Profile, Hospital Info, Security)
- Profile edit form with input fields and "Save Changes" button
- Hospital info edit form with input fields and "Save Changes" button
- Password change form with validation (minimum length, match confirmation)
- Success/error notification banners (green/red)
- Section icons for navigation items
- Loading spinner during page load
- Side navigation bar
- Top navigation bar

---

## Shared UI Components (Present Across All Authenticated Pages)

### Side Navigation Bar (SideNav)

**Purpose:**
Provides consistent navigation across all dashboard pages.

**Displays:**
- MedSync logo and branding
- Navigation links: Dashboard, Ambulances, Doctors, Equipment, Alerts (with critical alert count badge), SOS Emergencies, Settings
- Active page indicator
- Logout button

**UI Components:**
- Collapsible sidebar (hamburger menu on mobile)
- Navigation links with icons
- Alert count badge (red) on Alerts link
- Active link highlighting
- Mobile overlay backdrop

### Top Navigation Bar (TopNavbar)

**Purpose:**
Displays the current page title and admin user greeting.

**Displays:**
- Page title and subtitle
- Admin name greeting

**UI Components:**
- Page heading text
- Admin user display
