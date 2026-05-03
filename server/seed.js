import mongoose from 'mongoose';
import dotenv   from 'dotenv';

dotenv.config();

// ── Schemas ───────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  name:                  { type: String, required: true, trim: true },
  email:                 { type: String, required: true, unique: true, lowercase: true },
  password:              { type: String, required: true },
  role:                  { type: String, enum: ['student','teacher','parent'], default: 'student' },
  avatar:                { type: String, default: '' },
  children:              [{ type: mongoose.Schema.Types.ObjectId }],
  parentAccount:         { type: mongoose.Schema.Types.ObjectId, default: null },
  managedRooms:          [{ type: mongoose.Schema.Types.ObjectId }],
  isEmailVerified:       { type: Boolean, default: true },
  emailVerificationToken:{ type: String, default: null },
  resetPasswordToken:    { type: String, default: null },
  resetPasswordExpire:   { type: Date, default: null },
  firebaseUid:           { type: String, default: null },
  fcmToken:              { type: String, default: null },
  isActive:              { type: Boolean, default: true },
  lastSeen:              { type: Date, default: Date.now },
  notificationPrefs: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    push:  { type: Boolean, default: false },
  },
}, { timestamps: true });

// NO pre-save hook in seed — we hash manually
const SeedUser = mongoose.model('User', userSchema);

const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  subject:     { type: String, required: true },
  description: { type: String, default: '' },
  teacher:     { type: mongoose.Schema.Types.ObjectId, required: true },
  coTeachers:  [{ type: mongoose.Schema.Types.ObjectId }],
  students: [{
    student:  { type: mongoose.Schema.Types.ObjectId },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  }],
  inviteCode:      { type: String },
  isInviteEnabled: { type: Boolean, default: true },
  coverColor:      { type: String, default: 'blue' },
  isArchived:      { type: Boolean, default: false },
  isActive:        { type: Boolean, default: true },
  maxStudents:     { type: Number, default: 100 },
  announcements:   [],
  resources:       [],
  stats: {
    totalTasks:        { type: Number, default: 0 },
    totalStudents:     { type: Number, default: 0 },
    avgCompletionRate: { type: Number, default: 0 },
  },
}, { timestamps: true });

const SeedRoom = mongoose.model('Room', roomSchema);

