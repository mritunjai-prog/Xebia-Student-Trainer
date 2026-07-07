

// Pre-defined Teachers
export const initialTeachers = [
{ id: 'T1', name: 'Dr. Evelyn Stone', email: 'evelyn.stone@xebia-academy.com', role: 'teacher', department: 'Computer Science', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
{ id: 'T2', name: 'Prof. Marcus Vance', email: 'marcus.vance@xebia-academy.com', role: 'teacher', department: 'Data Science', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
{ id: 'T3', name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@xebia-academy.com', role: 'teacher', department: 'UI/UX Design', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
{ id: 'T4', name: 'Prof. Alan Turing', email: 'alan.turing@xebia-academy.com', role: 'teacher', department: 'Software Engineering', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
{ id: 'T5', name: 'Dr. Grace Hopper', email: 'grace.hopper@xebia-academy.com', role: 'teacher', department: 'Database Systems', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' }];


// Pre-defined 10 Batches
export const initialBatches = [
{ id: 'B1', name: 'Batch-2026A', course: 'Full-Stack Web Dev', studentCount: 10, students: [], status: 'active', createdAt: '2026-01-10' },
{ id: 'B2', name: 'Batch-2026B', course: 'AI & Machine Learning', studentCount: 10, students: [], status: 'active', createdAt: '2026-01-12' },
{ id: 'B3', name: 'Batch-2026C', course: 'Human-Computer Interaction', studentCount: 10, students: [], status: 'active', createdAt: '2026-01-15' },
{ id: 'B4', name: 'Batch-2026D', course: 'Cybersecurity Systems', studentCount: 10, students: [], status: 'active', createdAt: '2026-01-18' },
{ id: 'B5', name: 'Batch-2026E', course: 'Cloud Architecture', studentCount: 10, students: [], status: 'active', createdAt: '2026-01-20' },
{ id: 'B6', name: 'Batch-2026F', course: 'Mobile App Design', studentCount: 10, students: [], status: 'active', createdAt: '2026-01-22' },
{ id: 'B7', name: 'Batch-2026G', course: 'Database Administration', studentCount: 10, students: [], status: 'active', createdAt: '2026-01-25' },
{ id: 'B8', name: 'Batch-2026H', course: 'Data Analytics Foundation', studentCount: 10, students: [], status: 'active', createdAt: '2026-01-28' },
{ id: 'B9', name: 'Batch-2026I', course: 'Advanced DevOps Core', studentCount: 10, students: [], status: 'active', createdAt: '2026-02-01' },
{ id: 'B10', name: 'Batch-2026J', course: 'Product Management', studentCount: 10, students: [], status: 'active', createdAt: '2026-02-05' }];


// Names list for generating 100 students
const firstNames = [
'Liam', 'Noah', 'Oliver', 'Elijah', 'William', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
'Mason', 'Michael', 'Ethan', 'Daniel', 'Jacob', 'Logan', 'Jackson', 'Levi', 'Sebastian', 'Mateo',
'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn',
'Abigail', 'Emily', 'Ella', 'Elizabeth', 'Camila', 'Luna', 'Sofia', 'Avery', 'Mila', 'Aria',
'Aiden', 'Gabriel', 'Carter', 'Grayson', 'Leo', 'Jayden', 'John', 'Wyatt', 'Luke', 'Owen',
'Scarlett', 'Victoria', 'Madison', 'Eleanor', 'Grace', 'Hazel', 'Aurora', 'Penelope', 'Layla', 'Riley'];


const lastNames = [
'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'];


// Generate 100 Students
export const generateStudents = () => {
  const students = [];

  for (let i = 1; i <= 15; i++) {
    const fName = firstNames[(i - 1) % firstNames.length];
    const lName = lastNames[Math.floor(i * 7 % lastNames.length)];
    const name = `${fName} ${lName}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@xebia-student.com`;

    // Assign student to one of the 10 batches sequentially
    const batchIndex = (i - 1) % 10;
    const batchId = initialBatches[batchIndex].id;

    students.push({
      id: `S${i}`,
      name,
      email,
      role: 'student',
      batches: [batchId],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fName}${lName}`,
      averageScore: Math.floor(Math.random() * 30) + 65, // 65 - 95%
      assessmentsCompleted: Math.floor(Math.random() * 8) + 12 // 12 - 20 completed
    });

    // Track students inside batches
    initialBatches[batchIndex].students.push(`S${i}`);
  }

  // Distribute counts back to batches
  initialBatches.forEach((b) => {
    b.studentCount = b.students.length;
  });

  return students;
};

export const initialStudents = generateStudents();

// Generate structured 50 Assessments with mixed question types, drafts, archived, and published
export const generateAssessments = () => {
  const assessments = [];
  const subjects = [
  { title: 'Intro to React & JSX', type: 'mcq', dept: 'Computer Science', t: 'T1' },
  { title: 'AI Ethics & Guidelines', type: 'true_false', dept: 'Data Science', t: 'T2' },
  { title: 'Responsive Layouts Design', type: 'file_upload', dept: 'UI/UX Design', t: 'T3' },
  { title: 'Web Application Vulnerabilities', type: 'mcq', dept: 'Cybersecurity Systems', t: 'T4' },
  { title: 'Advanced SQL Query Design', type: 'assignment', dept: 'Database Systems', t: 'T5' },
  { title: 'Docker Container Deployment', type: 'mixed', dept: 'Computer Science', t: 'T1' },
  { title: 'Linear Regression Modeling', type: 'mcq', dept: 'Data Science', t: 'T2' },
  { title: 'Figma Prototyping Essentials', type: 'short_answer', dept: 'UI/UX Design', t: 'T3' },
  { title: 'CI/CD Pipeline Security', type: 'assignment', dept: 'Software Engineering', t: 'T4' },
  { title: 'NoSQL Database Modeling', type: 'mixed', dept: 'Database Systems', t: 'T5' }];


  // Helper questions
  const mcqQuestions = [
  {
    id: 'Q1',
    type: 'mcq',
    question: 'Which Hook is used to perform side effects in React functional components?',
    marks: 5,
    required: true,
    options: ['useState', 'useEffect', 'useContext', 'useRef'],
    correctAnswer: '1', // index 1 (useEffect)
    explanation: 'useEffect Hook lets you perform side effects in functional components, similar to componentDidMount and componentDidUpdate in classes.'
  },
  {
    id: 'Q2',
    type: 'mcq',
    question: 'In Tailwind CSS, which class is used to apply a background blur effect?',
    marks: 5,
    required: true,
    options: ['blur-sm', 'bg-blur', 'backdrop-blur', 'overlay-blur'],
    correctAnswer: '2', // backdrop-blur
    explanation: 'The backdrop-blur class is used to apply a blur filter to the area behind an element.'
  }];


  const tfQuestions = [
  {
    id: 'Q3',
    type: 'true_false',
    question: 'React elements are immutable. Once created, they cannot be modified directly.',
    marks: 5,
    required: true,
    options: ['True', 'False'],
    correctAnswer: '0', // True
    explanation: 'An element is like a single frame in a movie: it represents the UI at a certain point in time.'
  },
  {
    id: 'Q4',
    type: 'true_false',
    question: 'Next.js is a client-side only library built by Facebook.',
    marks: 5,
    required: true,
    options: ['True', 'False'],
    correctAnswer: '1', // False
    explanation: 'Next.js is a full-stack framework created by Vercel, which supports server-side rendering.'
  }];


  const multiSelectQuestions = [
  {
    id: 'Q5',
    type: 'multi_select',
    question: 'Which of the following are valid lifecycle phases in React? (Select all that apply)',
    marks: 10,
    required: true,
    options: ['Mounting', 'Updating', 'Unmounting', 'Compiling', 'Rendering'],
    correctAnswer: ['0', '1', '2'], // Mounting, Updating, Unmounting
    explanation: 'React components go through three main phases: Mounting (creation), Updating (props/state changes), and Unmounting (destruction).'
  }];


  const shortAnswerQuestions = [
  {
    id: 'Q6',
    type: 'short_answer',
    question: 'Explain what Virtual DOM is and how React optimizes rendering.',
    marks: 10,
    required: true,
    explanation: 'The Virtual DOM is a lightweight, in-memory representation of the real DOM. React updates the virtual representation first, diffs it with the previous state, and batched-updates only the changed elements in the real DOM.'
  }];


  const fileUploadQuestions = [
  {
    id: 'Q7',
    type: 'file_upload',
    question: 'Create a responsive navigation bar using HTML and Tailwind. Export as a zip or pdf containing your code and screenshots.',
    marks: 20,
    required: true,
    explanation: 'Requires a standard file submission containing CSS layout classes, mobile-responsive hamburger drawer, and proper grid/flex setups.'
  }];


  // Let's generate 10 assessments
  for (let i = 1; i <= 10; i++) {
    const sj = subjects[(i - 1) % subjects.length];

    // Choose status distribution
    let status = 'published';
    if (i % 8 === 0) status = 'draft';else
    if (i % 12 === 0) status = 'archived';

    // Dates
    const startDayOffset = i % 5 - 2; // -2 to +2 days from now
    const now = new Date();
    const startDateObj = new Date(now.getTime() + startDayOffset * 24 * 60 * 60 * 1000);
    const endDateObj = new Date(startDateObj.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days availability

    const pad = (n) => n.toString().padStart(2, '0');
    const startDate = `${startDateObj.getFullYear()}-${pad(startDateObj.getMonth() + 1)}-${pad(startDateObj.getDate())}`;
    const endDate = `${endDateObj.getFullYear()}-${pad(endDateObj.getMonth() + 1)}-${pad(endDateObj.getDate())}`;

    // Distribute among batches. Most assessments get 1-2 batches, some get all
    let batchesAssigned = [];
    if (i % 5 === 0) {
      batchesAssigned = ['B1', 'B2', 'B3'];
    } else {
      const bIndex1 = i * 3 % 10;
      const bIndex2 = i * 7 % 10;
      batchesAssigned = [initialBatches[bIndex1].id];
      if (bIndex1 !== bIndex2) {
        batchesAssigned.push(initialBatches[bIndex2].id);
      }
    }

    // Assign questions based on assessment type
    let questions = [];
    let type = 'mcq';

    if (i % 7 === 1) {
      questions = [...mcqQuestions];
      type = 'mcq';
    } else if (i % 7 === 2) {
      questions = [...tfQuestions];
      type = 'true_false';
    } else if (i % 7 === 3) {
      questions = [...multiSelectQuestions];
      type = 'multi_select';
    } else if (i % 7 === 4) {
      questions = [...shortAnswerQuestions];
      type = 'short_answer';
    } else if (i % 7 === 5) {
      questions = [...fileUploadQuestions];
      type = 'file_upload';
    } else if (i % 7 === 6) {
      questions = [{ ...mcqQuestions[0], id: 'QM1' }, { ...tfQuestions[0], id: 'QM2' }, { ...shortAnswerQuestions[0], id: 'QM3' }];
      type = 'mixed';
    } else {
      questions = [{ ...fileUploadQuestions[0], id: 'QA1' }];
      type = 'assignment';
    }

    // Calculate total marks
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0) || 20;

    assessments.push({
      id: `A${i}`,
      title: `${sj.title} [V${Math.ceil(i / 10)}]`,
      description: `This assessment tests students on their intermediate to advanced knowledge regarding ${sj.title}. Perfect for milestone evaluations.`,
      instructions: 'Please read each question carefully. Do not refresh or exit fullscreen during the examination. Autocommit triggers on timer expiration.',
      batches: batchesAssigned,
      difficulty: i % 3 === 0 ? 'Hard' : i % 3 === 1 ? 'Medium' : 'Easy',
      marks: totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.6), // 60% pass
      duration: 15 + i % 4 * 15, // 15, 30, 45, 60 mins
      startDate,
      startTime: `${pad(9 + i % 5)}:00`,
      endDate,
      endTime: '23:59',
      attemptsAllowed: i % 2 === 0 ? 1 : 2,
      shuffleQuestions: i % 2 === 0,
      randomizeOptions: i % 3 === 0,
      autoGrade: type === 'mcq' || type === 'true_false' || type === 'multi_select',
      manualGrade: type === 'short_answer' || type === 'file_upload' || type === 'assignment' || type === 'mixed',
      status,
      type,
      questions,
      createdBy: sj.t,
      createdAt: '2026-03-01'
    });
  }

  return assessments;
};

export const initialAssessments = generateAssessments();

// Generate structured 150 Submissions across students
export const generateSubmissions = (assessments, students) => {
  const submissions = [];

  // Let's map submissions for published assessments
  const publishedAssessments = assessments.filter((a) => a.status === 'published');

  // We want to simulate some fully graded quizzes, some waiting for evaluation, some in progress
  for (let idx = 0; idx < 15; idx++) {
    const assessment = publishedAssessments[idx % publishedAssessments.length];

    // Find students belonging to the assigned batches
    const eligibleStudents = students.filter((s) =>
    s.batches.some((b) => assessment.batches.includes(b))
    );

    if (eligibleStudents.length === 0) continue;

    // Choose a student
    const student = eligibleStudents[Math.floor(idx * 11 % eligibleStudents.length)];

    // Check if duplicate submission for same student-assessment
    const exists = submissions.some((s) => s.assessmentId === assessment.id && s.studentId === student.id);
    if (exists) continue;

    const isPendingEvaluation = assessment.manualGrade && idx % 3 === 0;
    const isInProgress = !isPendingEvaluation && idx % 10 === 0;

    let subStatus = 'submitted';
    if (isInProgress) subStatus = 'in_progress';

    // Answers formulation
    const answers = assessment.questions.map((q) => {
      let answerVal = '';
      if (q.type === 'mcq' || q.type === 'true_false') {
        // 70% chance correct answer
        const isCorrect = Math.random() < 0.75;
        answerVal = isCorrect ? q.correctAnswer : ((Number(q.correctAnswer) + 1) % (q.options?.length || 2)).toString();
      } else if (q.type === 'multi_select') {
        answerVal = q.correctAnswer || ['0'];
      } else if (q.type === 'short_answer' || q.type === 'paragraph') {
        answerVal = 'Based on industry standard protocols, this is handled through proper React component decoupling and mounting optimizations.';
      } else if (q.type === 'file_upload') {
        answerVal = {
          name: 'project-submission-v2.zip',
          size: '4.2 MB',
          uploadedAt: '2026-07-05T14:32:00-07:00',
          url: '#'
        };
      }
      return {
        questionId: q.id,
        answer: answerVal,
        marksAwarded: 0,
        remarks: ''
      };
    });

    // Score calculation
    let totalScore = 0;
    let isEvaluated = false;
    let remarks = '';

    if (subStatus === 'submitted') {
      if (assessment.autoGrade) {
        // Calculate auto-grade
        assessment.questions.forEach((q, qidx) => {
          const ansObj = answers[qidx];
          if (q.type === 'mcq' || q.type === 'true_false') {
            if (ansObj.answer === q.correctAnswer) {
              ansObj.marksAwarded = q.marks;
              totalScore += q.marks;
            }
          } else if (q.type === 'multi_select') {
            const correctSet = new Set(q.correctAnswer);
            const providedSet = new Set(ansObj.answer);
            const match = correctSet.size === providedSet.size && [...correctSet].every((val) => providedSet.has(val));
            if (match) {
              ansObj.marksAwarded = q.marks;
              totalScore += q.marks;
            }
          }
        });
        isEvaluated = true;
      } else {
        // Manual evaluation
        if (isPendingEvaluation) {
          isEvaluated = false;
        } else {
          // Already evaluated
          assessment.questions.forEach((q, qidx) => {
            const ansObj = answers[qidx];
            // random manual marks
            const randomMarks = Math.floor(Math.random() * (q.marks + 1));
            ansObj.marksAwarded = randomMarks;
            ansObj.remarks = randomMarks === q.marks ? 'Excellent response!' : 'A few missing points, but a great start.';
            totalScore += randomMarks;
          });
          isEvaluated = true;
          remarks = 'Overall well detailed submission. Continue developing your backend routing patterns.';
        }
      }
    }

    const percentage = assessment.marks > 0 ? Math.round(totalScore / assessment.marks * 100) : 0;

    submissions.push({
      id: `SUB${idx + 1}`,
      assessmentId: assessment.id,
      studentId: student.id,
      status: subStatus,
      startedAt: '2026-07-05T10:00:00-07:00',
      submittedAt: subStatus === 'submitted' ? '2026-07-05T10:25:00-07:00' : undefined,
      answers,
      score: totalScore,
      percentage,
      timeTaken: Math.floor(Math.random() * 600) + 900, // 15-25 mins (in secs)
      isEvaluated,
      remarks,
      evaluatedBy: isEvaluated ? assessment.createdBy : undefined
    });
  }

  return submissions;
};

export const initialSubmissions = generateSubmissions(initialAssessments, initialStudents);

// Preload real-time demo notifications
export const initialNotifications = [
{ id: 'N1', title: 'New Assessment Published', message: 'Dr. Evelyn Stone published "Intro to React & JSX [V1]". Complete before Friday.', type: 'publish', createdAt: '2026-07-06T08:00:00-07:00', isRead: false, recipientId: 'all_students' },
{ id: 'N2', title: 'Evaluation Completed', message: 'Your submission for "Figma Prototyping Essentials [V1]" has been graded.', type: 'evaluation', createdAt: '2026-07-05T16:30:00-07:00', isRead: true, recipientId: 'S1' },
{ id: 'N3', title: 'Urgent Deadline Reminder', message: 'The assessment "Advanced SQL Query Design [V1]" closes tomorrow at midnight!', type: 'warning', createdAt: '2026-07-06T09:15:00-07:00', isRead: false, recipientId: 'all_students' },
{ id: 'N4', title: 'Submission Evaluated', message: 'Marcus Vance marked your Cloud Architecture project.', type: 'evaluation', createdAt: '2026-07-04T11:00:00-07:00', isRead: true, recipientId: 'S5' },
{ id: 'N5', title: 'Platform Scheduled Maintenance', message: 'Xebia Academy systems will undergo brief maintenance this Sunday at 2 AM UTC.', type: 'system', createdAt: '2026-07-03T10:00:00-07:00', isRead: true, recipientId: 'all_students' }];