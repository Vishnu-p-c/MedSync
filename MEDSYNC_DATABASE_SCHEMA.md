# MedSync Database Schema Documentation

This document describes all MongoDB collections used in the MedSync system. It is intended to support the **Database Design** section of the project documentation.

**Database:** MongoDB (NoSQL Document Database)
**ODM:** Mongoose

---

## Table: users

**Purpose:**
Stores basic account information for all system users including patients, doctors, drivers, and administrators.

**Primary Key:** `user_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| user_id | Number | Unique identifier for the user | Yes |
| first_name | String | User's first name (max 50 chars) | Yes |
| last_name | String | User's last name (max 50 chars) | No |
| username | String | Unique login username (max 50 chars) | Yes |
| password_hash | String | Hashed password for authentication (max 255 chars) | Yes |
| role | String | User role — one of: `admin`, `doctor`, `driver`, `patient` | Yes |
| email | String | Unique email address (max 100 chars) | Yes |
| phone | String | Contact phone number (max 20 chars) | Yes |
| date_of_birth | Date | User's date of birth | Yes |
| gender | String | Gender — one of: `male`, `female`, `other` | Yes |
| address | String | Residential address (max 500 chars) | No |
| latitude | Number | User's latitude coordinate | No |
| longitude | Number | User's longitude coordinate | No |
| fcm_token | String | Firebase Cloud Messaging token for push notifications | No |
| token_last_update | Date | Timestamp of last FCM token update | No |
| created_at | Date | Account creation timestamp (defaults to current time) | No |
| last_login | Date | Timestamp of last login | No |

---

## Table: doctordetails

**Purpose:**
Stores doctor-specific professional details, hospital/clinic affiliations, attendance status, and per-hospital availability tracking.

**Primary Key:** `doctor_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| doctor_id | Number | Unique doctor identifier (references `users.user_id`) | Yes |
| hospital_id | Array\<Number\> | List of hospital IDs where the doctor consults (references `hospitals`) | No |
| clinic_id | Array\<Number\> | List of clinic IDs where the doctor consults (references `clinics`) | No |
| first_name | String | Doctor's first name (max 100 chars) | Yes |
| last_name | String | Doctor's last name (max 100 chars) | No |
| mrn | String | Medical Registration Number (max 50 chars) | Yes |
| name | String | Full display name (max 100 chars) | No |
| department | String | Medical department or specialization (max 100 chars) | Yes |
| is_available | Boolean | Whether the doctor is currently available | No |
| last_attendance_time | Date | Timestamp of last attendance marking | No |
| hospital_attendance | Map\<hospitalAttendance\> | Per-hospital attendance map (keyed by hospital_id as string) | No |
| current_hospital_id | Number | Hospital ID where doctor is currently marked available (references `hospitals`) | No |
| multi_place | Boolean | Whether the doctor consults at multiple locations | Yes |
| qualifications | Array\<String\> | List of qualifications (e.g., MBBS, MD, MS) | Yes |
| hospitals | Array\<String\> | List of hospital names for display purposes | No |
| clinics | Array\<String\> | List of clinic names for display purposes | No |
| fcm_token | String | Firebase Cloud Messaging token for push notifications | No |
| token_last_update | Date | Timestamp of last FCM token update | No |

**Embedded Sub-document — hospitalAttendance:**

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| last_marked_at | Date | Timestamp when attendance was last marked at this hospital | No |
| is_available | Boolean | Whether doctor is available at this hospital | No |

---

## Table: hospitals

**Purpose:**
Stores information about hospitals registered in the MedSync system, including location and current rush level.

