export const DOCTOR_ROSTER_SCHEMA = {
  required: [
    'Doctor_ID',
    'Doctor_Name',
    'Specialty',
    'License_No',
    'License_Expiry',
    'Shift_Start',
    'Shift_End'
  ],
  optional: [
    'Specialization',
    'Department',
    'Date',
    'Shift',
    'Start_Time',
    'End_Time',
    'Location',
    'Room_No',
    'On_Call',
    'Contact',
    'Email',
    'Max_Appointments',
    'Notes'
  ],
  types: {
    Doctor_ID: 'string',
    Doctor_Name: 'string',
    Specialty: 'string',
    License_No: 'string',
    License_Expiry: 'date',
    Shift_Start: 'string',
    Shift_End: 'string',
    Specialization: 'string',
    Department: 'string',
    Date: 'date',
    Shift: 'string',
    Start_Time: 'string',
    End_Time: 'string',
    Location: 'string',
    Room_No: 'string',
    On_Call: 'string',
    Contact: 'string',
    Email: 'string',
    Max_Appointments: 'number',
    Notes: 'string'
  }
};




