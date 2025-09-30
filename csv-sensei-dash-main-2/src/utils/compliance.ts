type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Violation {
  dataset: 'op_billing' | 'doctor_roster';
  row: number;
  rule: `R${1|2|3|4|5|6|7|8|9|10}` | string;
  severity: Severity;
  reason: string;
}

export interface ComplianceResult {
  violations: Violation[];
  riskScore: number;
  analysisView: any[];
  summaries: {
    averageAmount?: number;
    payerDistribution?: Record<string, number>;
    violationRanking: Array<{ rule: string; count: number; severity: Severity }>; 
  };
}

const severityWeight: Record<Severity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

const requiredBillingColumns = [
  'Bill_ID', 'Bill_Date', 'Patient_ID', 'Patient_Name', 'Doctor_ID', 'Doctor_Name', 'Department',
  'Service_Code', 'Service_Description', 'Quantity', 'Unit_Price', 'Total_Amount', 'Payment_Status',
  'Visit_ID', 'Visit_Date', 'Age', 'Procedure_Code', 'Consent_Flag', 'Payer_Type'
];

const requiredDoctorColumns = [
  'Doctor_ID', 'Doctor_Name', 'Specialization', 'Department', 'License_Expiry'
];

const validProcedures = ['OP100', 'OP200', 'OP300'];
const procToSpecialty: Record<string, string> = {
  OP100: 'General',
  OP200: 'Orthopedics',
  OP300: 'Cardiology'
};

function toDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

function pushIf(cond: boolean, v: Violation, out: Violation[]) {
  if (cond) out.push(v);
}

