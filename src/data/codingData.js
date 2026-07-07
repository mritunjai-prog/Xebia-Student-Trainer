




































// 1. Initial Coding Problems with Complete Templates and Test Cases
export const initialCodingQuestions = [
{
  id: 'Q-CODE1',
  type: 'coding',
  question: 'Two Sum Problem',
  marks: 30,
  required: true,
  codingDifficulty: 'Easy',
  codingTimeLimit: 1,
  codingMemoryLimit: 256,
  codingLanguagesAllowed: ['javascript', 'python', 'java', 'cpp'],
  codingTags: ['arrays', 'hashmaps', 'search'],
  codingConstraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
  codingInputFormat: 'First line contains N (the array size).\nSecond line contains N space-separated integers representing the array.\nThird line contains a single integer target.',
  codingOutputFormat: 'Output two space-separated integers representing the indices of the two elements that sum to target.',
  codingSampleInput: '4\n2 7 11 15\n9',
  codingSampleOutput: '0 1',
  codingExplanation: 'Because nums[0] + nums[1] = 2 + 7 = 9, we return "0 1" as their indices.',
  codingHints: [
  'A brute force O(N^2) solution checks all pairs. Can you optimize it?',
  'Consider using a Hash Map to store the numbers you have visited along with their indices. If target - current_number exists in your map, you found the solution!'],

  codingNotes: 'Indices must be printed in ascending order.',
  codingTemplates: {
    javascript: `/**\n * Solve the Two Sum Problem\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const difference = target - nums[i];\n        if (map.has(difference)) {\n            return [map.get(difference), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}`,
    python: `def two_sum(nums, target):\n    # Write your python code here\n    seen = {}\n    for i, num in enumerate(nums):\n        difference = target - num\n        if difference in seen:\n            return [seen[difference], i]\n        seen[num] = i\n    return []`,
    java: `import java.util.*;\n\npublic class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                return new int[] { map.get(diff), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}`,
    cpp: `#include <vector>\n#include <unordered_map>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        std::unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); ++i) {\n            int diff = target - nums[i];\n            if (seen.count(diff)) {\n                return {seen[diff], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`
  },
  codingTestCases: [
  { id: 'TC1-1', input: '4\n2 7 11 15\n9', expectedOutput: '0 1', weight: 10, visibility: 'public' },
  { id: 'TC1-2', input: '3\n3 2 4\n6', expectedOutput: '1 2', weight: 10, visibility: 'public' },
  { id: 'TC1-3', input: '2\n3 3\n6', expectedOutput: '0 1', weight: 10, visibility: 'hidden' }]

},
{
  id: 'Q-CODE2',
  type: 'coding',
  question: 'Reverse Words in a String',
  marks: 30,
  required: true,
  codingDifficulty: 'Medium',
  codingTimeLimit: 1.5,
  codingMemoryLimit: 256,
  codingLanguagesAllowed: ['javascript', 'python', 'java'],
  codingTags: ['strings', 'algorithms'],
  codingConstraints: '1 <= s.length <= 10^4\ns contains English letters (upper/lower case), digits, spaces, and punctuation.',
  codingInputFormat: 'A single line containing the string s.',
  codingOutputFormat: 'A single string with the words reversed and separated by a single space, without leading or trailing spaces.',
  codingSampleInput: 'the sky is blue',
  codingSampleOutput: 'blue is sky the',
  codingExplanation: 'Words are reversed and joined back together. Note that trailing spaces are removed and multiple spaces between words are collapsed into a single space.',
  codingHints: [
  'Split the string into words using a whitespace regular expression or standard string split.',
  'Reverse the list of words and filter out any empty spaces before joining them back with a single space.'],

  codingNotes: 'Do not include trailing spaces or multiple spaces between words.',
  codingTemplates: {
    javascript: `/**\n * Reverse words in a string\n * @param {string} s\n * @return {string}\n */\nfunction reverseWords(s) {\n    return s.trim().split(/\\s+/).reverse().join(' ');\n}`,
    python: `def reverse_words(s):\n    # Write your python code here\n    return ' '.join(s.split()[::-1])`,
    java: `import java.util.*;\n\npublic class Solution {\n    public String reverseWords(String s) {\n        String[] words = s.trim().split("\\\\s+");\n        Collections.reverse(Arrays.asList(words));\n        return String.join(" ", words);\n    }\n}`
  },
  codingTestCases: [
  { id: 'TC2-1', input: 'the sky is blue', expectedOutput: 'blue is sky the', weight: 10, visibility: 'public' },
  { id: 'TC2-2', input: '  hello world  ', expectedOutput: 'world hello', weight: 10, visibility: 'public' },
  { id: 'TC2-3', input: 'a good   example', expectedOutput: 'example good a', weight: 10, visibility: 'hidden' }]

},
{
  id: 'Q-CODE3',
  type: 'coding',
  question: 'Climbing Stairs',
  marks: 40,
  required: true,
  codingDifficulty: 'Easy',
  codingTimeLimit: 1.0,
  codingMemoryLimit: 128,
  codingLanguagesAllowed: ['javascript', 'python'],
  codingTags: ['dynamic-programming', 'memoization'],
  codingConstraints: '1 <= n <= 45',
  codingInputFormat: 'A single line containing an integer N.',
  codingOutputFormat: 'Output a single integer representing the number of distinct ways to climb to the top.',
  codingSampleInput: '3',
  codingSampleOutput: '3',
  codingExplanation: 'There are three ways to climb to the top:\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step',
  codingHints: [
  'To reach stair N, you could have come from stair N-1 or N-2.',
  'This means climbStairs(N) = climbStairs(N-1) + climbStairs(N-2). This is equivalent to the Fibonacci sequence.'],

  codingNotes: 'Make sure your solution operates in O(N) time to prevent Time Limit Exceeded errors on larger test cases.',
  codingTemplates: {
    javascript: `/**\n * Find number of ways to climb stairs\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n    if (n <= 2) return n;\n    let a = 1, b = 2;\n    for (let i = 3; i <= n; i++) {\n        const current = a + b;\n        a = b;\n        b = current;\n    }\n    return b;\n}`,
    python: `def climb_stairs(n):\n    if n <= 2:\n        return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b`
  },
  codingTestCases: [
  { id: 'TC3-1', input: '2', expectedOutput: '2', weight: 10, visibility: 'public' },
  { id: 'TC3-2', input: '3', expectedOutput: '3', weight: 10, visibility: 'public' },
  { id: 'TC3-3', input: '10', expectedOutput: '89', weight: 20, visibility: 'hidden' }]

},
{
  id: 'Q-CODE4',
  type: 'coding',
  question: 'Valid Parentheses',
  marks: 40,
  required: true,
  codingDifficulty: 'Easy',
  codingTimeLimit: 1.0,
  codingMemoryLimit: 256,
  codingLanguagesAllowed: ['javascript', 'python', 'java'],
  codingTags: ['stack', 'data-structures'],
  codingConstraints: '1 <= s.length <= 10^4\ns consists of parentheses only: ()[]{}',
  codingInputFormat: 'A single line containing the string of parentheses s.',
  codingOutputFormat: 'Output "true" if s is valid, otherwise "false".',
  codingSampleInput: '()[]{}',
  codingSampleOutput: 'true',
  codingExplanation: 'Open brackets must be closed by the same type of brackets and in the correct order.',
  codingHints: [
  'Use a Stack to keep track of opening brackets.',
  'When you encounter a closing bracket, pop the top of the stack and check if they match. If they do not match, or if the stack is empty, it is invalid.'],

  codingTemplates: {
    javascript: `function isValid(s) {\n    const stack = [];\n    const pairs = { ')': '(', ']': '[', '}': '{' };\n    for (let char of s) {\n        if (char in pairs) {\n            if (stack.pop() !== pairs[char]) return false;\n        } else {\n            stack.push(char);\n        }\n    }\n    return stack.length === 0;\n}`,
    python: `def is_valid(s):\n    stack = []\n    pairs = {')': '(', ']': '[', '}': '{'}\n    for char in s:\n        if char in pairs:\n            if not stack or stack.pop() != pairs[char]:\n                return False\n        else:\n            stack.append(char)\n    return len(stack) == 0`
  },
  codingTestCases: [
  { id: 'TC4-1', input: '()[]{}', expectedOutput: 'true', weight: 10, visibility: 'public' },
  { id: 'TC4-2', input: '(]', expectedOutput: 'false', weight: 10, visibility: 'public' },
  { id: 'TC4-3', input: '{[]}', expectedOutput: 'true', weight: 20, visibility: 'hidden' }]

},
{
  id: 'Q-CODE5',
  type: 'coding',
  question: 'Find the Missing Number',
  marks: 30,
  required: true,
  codingDifficulty: 'Easy',
  codingTimeLimit: 1.0,
  codingMemoryLimit: 256,
  codingLanguagesAllowed: ['java', 'cpp'],
  codingTags: ['arrays', 'math', 'search'],
  codingConstraints: '1 <= n <= 10^4\nAll numbers in nums are unique.',
  codingInputFormat: 'First line contains N.\nSecond line contains N space-separated integers in the range [0, N].',
  codingOutputFormat: 'Output the single missing integer.',
  codingSampleInput: '3\n3 0 1',
  codingSampleOutput: '2',
  codingExplanation: 'n = 3 since there are 3 numbers, so all numbers are in the range [0, 3]. 2 is the missing number in the range since it does not appear in nums.',
  codingHints: [
  'The sum of numbers from 0 to N is N * (N + 1) / 2.',
  'Subtract the sum of the array elements from the expected total sum to find the missing number.'],

  codingTemplates: {
    java: `import java.util.*;\n\npublic class Solution {\n    public int findMissingNumber(int[] nums) {\n        // Write your Java code here\n        int n = nums.length;\n        int expectedSum = n * (n + 1) / 2;\n        int actualSum = 0;\n        for (int num : nums) {\n            actualSum += num;\n        }\n        return expectedSum - actualSum;\n    }\n}`,
    cpp: `#include <vector>\n#include <numeric>\n\nclass Solution {\npublic:\n    int findMissingNumber(std::vector<int>& nums) {\n        // Write your C++ code here\n        int n = nums.size();\n        int expectedSum = n * (n + 1) / 2;\n        int actualSum = 0;\n        for (int num : nums) {\n            actualSum += num;\n        }\n        return expectedSum - actualSum;\n    }\n};`
  },
  codingTestCases: [
  { id: 'TC5-1', input: '3\n3 0 1', expectedOutput: '2', weight: 15, visibility: 'public' },
  { id: 'TC5-2', input: '9\n9 6 4 2 3 5 7 0 1', expectedOutput: '8', weight: 15, visibility: 'hidden' }]

},
{
  id: 'Q-CODE6',
  type: 'coding',
  question: 'Binary Search Algorithm',
  marks: 40,
  required: true,
  codingDifficulty: 'Easy',
  codingTimeLimit: 1.0,
  codingMemoryLimit: 256,
  codingLanguagesAllowed: ['java', 'cpp'],
  codingTags: ['algorithms', 'search', 'binary-search'],
  codingConstraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nnums is sorted in ascending order.',
  codingInputFormat: 'First line contains N.\nSecond line contains N space-separated sorted integers.\nThird line contains target.',
  codingOutputFormat: 'Output the 0-based index of target if found, otherwise output -1.',
  codingSampleInput: '6\n-1 0 3 5 9 12\n9',
  codingSampleOutput: '4',
  codingExplanation: '9 exists in nums and its index is 4.',
  codingHints: [
  'Initialize left = 0 and right = N - 1 pointers.',
  'In a loop, calculate mid and adjust left or right pointers based on comparison.'],

  codingTemplates: {
    java: `import java.util.*;\n\npublic class Solution {\n    public int search(int[] nums, int target) {\n        // Write your Java code here\n        int left = 0, right = nums.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) {\n                return mid;\n            }\n            if (nums[mid] < target) {\n                left = mid + 1;\n            } else {\n                right = mid - 1;\n            }\n        }\n        return -1;\n    }\n}`,
    cpp: `#include <vector>\n\nclass Solution {\npublic:\n    int search(std::vector<int>& nums, int target) {\n        // Write your C++ code here\n        int left = 0, right = nums.size() - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) {\n                return mid;\n            }\n            if (nums[mid] < target) {\n                left = mid + 1;\n            } else {\n                right = mid - 1;\n            }\n        }\n        return -1;\n    }\n};`
  },
  codingTestCases: [
  { id: 'TC6-1', input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', weight: 20, visibility: 'public' },
  { id: 'TC6-2', input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1', weight: 20, visibility: 'hidden' }]

}];


// 2. Initial Coding Assessments linking our Coding Problems
export const initialCodingAssessments = [
{
  id: 'A-CODE1',
  title: 'Data Structures Challenge: Arrays & Strings',
  description: 'A comprehensive coding evaluation designed to test intermediate coding skills on array search, dictionary mappings, and string token manipulation.',
  instructions: '1. Choose your preferred language from the dropdown.\n2. Write your code inside the editor.\n3. Click "Run Code" to test against public test cases.\n4. Click "Submit Code" to run hidden cases and lock in your submission.\n5. Copypasta and window shifting are monitored.',
  batches: ['B1', 'B2', 'B3'],
  difficulty: 'Medium',
  marks: 60,
  passingMarks: 36,
  duration: 60,
  startDate: '2026-07-01',
  startTime: '00:00',
  endDate: '2026-07-31',
  endTime: '23:59',
  attemptsAllowed: 3,
  shuffleQuestions: false,
  randomizeOptions: false,
  autoGrade: true,
  manualGrade: false,
  status: 'published',
  type: 'coding',
  createdBy: 'T1', // Evelyn Stone
  createdAt: '2026-07-01',
  questions: [initialCodingQuestions[0], initialCodingQuestions[1]], // Two sum and Reverse Words
  partialScoring: true,
  autoEvaluation: true,
  manualEvaluation: false,
  showTestCasesAfterSubmission: true,
  showExpectedOutput: true,
  enableCustomInput: true,
  allowCopyPaste: false,
  fullScreenMode: true
},
{
  id: 'A-CODE2',
  title: 'Advanced Algorithmic Challenge: DP & Stack',
  description: 'A focused coding round evaluating knowledge of dynamic programming memoization, recursion, and stack-based parsing algorithms.',
  instructions: 'Please implement optimal solutions with O(N) time and space constraints. Runtime and memory thresholds are strictly enforced.',
  batches: ['B1', 'B2'],
  difficulty: 'Hard',
  marks: 80,
  passingMarks: 48,
  duration: 90,
  startDate: '2026-07-03',
  startTime: '08:00',
  endDate: '2026-07-28',
  endTime: '23:59',
  attemptsAllowed: 2,
  shuffleQuestions: false,
  randomizeOptions: false,
  autoGrade: true,
  manualGrade: false,
  status: 'published',
  type: 'coding',
  createdBy: 'T4', // Alan Turing
  createdAt: '2026-07-03',
  questions: [initialCodingQuestions[2], initialCodingQuestions[3]], // Climb stairs and Valid parenthese
  partialScoring: true,
  autoEvaluation: true,
  manualEvaluation: false,
  showTestCasesAfterSubmission: true,
  showExpectedOutput: false,
  enableCustomInput: true,
  allowCopyPaste: true,
  fullScreenMode: false
},
{
  id: 'A-CODE3',
  title: 'Core Java & C++ Programming Assessment',
  description: 'A specialized exam focusing on Core Java methods, vector manipulations in C++, and implementation of basic algorithms in both strictly typed ecosystems.',
  instructions: '1. Select either C++ or Java from the language selection box.\n2. Do not modify the class or method signature in the template as it is required for grading inputs.\n3. Verify your logic using public test cases.\n4. Finalize the exam to trigger hidden test evaluation.',
  batches: ['B1', 'B2', 'B3'],
  difficulty: 'Medium',
  marks: 70,
  passingMarks: 42,
  duration: 45,
  startDate: '2026-07-01',
  startTime: '00:00',
  endDate: '2026-07-31',
  endTime: '23:59',
  attemptsAllowed: 3,
  shuffleQuestions: false,
  randomizeOptions: false,
  autoGrade: true,
  manualGrade: false,
  status: 'published',
  type: 'coding',
  createdBy: 'T4', // Alan Turing
  createdAt: '2026-07-01',
  questions: [initialCodingQuestions[4], initialCodingQuestions[5]],
  partialScoring: true,
  autoEvaluation: true,
  manualEvaluation: false,
  showTestCasesAfterSubmission: true,
  showExpectedOutput: true,
  enableCustomInput: true,
  allowCopyPaste: true,
  fullScreenMode: false
}];


// 3. Initial Submissions / Attempts
export const initialCodingSubmissions = [
{
  id: 'CSUB-1',
  assessmentId: 'A-CODE1',
  studentId: 'S1', // Active student
  studentName: 'Liam Smith',
  problemId: 'Q-CODE1',
  problemTitle: 'Two Sum Problem',
  code: `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const difference = target - nums[i];\n        if (map.has(difference)) {\n            return [map.get(difference), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}`,
  language: 'javascript',
  score: 30,
  timeTaken: 450,
  memoryUsed: 32.4,
  status: 'Accepted',
  testCasesPassed: 3,
  totalTestCases: 3,
  submittedAt: '2026-07-05T11:22:00-07:00'
},
{
  id: 'CSUB-2',
  assessmentId: 'A-CODE1',
  studentId: 'S1', // Active student
  studentName: 'Liam Smith',
  problemId: 'Q-CODE2',
  problemTitle: 'Reverse Words in a String',
  code: `function reverseWords(s) {\n    // Incorrect split, fails some hidden cases\n    return s.trim().split(' ').reverse().join(' ');\n}`,
  language: 'javascript',
  score: 20,
  timeTaken: 820,
  memoryUsed: 35.1,
  status: 'Partially Accepted',
  testCasesPassed: 2,
  totalTestCases: 3,
  submittedAt: '2026-07-05T11:45:00-07:00'
},
{
  id: 'CSUB-3',
  assessmentId: 'A-CODE1',
  studentId: 'S2',
  studentName: 'Noah Smith',
  problemId: 'Q-CODE1',
  problemTitle: 'Two Sum Problem',
  code: `def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`,
  language: 'python',
  score: 30,
  timeTaken: 210,
  memoryUsed: 14.8,
  status: 'Accepted',
  testCasesPassed: 3,
  totalTestCases: 3,
  submittedAt: '2026-07-04T15:10:00-07:00'
},
{
  id: 'CSUB-4',
  assessmentId: 'A-CODE1',
  studentId: 'S3',
  studentName: 'Oliver Johnson',
  problemId: 'Q-CODE1',
  problemTitle: 'Two Sum Problem',
  code: `function twoSum(nums, target) {\n    // Slow approach\n    for(let i=0; i<nums.length; i++) {\n        for(let j=i+1; j<nums.length; j++) {\n            if (nums[i] + nums[j] === target) return [i, j];\n        }\n    }\n}`,
  language: 'javascript',
  score: 30,
  timeTaken: 910,
  memoryUsed: 42.1,
  status: 'Accepted',
  testCasesPassed: 3,
  totalTestCases: 3,
  submittedAt: '2026-07-05T10:15:00-07:00'
},
{
  id: 'CSUB-5',
  assessmentId: 'A-CODE2',
  studentId: 'S2',
  studentName: 'Noah Smith',
  problemId: 'Q-CODE3',
  problemTitle: 'Climbing Stairs',
  code: `def climb_stairs(n):\n    if n <= 2: return n\n    return climb_stairs(n-1) + climb_stairs(n-2) # Exponential TLE`,
  language: 'python',
  score: 20,
  timeTaken: 90,
  memoryUsed: 8.2,
  status: 'Time Limit Exceeded',
  testCasesPassed: 2,
  totalTestCases: 3,
  submittedAt: '2026-07-05T14:30:00-07:00'
}];


// 4. Initial Coding Leaderboard data
export const initialCodingLeaderboard = [
{ id: 'CL1', rank: 1, studentId: 'S2', studentName: 'Noah Smith', score: 350, problemsSolved: 9, totalAttempts: 11, averageTime: 320, highestScore: 100, badge: 'Gold' },
{ id: 'CL2', rank: 2, studentId: 'S5', studentName: 'William Williams', score: 310, problemsSolved: 8, totalAttempts: 10, averageTime: 410, highestScore: 100, badge: 'Gold' },
{ id: 'CL3', rank: 3, studentId: 'S1', studentName: 'Liam Smith', score: 280, problemsSolved: 7, totalAttempts: 9, averageTime: 450, highestScore: 100, badge: 'Silver' },
{ id: 'CL4', rank: 4, studentId: 'S3', studentName: 'Oliver Johnson', score: 240, problemsSolved: 6, totalAttempts: 12, averageTime: 520, highestScore: 80, badge: 'Silver' },
{ id: 'CL5', rank: 5, studentId: 'S10', studentName: 'Alexander Garcia', score: 190, problemsSolved: 5, totalAttempts: 7, averageTime: 610, highestScore: 80, badge: 'Bronze' },
{ id: 'CL6', rank: 6, studentId: 'S12', studentName: 'Michael Miller', score: 140, problemsSolved: 4, totalAttempts: 5, averageTime: 380, highestScore: 90, badge: 'Rising Star' }];