const taskSchema = new mongoose.Schema({
  student:        { type: mongoose.Schema.Types.ObjectId },
  assignedBy:     { type: mongoose.Schema.Types.ObjectId, default: null },
  room:           { type: mongoose.Schema.Types.ObjectId, default: null },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  subject:        { type: String, default: '' },
  priority:       { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  status:         { type: String, enum: ['todo','in_progress','completed','overdue','cancelled'], default: 'todo' },
  dueDate:        { type: Date, default: null },
  completedAt:    { type: Date, default: null },
  xpReward:       { type: Number, default: 10 },
  xpEarned:       { type: Number, default: 0 },
  subTasks:       [],
  tags:           [],
  reminderAt:     { type: Date, default: null },
  isReminderSent: { type: Boolean, default: false },
  recurrence:     { type: String, default: 'none' },
}, { timestamps: true });

const SeedTask = mongoose.model('Task', taskSchema);

const noteSchema = new mongoose.Schema({
  author:     { type: mongoose.Schema.Types.ObjectId },
  title:      { type: String, required: true },
  content:    { type: String, default: '' },
  subject:    { type: String, default: '' },
  tags:       [],
  color:      { type: String, default: 'default' },
  isPinned:   { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  isShared:   { type: Boolean, default: false },
  sharedWith: [],
  wordCount:  { type: Number, default: 0 },
  viewCount:  { type: Number, default: 0 },
}, { timestamps: true });

const SeedNote = mongoose.model('Note', noteSchema);

const studySessionSchema = new mongoose.Schema({
  student:         { type: mongoose.Schema.Types.ObjectId },
  room:            { type: mongoose.Schema.Types.ObjectId, default: null },
  subject:         { type: String },
  sessionType:     { type: String, default: 'free' },
  startTime:       { type: Date },
  endTime:         { type: Date, default: null },
  status:          { type: String, default: 'completed' },
  durationMinutes: { type: Number, default: 0 },
  focusScore:      { type: Number, default: null },
  xpEarned:        { type: Number, default: 0 },
  totalPausedMs:   { type: Number, default: 0 },
  notes:           { type: String, default: '' },
  tags:            [],
}, { timestamps: true });

const SeedStudySession = mongoose.model('StudySession', studySessionSchema);

// ── Main seed function ────────────────────────────────────────────────────────
const seed = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studysync';
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear all collections
    await SeedUser.deleteMany({});
    await SeedRoom.deleteMany({});
    await SeedTask.deleteMany({});
    await SeedNote.deleteMany({});
    await SeedStudySession.deleteMany({});
    console.log('🗑️  Collections cleared');

    // ── Hash password ONCE manually ───────────────────────────────────────
    // Import bcrypt here to avoid pre-save hook conflict
    const { default: bcrypt } = await import('bcryptjs');
    const salt           = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('test123', salt);
    console.log('🔐 Password hashed');

    // ── Create teacher ────────────────────────────────────────────────────
    const teacher = new SeedUser({
      name:            'Ms Johnson',
      email:           'teacher@test.com',
      password:        hashedPassword,
      role:            'teacher',
      isEmailVerified: true,
    });
    await teacher.save();

    // ── Create student ────────────────────────────────────────────────────
    const student = new SeedUser({
      name:            'User',
      email:           'student@test.com',
      password:        hashedPassword,
      role:            'student',
      isEmailVerified: true,
    });
    await student.save();

    // ── Create parent ─────────────────────────────────────────────────────
    const parent = new SeedUser({
      name:            'Parent User',
      email:           'parent@test.com',
      password:        hashedPassword,
      role:            'parent',
      isEmailVerified: true,
      children:        [student._id],
    });
    await parent.save();

    // Link parent to student
    student.parentAccount = parent._id;
    await student.save();

    // Link room to teacher
    console.log('👤 Users created');

    // ── Create room ───────────────────────────────────────────────────────
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = new SeedRoom({
      name:        'Mathematics 101',
      subject:     'Mathematics',
      description: 'Algebra, geometry, and calculus fundamentals',
      teacher:     teacher._id,
      coverColor:  'blue',
      inviteCode,
      students: [{
        student:  student._id,
        isActive: true,
        joinedAt: new Date(),
      }],
      stats: { totalStudents: 1 },
    });
    await room.save();

    teacher.managedRooms = [room._id];
    await teacher.save();

    console.log(`🏫 Room created: ${room.name} | Code: ${room.inviteCode}`);

    // ── Create tasks ──────────────────────────────────────────────────────
    const tomorrow  = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek  = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

    await SeedTask.insertMany([
      {
        student:     student._id,
        assignedBy:  teacher._id,
        room:        room._id,
        title:       'Complete Chapter 3 exercises',
        description: 'Pages 45–52 in the textbook',
        subject:     'Mathematics',
        priority:    'high',
        status:      'todo',
        dueDate:     tomorrow,
        xpReward:    20,
      },
      {
        student:  student._id,
        title:    'Review algebra notes',
        subject:  'Mathematics',
        priority: 'medium',
        status:   'in_progress',
        dueDate:  nextWeek,
        xpReward: 10,
      },
      {
        student:     student._id,
        title:       'Practice quadratic equations',
        subject:     'Mathematics',
        priority:    'low',
        status:      'completed',
        dueDate:     yesterday,
        xpReward:    15,
        xpEarned:    15,
        completedAt: new Date(),
      },
      {
        student:  student._id,
        title:    'Submit homework',
        subject:  'Mathematics',
        priority: 'urgent',
        status:   'overdue',
        dueDate:  yesterday,
        xpReward: 25,
      },
    ]);
    console.log('📋 Tasks created');

    // ── Create notes ──────────────────────────────────────────────────────
    await SeedNote.insertMany([
      {
        author:   student._id,
        title:    'Algebra key formulas',
        content:  'Quadratic: x = (-b ± √(b²-4ac)) / 2a',
        subject:  'Mathematics',
        tags:     ['algebra', 'formulas'],
        color:    'yellow',
        isPinned: true,
      },
      {
        author:  student._id,
        title:   'Geometry — triangles',
        content: 'Sum of angles = 180°. Area = base × height / 2',
        subject: 'Mathematics',
        tags:    ['geometry'],
        color:   'blue',
      },
    ]);
    console.log('📝 Notes created');

    // ── Create study sessions ─────────────────────────────────────────────
    const sessions = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startTime = new Date(date);
      startTime.setHours(9, 0, 0, 0);
      const dur     = 30 + Math.floor(Math.random() * 60);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + dur);
      sessions.push({
        student:         student._id,
        room:            room._id,
        subject:         'Mathematics',
        sessionType:     'free',
        startTime,
        endTime,
        status:          'completed',
        durationMinutes: dur,
        focusScore:      60 + Math.floor(Math.random() * 40),
        xpEarned:        dur,
        totalPausedMs:   0,
      });
    }
    await SeedStudySession.insertMany(sessions);
    console.log('⏱️  Study sessions created');

    // ── Verify password works ─────────────────────────────────────────────
    const testUser = await SeedUser.findOne({ email: 'student@test.com' }).select('+password');
    const pwWorks  = await bcrypt.compare('test123', testUser.password);
    console.log(`🔑 Password verification test: ${pwWorks ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n🎉 SEED COMPLETE!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Student  →  student@test.com  /  test123');
    console.log('  Teacher  →  teacher@test.com  /  test123');
    console.log('  Parent   →  parent@test.com   /  test123');
    console.log(`  Room invite code: ${room.inviteCode}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();