import { PrismaClient, Role, EnrolmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seeding...');

  // 1. Clean existing records in correct relation order
  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('[SEED] Cleaned existing database tables.');

  // Password hashes
  const staffPasswordHash = await bcrypt.hash('Staff@12345', 10);
  const studentPasswordHash = await bcrypt.hash('Student@12345', 10);

  // 2. Create Registry Staff User & Profile
  const staffUser = await prisma.user.create({
    data: {
      email: 'admin@sms.ac.uk',
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      staff: {
        create: {
          staffId: 'STF-2025-001',
          fullName: 'Registry Administrator',
          department: 'Academic Registry & Admissions',
        },
      },
    },
    include: { staff: true },
  });

  const staffProfile = staffUser.staff!;
  console.log(`[SEED] Created Staff User: ${staffUser.email} (${staffProfile.staffId})`);

  // 3. Create Programmes
  const csProgramme = await prisma.programme.create({
    data: {
      code: 'CS-BSC',
      name: 'BSc Computer Science',
      tuitionFee: 9250.0,
      createdById: staffProfile.id,
    },
  });

  const busProgramme = await prisma.programme.create({
    data: {
      code: 'BA-BUS',
      name: 'BA Business Administration',
      tuitionFee: 8500.0,
      createdById: staffProfile.id,
    },
  });

  console.log('[SEED] Created Programmes: BSc Computer Science & BA Business Administration');

  // 4. Create Assessments
  const csAssessment = await prisma.assessment.create({
    data: {
      title: 'Coursework 1: Data Structures & Algorithms',
      module: 'CS101 - Algorithms',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days in future
      programmeId: csProgramme.id,
      createdById: staffProfile.id,
    },
  });

  const busAssessment = await prisma.assessment.create({
    data: {
      title: 'Term Paper: International Business Strategy',
      module: 'BA201 - Strategic Management',
      deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days in past
      programmeId: busProgramme.id,
      createdById: staffProfile.id,
    },
  });

  console.log('[SEED] Created Assessments for CS and Business modules.');

  // 5. Create Students with User Accounts, Payments, Submissions & Grades
  // Student 1: Alice Johnson (Clean, fully paid, distinction grade)
  const aliceUser = await prisma.user.create({
    data: {
      email: 'alice@sms.ac.uk',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
  });

  const aliceStudent = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0001',
      fullName: 'Alice Johnson',
      email: 'alice@sms.ac.uk',
      dateOfBirth: new Date('2003-04-15'),
      academicYear: '2024/2025',
      status: EnrolmentStatus.ENROLLED,
      programmeId: csProgramme.id,
      userId: aliceUser.id,
    },
  });

  await prisma.payment.create({
    data: {
      studentId: aliceStudent.id,
      recordedById: staffProfile.id,
      amount: 9250.0,
      referenceNo: 'PAY-2025-ALICE-01',
      paymentDate: new Date('2024-09-15'),
    },
  });

  const aliceSubmission = await prisma.submission.create({
    data: {
      assessmentId: csAssessment.id,
      studentId: aliceStudent.id,
      fileUrl: '/uploads/sample-alice-submission.pdf',
      fileName: 'alice_johnson_algorithms_coursework.pdf',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isLate: false,
    },
  });

  await prisma.grade.create({
    data: {
      assessmentId: csAssessment.id,
      studentId: aliceStudent.id,
      submissionId: aliceSubmission.id,
      gradedById: staffProfile.id,
      numericGrade: 88.0,
      classification: 'Distinction',
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  // Student 2: Brian Smith (Partial payment, OVERDUE balance flagged)
  const brianUser = await prisma.user.create({
    data: {
      email: 'brian@sms.ac.uk',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
  });

  const brianStudent = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0002',
      fullName: 'Brian Smith',
      email: 'brian@sms.ac.uk',
      dateOfBirth: new Date('2002-11-20'),
      academicYear: '2024/2025',
      status: EnrolmentStatus.ENROLLED,
      programmeId: busProgramme.id,
      userId: brianUser.id,
    },
  });

  await prisma.payment.create({
    data: {
      studentId: brianStudent.id,
      recordedById: staffProfile.id,
      amount: 4000.0, // Outstanding balance: £4,500
      referenceNo: 'PAY-2025-BRIAN-01',
      paymentDate: new Date('2024-09-20'),
    },
  });

  // Student 3: Clara Oswald (Deferred status)
  const claraUser = await prisma.user.create({
    data: {
      email: 'clara@sms.ac.uk',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
  });

  await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0003',
      fullName: 'Clara Oswald',
      email: 'clara@sms.ac.uk',
      dateOfBirth: new Date('2004-01-08'),
      academicYear: '2024/2025',
      status: EnrolmentStatus.DEFERRED,
      programmeId: csProgramme.id,
      userId: claraUser.id,
    },
  });

  // Student 4: David Tennant (Submitted LATE to bus assessment)
  const davidUser = await prisma.user.create({
    data: {
      email: 'david@sms.ac.uk',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
  });

  const davidStudent = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0004',
      fullName: 'David Tennant',
      email: 'david@sms.ac.uk',
      dateOfBirth: new Date('2003-07-25'),
      academicYear: '2024/2025',
      status: EnrolmentStatus.ENROLLED,
      programmeId: busProgramme.id,
      userId: davidUser.id,
    },
  });

  await prisma.payment.create({
    data: {
      studentId: davidStudent.id,
      recordedById: staffProfile.id,
      amount: 8500.0,
      referenceNo: 'PAY-2025-DAVID-01',
      paymentDate: new Date('2024-09-18'),
    },
  });

  const davidSubmission = await prisma.submission.create({
    data: {
      assessmentId: busAssessment.id,
      studentId: davidStudent.id,
      fileUrl: '/uploads/sample-late-submission.pdf',
      fileName: 'david_tennant_strategic_mgmt.pdf',
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // submitted 1 day ago (2 days past deadline)
      isLate: true,
    },
  });

  // Award grade for David, but WITHHELD (isPublished: false)
  await prisma.grade.create({
    data: {
      assessmentId: busAssessment.id,
      studentId: davidStudent.id,
      submissionId: davidSubmission.id,
      gradedById: staffProfile.id,
      numericGrade: 58.0,
      classification: 'Pass',
      isPublished: false, // Withheld from student view
    },
  });

  // Student 5: Emma Watson (Completed, Distinction Grade PUBLISHED)
  const emmaUser = await prisma.user.create({
    data: {
      email: 'emma@sms.ac.uk',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
    },
  });

  const emmaStudent = await prisma.student.create({
    data: {
      studentId: 'SMS-2025-0005',
      fullName: 'Emma Watson',
      email: 'emma@sms.ac.uk',
      dateOfBirth: new Date('2002-05-12'),
      academicYear: '2023/2024',
      status: EnrolmentStatus.COMPLETED,
      programmeId: csProgramme.id,
      userId: emmaUser.id,
    },
  });

  await prisma.payment.create({
    data: {
      studentId: emmaStudent.id,
      recordedById: staffProfile.id,
      amount: 9250.0,
      referenceNo: 'PAY-2024-EMMA-01',
      paymentDate: new Date('2023-09-10'),
    },
  });

  const emmaSubmission = await prisma.submission.create({
    data: {
      assessmentId: csAssessment.id,
      studentId: emmaStudent.id,
      fileUrl: '/uploads/sample-emma-submission.pdf',
      fileName: 'emma_watson_algorithms_final.pdf',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isLate: false,
    },
  });

  await prisma.grade.create({
    data: {
      assessmentId: csAssessment.id,
      studentId: emmaStudent.id,
      submissionId: emmaSubmission.id,
      gradedById: staffProfile.id,
      numericGrade: 84.0,
      classification: 'Distinction',
      isPublished: true, // Published to student marksheet
      publishedAt: new Date(),
    },
  });

  console.log('[SEED] Successfully seeded 5 demo students, fee records, coursework, and grades.');
  console.log('[SEED] Staff Login: admin@sms.ac.uk / Staff@12345');
  console.log('[SEED] Student Login: alice@sms.ac.uk / Student@12345');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
