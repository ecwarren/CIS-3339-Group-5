// Sample data used by scripts/dbInit.js (D1).
// 16 clients, 16 services and 16 events so the list pages have more than one page (10 per page).

const services = [
  { name: 'Blood Pressure Screening', description: 'Free blood pressure checks with a nurse.' },
  { name: 'Diabetes Education', description: 'Classes on managing blood sugar, diet and medication.' },
  { name: 'Flu Shots', description: 'Seasonal flu vaccinations for adults and children.' },
  { name: 'Food Pantry', description: 'Groceries and fresh produce for families in need.' },
  { name: 'Health Insurance Enrollment', description: 'Help applying for Medicaid, CHIP and marketplace plans.' },
  { name: 'Mental Health Counseling', description: 'Short-term counseling and referrals.' },
  { name: 'Dental Screening', description: 'Basic dental checks and referrals to low-cost clinics.' },
  { name: 'Vision Screening', description: 'Eye exams and help getting low-cost glasses.' },
  { name: 'Nutrition Counseling', description: 'One-on-one meal planning with a dietitian.' },
  { name: 'Prenatal Care Referral', description: 'Connecting expecting mothers with prenatal care.' },
  { name: 'Smoking Cessation', description: 'Support groups and resources to quit smoking.' },
  { name: 'Child Immunizations', description: 'Required school vaccinations for children.' },
  { name: 'Housing Assistance', description: 'Referrals for rent help and emergency shelter.' },
  { name: 'Job Readiness Workshop', description: 'Resume help and interview practice.' },
  { name: 'Senior Wellness Check', description: 'Health and safety check-ins for older adults.' },
  { name: 'COVID-19 Testing', description: 'Rapid testing (no longer offered).', status: 'Inactive' }
];

const clients = [
  ['Maria', 'Garcia', '7135550101', '77002', 'Houston'],
  ['James', 'Nguyen', '7135550102', '77002', 'Houston'],
  ['Aisha', 'Johnson', '7135550103', '77004', 'Houston'],
  ['Carlos', 'Hernandez', '7135550104', '77004', 'Houston'],
  ['Linh', 'Tran', '7135550105', '77036', 'Houston'],
  ['Robert', 'Smith', '7135550106', '77036', 'Houston'],
  ['Fatima', 'Ali', '7135550107', '77072', 'Houston'],
  ['David', 'Lee', '7135550108', '77072', 'Houston'],
  ['Sofia', 'Martinez', '7135550109', '77087', 'Houston'],
  ['Michael', 'Brown', '7135550110', '77087', 'Houston'],
  ['Grace', 'Okafor', '7135550111', '77021', 'Houston'],
  ['Daniel', 'Lopez', '7135550112', '77021', 'Houston'],
  ['Emily', 'Pham', '2815550113', '77477', 'Stafford'],
  ['Joseph', 'Williams', '2815550114', '77477', 'Stafford'],
  ['Ana', 'Rodriguez', '2815550115', '77506', 'Pasadena'],
  ['Kevin', 'Davis', '2815550116', '77506', 'Pasadena']
].map(([firstName, lastName, phone, zip, city], i) => ({
  firstName,
  lastName,
  email: `${firstName}.${lastName}@example.com`.toLowerCase(),
  phoneNumber: { primary: phone },
  address: { line1: `${100 + i * 7} Main St`, city, county: 'Harris', zip }
}));

// daysFromToday: negative = past (shows on the dashboard if within 2 months), positive = upcoming
// attendees: indexes into the clients list above (these become the sample registrations)
const events = [
  { name: 'Fall Health Fair', daysFromToday: -45, services: [0, 2, 7], attendees: [0, 1, 2, 3, 4] },
  { name: 'Diabetes Workshop', daysFromToday: -38, services: [1, 8], attendees: [5, 6] },
  { name: 'Back to School Shots', daysFromToday: -30, services: [11, 7], attendees: [7, 8, 9] },
  { name: 'Community Food Drive', daysFromToday: -24, services: [3], attendees: [0, 10, 11, 12] },
  { name: 'Insurance Enrollment Day', daysFromToday: -17, services: [4], attendees: [13, 14] },
  { name: 'Senior Wellness Morning', daysFromToday: -10, services: [14, 0], attendees: [15, 1] },
  { name: 'Mental Health Awareness Talk', daysFromToday: -6, services: [5], attendees: [2, 3, 4] },
  { name: 'Flu Shot Clinic', daysFromToday: -2, services: [2], attendees: [5, 6, 7, 8] },
  { name: 'Job Readiness Workshop', daysFromToday: 5, services: [13], attendees: [] },
  { name: 'Healthy Cooking Class', daysFromToday: 9, services: [8, 3], attendees: [] },
  { name: 'Dental and Vision Day', daysFromToday: 14, services: [6, 7], attendees: [] },
  { name: 'Prenatal Info Session', daysFromToday: 20, services: [9], attendees: [] },
  { name: 'Quit Smoking Support Group', daysFromToday: 27, services: [10], attendees: [] },
  { name: 'Housing Resource Fair', daysFromToday: 34, services: [12, 13], attendees: [] },
  { name: 'Winter Health Fair', daysFromToday: 41, services: [0, 1, 2, 6, 7], attendees: [] },
  { name: 'New Year Wellness Kickoff', daysFromToday: 55, services: [8, 14], attendees: [] }
].map((e, i) => ({
  ...e,
  description: `${e.name} hosted by the community health team.`,
  address: { line1: `${200 + i * 11} Community Way`, city: 'Houston', county: 'Harris', zip: '77002' }
}));

// A second organization with fixed ids, used ONLY to demonstrate organization isolation.
// Nobody can log in to it through this backend; its records must never appear for ORG_ID users.
const isolationTestOrg = {
  orgId: '650000000000000000000001',
  name: 'Isolation Test Org (do not use)',
  clientId: '650000000000000000000002',
  serviceId: '650000000000000000000003',
  eventId: '650000000000000000000004'
};

module.exports = { services, clients, events, isolationTestOrg };
