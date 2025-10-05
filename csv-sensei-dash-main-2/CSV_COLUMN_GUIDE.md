# CSV Column Name Guide

This guide helps you understand what column names the system expects in your CSV files for optimal data parsing.

## Billing/OP Billing CSV File

The system looks for these column names (in order of preference):

### Doctor Information

- `Doctor_Name`, `doctor_name`, `DoctorName`, `doctor_name`
- `Doctor`, `doctor`, `DOCTOR`
- `Name`, `name`, `NAME`
- `Dr_Name`, `dr_name`, `DrName`, `drname`
- `Physician_Name`, `physician_name`, `PhysicianName`, `physicianname`
- `Provider_Name`, `provider_name`, `ProviderName`, `providername`
- `Staff_Name`, `staff_name`, `StaffName`, `staffname`

### Patient Information

- `Patient_Name`, `patient_name`, `PatientName`, `patient_name`
- `Patient`, `patient`, `PATIENT`
- `Name`, `name`, `NAME`
- `Full_Name`, `full_name`, `FullName`, `fullname`
- `Client_Name`, `client_name`, `ClientName`, `clientname`
- `Customer_Name`, `customer_name`, `CustomerName`, `customername`

### Other Important Fields

- `Total_Amount`, `total_amount`, `TotalAmount`, `Amount`, `amount`
- `Procedure_Code`, `procedure_code`, `ProcedureCode`
- `Visit_Date`, `visit_date`, `VisitDate`, `date`
- `Patient_ID`, `patient_id`, `PatientId`, `patient`
- `Doctor_ID`, `doctor_id`, `DoctorId`, `doctor`

## Doctor Roster CSV File

### Doctor Information

- `Doctor_Name`, `doctor_name`, `DoctorName`, `name`, `Name`, `NAME`
- `Doctor`, `doctor`, `DOCTOR`
- `Dr_Name`, `dr_name`, `DrName`, `drname`
- `Physician_Name`, `physician_name`, `PhysicianName`, `physicianname`
- `Provider_Name`, `provider_name`, `ProviderName`, `providername`
- `Staff_Name`, `staff_name`, `StaffName`, `staffname`

### Other Important Fields

- `Doctor_ID`, `doctor_id`, `DoctorId`, `id`
- `Specialization`, `specialization`, `Specialty`, `specialty`
- `Department`, `department`
- `License_Expiry`, `license_expiry`, `LicenseExpiry`

## Tips for Better Data Parsing

1. **Use descriptive column names**: The more specific your column names, the better the system can parse them.

2. **Avoid special characters**: Use underscores or camelCase instead of spaces or special characters.

3. **Be consistent**: Use the same naming convention throughout your CSV files.

4. **Check the dashboard**: The system will show you what columns were found and whether fallback values are being used.

## Troubleshooting

If you see "Doctor 1", "Doctor 2", etc. in the dashboard:

1. Check the console logs (F12 → Console) to see what columns were detected
2. Look for the "Data Quality Notice" banner in the dashboard
3. Rename your columns to match the expected names above
4. Re-upload your CSV files

The system will automatically detect and use the best matching column names, but using the exact expected names will give you the best results.