**Primary Key:** `hospital_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| hospital_id | Number | Unique identifier for the hospital | Yes |
| name | String | Hospital name (max 100 chars) | Yes |
| address | String | Physical address (max 255 chars) | No |
| latitude | Number | Hospital latitude coordinate | No |
| longitude | Number | Hospital longitude coordinate | No |
| rush_level | String | Current rush level — one of: `low`, `medium`, `high`, `critical` | No |
| NFC_SNO | String | NFC serial number for attendance scanning | No |
| spass | String | Security pass / verification code | No |
| updated_at | Date | Timestamp of last record update (defaults to current time) | No |

---

## Table: clinics

**Purpose:**
Stores information about clinics where doctors may consult, separate from hospitals.

**Primary Key:** `clinic_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| clinic_id | Number | Unique identifier for the clinic | Yes |
| name | String | Clinic name (max 100 chars) | Yes |
| address | String | Physical address (max 255 chars) | No |
| latitude | Number | Clinic latitude coordinate | No |
| longitude | Number | Clinic longitude coordinate | No |
| NFC_SNO | String | NFC serial number for attendance scanning | No |
| spass | String | Security pass / verification code | No |

---

## Table: hospitaladmins

**Purpose:**
Maps administrator users to their associated hospital or clinic, establishing the admin-to-facility relationship.

**Primary Key:** `_id` (MongoDB ObjectId)

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| admin_id | Number | Admin's user ID (references `users.user_id`) | Yes |
| hospital_id | Number | Associated hospital ID (references `hospitals.hospital_id`) | No |
| clinic_id | Number | Associated clinic ID (references `clinics.clinic_id`) | No |
| admin_type | String | Type of admin — one of: `hospital`, `clinic` | No |

---

## Table: ambulancedrivers

**Purpose:**
Stores ambulance driver details, vehicle information, and their active/inactive status for emergency dispatch.

**Primary Key:** `driver_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| driver_id | Number | Unique driver identifier (references `users.user_id`) | Yes |
| first_name | String | Driver's first name (max 100 chars) | No |
| last_name | String | Driver's last name (max 100 chars) | No |
| license_number | String | Driver's license number (max 100 chars) | No |
| vehicle_number | String | Ambulance vehicle registration number (max 50 chars) | No |
| is_active | Boolean | Whether the driver is currently active/on duty | No |
| fcm_token | String | Firebase Cloud Messaging token for SOS notifications | No |
| token_last_update | Date | Timestamp of last FCM token update | No |

---

## Table: ambulancelivelocations

**Purpose:**
Tracks the real-time GPS location of each ambulance driver for dispatch and map display.

**Primary Key:** `driver_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| driver_id | Number | Driver identifier (references `ambulancedrivers.driver_id`) | Yes |
| latitude | Number | Current latitude coordinate of the ambulance | No |
| longitude | Number | Current longitude coordinate of the ambulance | No |
| updated_at | Date | Timestamp of last location update (defaults to current time) | No |

---

## Table: ambulanceassignments

**Purpose:**
Records ambulance assignments to SOS emergency requests, linking a driver and hospital to a specific emergency case.

**Primary Key:** `assignment_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| assignment_id | Number | Unique identifier for the assignment | Yes |
| sos_id | Number | Associated SOS request ID (references `sosrequests.sos_id`) | No |
| driver_id | Number | Assigned driver ID (references `ambulancedrivers.driver_id`) | No |
| assigned_hospital_id | Number | Destination hospital ID (references `hospitals.hospital_id`) | No |
| assigned_at | Date | Timestamp when the assignment was made | No |
| route_eta | Number | Estimated time of arrival in minutes | No |
| is_completed | Boolean | Whether the assignment has been completed | No |
| completed_at | Date | Timestamp when the assignment was completed | No |

---

## Table: sosrequests

**Purpose:**
Stores all SOS emergency requests raised by patients, including severity, status, driver assignment workflow, and hospital assignment.

**Primary Key:** `sos_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| sos_id | Number | Unique identifier for the SOS request | Yes |
| patient_id | Number | Patient who raised the SOS (references `users.user_id`) | No |
| latitude | Number | Patient's latitude at time of SOS | No |
| longitude | Number | Patient's longitude at time of SOS | No |
| severity | String | Emergency severity — one of: `critical`, `severe`, `moderate`, `mild`, `unknown` | No |
| status | String | Current request status — one of: `pending`, `awaiting_driver`, `awaiting_driver_response`, `assigned`, `driver_arrived`, `cancelled`, `completed` | No |
| created_at | Date | Timestamp when the SOS was created (defaults to current time) | No |
| eta_minutes | Number | Estimated time of arrival for the ambulance (in minutes) | No |
| cancelled_before_pickup | Boolean | Whether the SOS was cancelled before patient pickup | No |
| assigned_driver_id | Number | ID of the finally assigned driver (references `ambulancedrivers.driver_id`) | No |
| assigned_at | Date | Timestamp when a driver was assigned | No |
| arrived_at | Date | Timestamp when the driver arrived at the patient's location | No |
| assigned_hospital_id | Number | Hospital assigned for the emergency (references `hospitals.hospital_id`) | No |
| current_driver_candidate | Number | Driver currently being asked to accept (references `ambulancedrivers.driver_id`) | No |
| rejected_drivers | Array\<Number\> | List of driver IDs who rejected the request | No |
| request_sent_at | Date | Timestamp when the current driver candidate was notified | No |
| candidate_queue | Array\<Number\> | Queue of eligible driver IDs ordered by proximity (nearest first) | No |

