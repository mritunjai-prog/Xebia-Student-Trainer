import re
import os

FILE_PATH = r"d:\Xebia-Student-Trainer\src\context\LMSContext.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add apiClient import
if "import { apiClient }" not in content:
    content = content.replace(
        "import { initialTeachers,", 
        "import { apiClient } from '../api/client';\nimport { initialTeachers,"
    )

# 2. Replace state initialization
state_init_pattern = r"  // Initialize States from LocalStorage or preloaded dummy data\n(.*?)\n  const \[currentUser, setCurrentUser\]"
replacement = """  // Initialize States from Backend API
  const [teachers, setTeachers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Local coding states
  const [codingSubmissions, setCodingSubmissions] = useState(() => {
    const data = localStorage.getItem('codingSubmissions');
    return data ? JSON.parse(data) : initialCodingSubmissions;
  });

  const [codingLeaderboard, setCodingLeaderboard] = useState(() => {
    const data = localStorage.getItem('codingLeaderboard');
    return data ? JSON.parse(data) : initialCodingLeaderboard;
  });

  const [notifications, setNotifications] = useState(() => {
    const data = localStorage.getItem('notifications');
    return data ? JSON.parse(data) : initialNotifications;
  });

  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const users = await apiClient.getUsers();
        setTeachers(users.filter(u => u.role === 'teacher'));
        setStudents(users.filter(u => u.role === 'student'));
        
        const b = await apiClient.getBatches();
        setBatches(b);
        
        const a = await apiClient.getAssessments();
        setAssessments([...a, ...initialCodingAssessments]);
        
        const s = await apiClient.getSubmissions();
        setSubmissions(s);
      } catch (err) {
        console.error("Backend connection failed, using dummy data fallback.", err);
        setTeachers(initialTeachers);
        setStudents(initialStudents);
        setBatches(initialBatches);
        setAssessments([...initialAssessments, ...initialCodingAssessments]);
        setSubmissions(initialSubmissions);
      }
    };
    fetchBackendData();
  }, []);

  const [currentUser, setCurrentUser]"""

content = re.sub(state_init_pattern, replacement, content, flags=re.DOTALL)

# 3. Add fire-and-forget API calls to create functions
content = content.replace(
    "setBatches((prev) => [...prev, newBatch]);",
    "setBatches((prev) => [...prev, newBatch]);\n    apiClient.createBatch(newBatch).catch(console.error);"
)

content = content.replace(
    "setAssessments((prev) => [newAssessment, ...prev]);",
    "setAssessments((prev) => [newAssessment, ...prev]);\n    apiClient.createAssessment(newAssessment).catch(console.error);"
)

content = content.replace(
    "setSubmissions((prev) => [newSub, ...prev]);",
    "setSubmissions((prev) => [newSub, ...prev]);\n    apiClient.createSubmission(newSub).catch(console.error);"
)

content = content.replace(
    "finalSubmission = updatedSub;",
    "finalSubmission = updatedSub;\n      apiClient.createSubmission(updatedSub).catch(console.error);"
)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("LMSContext successfully refactored to use Backend APIs!")
