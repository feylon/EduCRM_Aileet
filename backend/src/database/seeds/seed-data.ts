/** Static demo data used by the seed. Passwords are documented in README.md. */

export const DEMO_PASSWORDS = {
  superAdmin: 'Admin123!',
  admin: 'Admin123!',
  teacher: 'Teacher123!',
  student: 'Student123!',
};

export const FIRST_NAMES_MALE = [
  'Aziz', 'Bekzod', 'Jasur', 'Sardor', 'Otabek', 'Javohir', 'Shoxrux', 'Ulug‘bek', 'Doston', 'Islom',
  'Sherzod', 'Akmal', 'Bobur', 'Diyor', 'Farrux', 'Asadbek', 'Abdulloh', 'Temur', 'Mirjalol', 'Nodir',
];

export const FIRST_NAMES_FEMALE = [
  'Malika', 'Madina', 'Nilufar', 'Dilnoza', 'Gulnoza', 'Sevara', 'Zarina', 'Kamola', 'Shahzoda', 'Mohira',
  'Feruza', 'Nigora', 'Laylo', 'Mushtariy', 'Sabina', 'Zuhra', 'Robiya', 'Muslima', 'Charos', 'Oydin',
];

export const LAST_NAMES = [
  'Karimov', 'Rahimov', 'Tursunov', 'Yusupov', 'Aliyev', 'Ismoilov', 'Nazarov', 'Qodirov', 'Sobirov', 'Ergashev',
  'Hasanov', 'Abdullayev', 'Mirzayev', 'Usmonov', 'Saidov', 'Xolmatov', 'Jo‘rayev', 'Toshpo‘latov', 'Valiyev', 'Umarov',
];

export const COURSES = [
  { name: 'General English', level: 'beginner', price: 450000, durationMonths: 6, lessonsPerWeek: 3, color: '#6366f1', description: 'Grammar, speaking and listening for beginners.' },
  { name: 'IELTS Preparation', level: 'intermediate', price: 750000, durationMonths: 4, lessonsPerWeek: 3, color: '#0ea5e9', description: 'Intensive preparation for IELTS 6.5+.' },
  { name: 'Mathematics (DTM)', level: 'intermediate', price: 500000, durationMonths: 9, lessonsPerWeek: 3, color: '#f59e0b', description: 'University entrance exam mathematics.' },
  { name: 'Russian Language', level: 'elementary', price: 400000, durationMonths: 6, lessonsPerWeek: 2, color: '#ef4444', description: 'Conversational Russian for everyday life.' },
  { name: 'Frontend Development', level: 'beginner', price: 1200000, durationMonths: 8, lessonsPerWeek: 3, color: '#10b981', description: 'HTML, CSS, JavaScript and Vue.js from scratch.' },
  { name: 'Korean Language', level: 'beginner', price: 550000, durationMonths: 6, lessonsPerWeek: 3, color: '#ec4899', description: 'Hangul, basic grammar and TOPIK I preparation.' },
] as const;

export const TEACHERS = [
  { firstName: 'Dilshod', lastName: 'Mahmudov', email: 'teacher@educrm.uz', specialization: 'English, IELTS', experienceYears: 7, courses: [0, 1] },
  { firstName: 'Nargiza', lastName: 'Saidova', email: 'nargiza.saidova@educrm.uz', specialization: 'IELTS, General English', experienceYears: 5, courses: [0, 1] },
  { firstName: 'Rustam', lastName: 'Qosimov', email: 'rustam.qosimov@educrm.uz', specialization: 'Mathematics', experienceYears: 10, courses: [2] },
  { firstName: 'Olga', lastName: 'Petrova', email: 'olga.petrova@educrm.uz', specialization: 'Russian language', experienceYears: 12, courses: [3] },
  { firstName: 'Jahongir', lastName: 'Ortiqov', email: 'jahongir.ortiqov@educrm.uz', specialization: 'Frontend, Vue.js', experienceYears: 4, courses: [4] },
  { firstName: 'Ji-woo', lastName: 'Kim', email: 'jiwoo.kim@educrm.uz', specialization: 'Korean language', experienceYears: 3, courses: [5] },
];

/** Groups: course index, teacher index, room, months since start (negative = starts in future), weekly days, time. */
export const GROUPS = [
  { name: 'GE-101', course: 0, teacher: 0, room: '101', startedMonthsAgo: 5, days: [1, 3, 5], start: '09:00', end: '10:30', status: 'active' },
  { name: 'GE-102', course: 0, teacher: 1, room: '102', startedMonthsAgo: 3, days: [2, 4, 6], start: '14:00', end: '15:30', status: 'active' },
  { name: 'IELTS-201', course: 1, teacher: 0, room: '101', startedMonthsAgo: 2, days: [2, 4, 6], start: '16:00', end: '17:30', status: 'active' },
  { name: 'IELTS-202', course: 1, teacher: 1, room: '102', startedMonthsAgo: 1, days: [1, 3, 5], start: '18:00', end: '19:30', status: 'active' },
  { name: 'MATH-301', course: 2, teacher: 2, room: '201', startedMonthsAgo: 6, days: [1, 3, 5], start: '14:00', end: '15:30', status: 'active' },
  { name: 'RUS-401', course: 3, teacher: 3, room: '202', startedMonthsAgo: 4, days: [2, 4], start: '10:00', end: '11:30', status: 'active' },
  { name: 'FE-501', course: 4, teacher: 4, room: 'Lab-1', startedMonthsAgo: 3, days: [1, 3, 5], start: '15:00', end: '17:00', status: 'active' },
  { name: 'KOR-601', course: 5, teacher: 5, room: '203', startedMonthsAgo: 2, days: [2, 4, 6], start: '11:00', end: '12:30', status: 'active' },
  { name: 'GE-099', course: 0, teacher: 0, room: '101', startedMonthsAgo: 11, days: [1, 3, 5], start: '11:00', end: '12:30', status: 'completed', durationMonths: 6 },
  { name: 'FE-502', course: 4, teacher: 4, room: 'Lab-1', startedMonthsAgo: -1, days: [2, 4, 6], start: '18:00', end: '20:00', status: 'planned' },
] as const;

export const LEAD_NOTES = [
  'Asked about evening groups',
  'Wants a trial lesson',
  'Parent called, child is 15 years old',
  'Interested in discounts for siblings',
  'Will call back next week',
  'Prefers weekend classes',
];