---

## Table: appointments

**Purpose:**
Stores patient appointment records with doctors, supporting both hospital-based and clinic-based consultations with token-based queuing.

**Primary Key:** `appointment_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| appointment_id | Number | Unique identifier for the appointment | Yes |
| patient_id | Number | Patient's user ID (references `users.user_id`) | No |
| doctor_id | Number | Doctor's ID (references `doctordetails.doctor_id`) | No |
| hospital_id | Number | Hospital ID if consultation is at hospital (references `hospitals.hospital_id`) | No |
| clinic_id | Number | Clinic ID if consultation is at clinic (references `clinics.clinic_id`) | No |
| consultation_place | String | Where consultation happens — one of: `hospital`, `clinic` | No |
| clinic_name | String | Clinic name when consultation is at a clinic (max 200 chars) | No |
| appointment_time | Date | Scheduled date and time for the appointment | No |
| token_number | Number | Token/queue position number for the time slot | No |
| status | String | Appointment status — one of: `upcoming`, `cancelled`, `completed`, `expired` | No |
| created_at | Date | Timestamp when the appointment was created (defaults to current time) | No |

---

## Table: conversations

**Purpose:**
Stores messaging conversation threads between patients and doctors, or between hospitals and doctors, with unread message tracking.

**Primary Key:** `_id` (MongoDB ObjectId)

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| type | String | Conversation type — one of: `patient_doctor`, `hospital_doctor` | Yes |
| participants | Array\<participant\> | List of participants in the conversation | Yes |
| created_by | Number | User ID of the conversation creator | Yes |
| doctor_id | Number | Doctor's ID in the conversation (references `doctordetails.doctor_id`) | Yes |
| patient_id | Number | Patient's user ID, if applicable (references `users.user_id`) | No |
| hospital_id | Number | Hospital ID, if applicable (references `hospitals.hospital_id`) | No |
| last_message | String | Preview text of the last message sent (max 500 chars) | No |
| last_message_sender | Number | User ID of the last message sender | No |
| last_message_at | Date | Timestamp of the last message | No |
| unread_count | unreadCount | Unread message counts per role | No |
| is_active | Boolean | Whether the conversation is active | No |
| created_at | Date | Timestamp when the conversation was created (defaults to current time) | No |
| updated_at | Date | Timestamp of last conversation update (defaults to current time) | No |

**Embedded Sub-document — participant:**

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| user_id | Number | Participant's user ID | Yes |
| role | String | Participant's role — one of: `patient`, `doctor`, `hospital` | Yes |

**Embedded Sub-document — unreadCount:**

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| doctor | Number | Unread message count for the doctor | No |
| patient | Number | Unread message count for the patient | No |
| hospital | Number | Unread message count for the hospital | No |

---

## Table: messages

**Purpose:**
Stores individual messages within conversations, supporting text, image, and file message types with read tracking.

**Primary Key:** `_id` (MongoDB ObjectId)

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| conversation_id | ObjectId | Reference to the parent conversation (references `conversations._id`) | Yes |
| sender_id | Number | User ID of the message sender | Yes |
| sender_role | String | Role of the sender — one of: `patient`, `doctor`, `hospital` | Yes |
| receiver_id | Number | User ID of the message receiver | Yes |
| receiver_role | String | Role of the receiver — one of: `patient`, `doctor`, `hospital` | Yes |
| message_type | String | Type of message — one of: `text`, `image`, `file` | Yes |
| content | String | Message content/body text (max 2000 chars) | Yes |
| is_read | Boolean | Whether the message has been read by the receiver | No |
| read_at | Date | Timestamp when the message was read | No |
| created_at | Date | Timestamp when the message was created (defaults to current time) | No |

---

## Table: interhospitalmessages

**Purpose:**
Stores messages exchanged between hospitals for inter-hospital communication, supporting priorities, replies, and broadcast messages.

**Primary Key:** `message_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| message_id | Number | Unique identifier for the message | Yes |
| from_hospital_id | Number | Sending hospital ID (references `hospitals.hospital_id`) | Yes |
| to_hospital_id | Number | Receiving hospital ID (references `hospitals.hospital_id`) | Yes |
| from_admin_id | Number | Admin user ID who sent the message | No |
| message | String | Message body text (max 2000 chars) | Yes |
| subject | String | Message subject line (max 200 chars) | No |
| priority | String | Message priority — one of: `normal`, `urgent`, `critical` | No |
| is_read | Boolean | Whether the message has been read | No |
| read_at | Date | Timestamp when the message was read | No |
| is_broadcast | Boolean | Whether this is a broadcast message to all hospitals | No |
| parent_message_id | Number | ID of the parent message if this is a reply | No |
| timestamp | Date | Timestamp when the message was sent (defaults to current time) | No |

