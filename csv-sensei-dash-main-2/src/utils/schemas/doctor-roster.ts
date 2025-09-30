export const DOCTOR_ROSTER_SCHEMA = {
  required: [
    'Doctor_ID',
    'Doctor_Name',
    'Specialization',
    'Department',
    'Date',
    'Shift',
    'Start_Time',
    'End_Time'
  ],
  optional: [
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