export function runCompliance(opBilling: any[], doctorRoster: any[]): ComplianceResult {
  const violations: Violation[] = [];

  // Header checks (R1 pre-checks for required columns)
  const billingHeaders = Object.keys(opBilling[0] || {});
  const missingBilling = requiredBillingColumns.filter(c => !billingHeaders.includes(c));
  missingBilling.forEach(c => violations.push({ dataset: 'op_billing', row: 0, rule: 'R1', severity: 'HIGH', reason: `Missing required column: ${c}` }));

  const doctorHeaders = Object.keys(doctorRoster[0] || {});
  const missingDoctor = requiredDoctorColumns.filter(c => !doctorHeaders.includes(c));
  missingDoctor.forEach(c => violations.push({ dataset: 'doctor_roster', row: 0, rule: 'R4', severity: 'HIGH', reason: `Missing required column: ${c}` }));

  // Build doctor map
  const doctorById = new Map<string, any>();
  doctorRoster.forEach(dr => {
    if (dr && dr.Doctor_ID) doctorById.set(String(dr.Doctor_ID), dr);
  });

  // Track Patient_ID uniqueness per Visit_ID (R1)
  const visitToPatient = new Map<string, string>();

  // Compute analysis view and payer distribution
  const analysisView: any[] = [];
  const payerDistribution: Record<string, number> = {};
  let amountSum = 0;
  let amountCount = 0;

  opBilling.forEach((row, idx) => {
    const rowNum = idx + 1;

    const patientId = row?.Patient_ID?.toString()?.trim();
    const visitId = row?.Visit_ID?.toString()?.trim();
    const age = Number(row?.Age);
    const visitDate = toDate(row?.Visit_Date);
    const doctorId = row?.Doctor_ID?.toString()?.trim();
    const proc = row?.Procedure_Code?.toString()?.trim();
    const amount = Number(row?.Total_Amount);
    const consent = row?.Consent_Flag?.toString()?.trim()?.toUpperCase();
    const payerType = row?.Payer_Type?.toString()?.trim()?.toUpperCase();

    // R1 (HIGH): Patient_ID must exist; unique per Visit_ID.
    pushIf(!patientId, { dataset: 'op_billing', row: rowNum, rule: 'R1', severity: 'HIGH', reason: 'Patient_ID is missing' }, violations);
    if (patientId && visitId) {
      const existing = visitToPatient.get(visitId);
      if (!existing) visitToPatient.set(visitId, patientId);
      else if (existing !== patientId) {
        violations.push({ dataset: 'op_billing', row: rowNum, rule: 'R1', severity: 'HIGH', reason: `Patient_ID must be unique per Visit_ID. Found ${patientId} but expected ${existing}` });
      }
    }

    // R2 (HIGH): Age must be between 0 and 120.
    pushIf(!(Number.isFinite(age) && age >= 0 && age <= 120), { dataset: 'op_billing', row: rowNum, rule: 'R2', severity: 'HIGH', reason: `Invalid Age: ${row?.Age}` }, violations);

    // R3 (HIGH): Visit_Date cannot be in the future.
    const now = new Date();
    pushIf(!(visitDate && visitDate <= now), { dataset: 'op_billing', row: rowNum, rule: 'R3', severity: 'HIGH', reason: `Visit_Date invalid or in future: ${row?.Visit_Date}` }, violations);

    // R4 (HIGH): Doctor_ID must exist in doctor_roster.
    const doctor = doctorId ? doctorById.get(doctorId) : null;
    pushIf(!doctor, { dataset: 'op_billing', row: rowNum, rule: 'R4', severity: 'HIGH', reason: `Doctor_ID not found in roster: ${doctorId || 'N/A'}` }, violations);

    // R5 (HIGH): Doctor’s License_Expiry ≥ Visit_Date.
    const licExp = doctor ? toDate(doctor.License_Expiry) : null;
    if (doctor && visitDate) {
      pushIf(!(licExp && licExp >= visitDate), { dataset: 'op_billing', row: rowNum, rule: 'R5', severity: 'HIGH', reason: `License expired before visit: License_Expiry=${doctor?.License_Expiry}, Visit_Date=${row?.Visit_Date}` }, violations);
    }

    // R6 (HIGH): Procedure_Code must be OP100/OP200/OP300.
    pushIf(!proc || !validProcedures.includes(proc), { dataset: 'op_billing', row: rowNum, rule: 'R6', severity: 'HIGH', reason: `Invalid Procedure_Code: ${proc || 'N/A'}` }, violations);

    // R7 (HIGH): Amount must be >0 and ≤100000.
    pushIf(!(Number.isFinite(amount) && amount > 0 && amount <= 100000), { dataset: 'op_billing', row: rowNum, rule: 'R7', severity: 'HIGH', reason: `Invalid Total_Amount: ${row?.Total_Amount}` }, violations);

    // R8 (HIGH): If Procedure_Code=OP300 → Consent_Flag must be Y.
    if (proc === 'OP300') {
      pushIf(consent !== 'Y', { dataset: 'op_billing', row: rowNum, rule: 'R8', severity: 'HIGH', reason: 'Consent_Flag must be Y for OP300' }, violations);
    }

    // R9 (MEDIUM): Doctor’s specialty must match procedure mapping
    const specialty = doctor?.Specialization?.toString()?.trim();
    const expected = proc ? procToSpecialty[proc] : undefined;
    if (doctor && proc && expected) {
      pushIf(!specialty || specialty !== expected, { dataset: 'op_billing', row: rowNum, rule: 'R9', severity: 'MEDIUM', reason: `Specialization mismatch. Expected ${expected}, got ${specialty || 'N/A'}` }, violations);
    }

    // R10 (LOW): Payer_Type must be CASH, INSURANCE, or GOVT.
    const validPayers = ['CASH', 'INSURANCE', 'GOVT'];
    pushIf(!(payerType && validPayers.includes(payerType)), { dataset: 'op_billing', row: rowNum, rule: 'R10', severity: 'LOW', reason: `Invalid Payer_Type: ${row?.Payer_Type}` }, violations);

    // R11 (HIGH): Off-Shift Billing Validation - Visit_Date must be within doctor's shift hours
    if (doctor && visitDate) {
      const visitTime = new Date(visitDate);
      const visitHour = visitTime.getHours();
      const visitMinute = visitTime.getMinutes();
      const visitTimeMinutes = visitHour * 60 + visitMinute;
      
      // Parse shift times
      const shiftStartParts = doctor.Shift_Start?.split(':') || ['00', '00'];
      const shiftEndParts = doctor.Shift_End?.split(':') || ['23', '59'];
      const shiftStartMinutes = parseInt(shiftStartParts[0]) * 60 + parseInt(shiftStartParts[1]);
      const shiftEndMinutes = parseInt(shiftEndParts[0]) * 60 + parseInt(shiftEndParts[1]);
      
      let isWithinShift = false;
      
      // Handle normal shifts (e.g., 08:00-17:00)
      if (shiftStartMinutes <= shiftEndMinutes) {
        isWithinShift = visitTimeMinutes >= shiftStartMinutes && visitTimeMinutes <= shiftEndMinutes;
      } else {
        // Handle overnight shifts (e.g., 22:00-06:00)
        isWithinShift = visitTimeMinutes >= shiftStartMinutes || visitTimeMinutes <= shiftEndMinutes;
      }
      
      pushIf(!isWithinShift, { 
        dataset: 'op_billing', 
        row: rowNum, 
        rule: 'R11', 
        severity: 'HIGH', 
        reason: `Visit outside shift hours: Visit at ${visitHour.toString().padStart(2, '0')}:${visitMinute.toString().padStart(2, '0')}, Doctor shift: ${doctor.Shift_Start}-${doctor.Shift_End}` 
      }, violations);
    }

    // Accumulate for summaries
    if (Number.isFinite(amount)) {
      amountSum += amount;
      amountCount += 1;
    }
    if (payerType) payerDistribution[payerType] = (payerDistribution[payerType] || 0) + 1;

    // Build joined record
    analysisView.push({ ...row, _doctor: doctor || null });
  });

  // Risk score
  const riskScore = violations.reduce((sum, v) => sum + severityWeight[v.severity], 0);

  // Violation ranking
  const rankMap: Record<string, { rule: string; count: number; severity: Severity }> = {};
  violations.forEach(v => {
    const key = v.rule;
    if (!rankMap[key]) rankMap[key] = { rule: v.rule, count: 0, severity: v.severity };
    rankMap[key].count += 1;
  });
  const violationRanking = Object.values(rankMap).sort((a, b) => b.count - a.count);

  return {
    violations,
    riskScore,
    analysisView,
    summaries: {
      averageAmount: amountCount > 0 ? amountSum / amountCount : undefined,
      payerDistribution,
      violationRanking
    }
  };
}

export function toCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('\n') ? `"${s}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map(h => escape(r[h])).join(','));
  }
  return lines.join('\n');
}

export function violationsToCSV(violations: Violation[]): string {
  return toCSV(violations);
}