---

## Table: doctorschedules

**Purpose:**
Stores doctor consultation schedules for each hospital and clinic, including time slots, slot durations, and patient capacity per slot.

**Primary Key:** `doctor_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| doctor_id | Number | Doctor's ID (references `doctordetails.doctor_id`) | Yes |
| hospital_schedule | Map\<locationSchedule\> | Map of hospital-based schedules keyed by hospital_id | No |
| clinic_schedule | Map\<locationSchedule\> | Map of clinic-based schedules keyed by clinic_id | No |

**Embedded Sub-document — locationSchedule:**

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| location_name | String | Name of the hospital or clinic | Yes |
| slots | Array\<slot\> | List of time slot definitions for this location | No |

**Embedded Sub-document — slot:**

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| day | String | Day of the week — one of: `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday` | Yes |
| start | String | Slot start time in HH:MM format (e.g., "09:00") | Yes |
| end | String | Slot end time in HH:MM format (e.g., "13:00") | Yes |
| slot_duration | Number | Duration of each slot in minutes (default: 30) | No |
| max_patients | Number | Maximum patients per slot (default: 4) | No |

---

## Table: doctorattendancelogs

**Purpose:**
Records a timestamped log entry each time a doctor marks attendance at a hospital, used for attendance history and audit.

**Primary Key:** `log_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| log_id | Number | Unique identifier for the log entry | Yes |
| doctor_id | Number | Doctor who marked attendance (references `doctordetails.doctor_id`) | No |
| hospital_id | Number | Hospital where attendance was marked (references `hospitals.hospital_id`) | No |
| timestamp | Date | Timestamp of the attendance event (defaults to current time) | No |

---

## Table: equipmentstatuses

**Purpose:**
Tracks hospital equipment inventory and operational status for maintenance monitoring and alert generation.

**Primary Key:** `equipment_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| equipment_id | Number | Unique identifier for the equipment | Yes |
| hospital_id | Number | Hospital that owns the equipment (references `hospitals.hospital_id`) | No |
| equipment_name | String | Name of the equipment (max 100 chars) | Yes |
| status | String | Equipment operational status — one of: `working`, `down`, `maintenance` | No |
| last_updated | Date | Timestamp of last status update (defaults to current time) | No |

---

## Table: medicinestocks

**Purpose:**
Tracks medicine and supply stock levels at each hospital for inventory management and low-stock alerting.

**Primary Key:** `stock_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| stock_id | Number | Unique identifier for the stock record | Yes |
| hospital_id | Number | Hospital that holds the stock (references `hospitals.hospital_id`) | No |
| item_name | String | Name of the medicine or supply item (max 100 chars) | No |
| quantity | Number | Current quantity in stock | No |
| last_updated | Date | Timestamp of last stock update (defaults to current time) | No |

---

## Table: hospitalrushlogs

**Purpose:**
Records a timestamped log each time a hospital's rush level changes, providing a historical audit trail of hospital congestion levels.

**Primary Key:** `log_id`

| Field Name | Data Type | Description | Required |
|---|---|---|---|
| log_id | Number | Unique identifier for the log entry | Yes |
| hospital_id | Number | Hospital whose rush level changed (references `hospitals.hospital_id`) | No |
| rush_level | String | Rush level recorded — one of: `low`, `medium`, `high`, `critical` | No |
| timestamp | Date | Timestamp of the rush level change (defaults to current time) | No |

---

## Entity-Relationship Summary

```
users ──────────┬──── doctordetails (doctor_id → user_id)
                ├──── hospitaladmins (admin_id → user_id)
                ├──── ambulancedrivers (driver_id → user_id)
                └──── sosrequests (patient_id → user_id)

hospitals ──────┬──── doctordetails (hospital_id[])
                ├──── hospitaladmins (hospital_id)
                ├──── equipmentstatuses (hospital_id)
                ├──── medicinestocks (hospital_id)
                ├──── hospitalrushlogs (hospital_id)
                ├──── sosrequests (assigned_hospital_id)
                ├──── ambulanceassignments (assigned_hospital_id)
                ├──── appointments (hospital_id)
                ├──── doctorattendancelogs (hospital_id)
                └──── interhospitalmessages (from/to_hospital_id)

clinics ────────┬──── doctordetails (clinic_id[])
                ├──── hospitaladmins (clinic_id)
                └──── appointments (clinic_id)

doctordetails ──┬──── doctorschedules (doctor_id)
                ├──── doctorattendancelogs (doctor_id)
                ├──── appointments (doctor_id)
                └──── conversations (doctor_id)

ambulancedrivers┬──── ambulancelivelocations (driver_id)
                ├──── ambulanceassignments (driver_id)
                └──── sosrequests (assigned_driver_id)

conversations ──┴──── messages (conversation_id)
```

---

## Collection Count Summary

| # | Collection Name | Primary Key | Document Purpose |
|---|---|---|---|
| 1 | users | user_id | User accounts (all roles) |
| 2 | doctordetails | doctor_id | Doctor professional profiles |
| 3 | hospitals | hospital_id | Hospital registry |
| 4 | clinics | clinic_id | Clinic registry |
| 5 | hospitaladmins | _id | Admin-to-facility mapping |
| 6 | ambulancedrivers | driver_id | Ambulance driver profiles |
| 7 | ambulancelivelocations | driver_id | Real-time ambulance GPS tracking |
| 8 | ambulanceassignments | assignment_id | Emergency ambulance assignments |
| 9 | sosrequests | sos_id | SOS emergency requests |
| 10 | appointments | appointment_id | Patient appointment records |
| 11 | conversations | _id | Messaging conversation threads |
| 12 | messages | _id | Individual chat messages |
| 13 | interhospitalmessages | message_id | Inter-hospital communications |
| 14 | doctorschedules | doctor_id | Doctor consultation schedules |
| 15 | doctorattendancelogs | log_id | Doctor attendance history |
| 16 | equipmentstatuses | equipment_id | Hospital equipment tracking |
| 17 | medicinestocks | stock_id | Medicine/supply inventory |
| 18 | hospitalrushlogs | log_id | Hospital rush level history |
