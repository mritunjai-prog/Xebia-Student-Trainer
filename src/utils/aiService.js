const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const callGroqApi = async (messages, responseFormat = "text") => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        response_format: responseFormat === "json" ? { type: "json_object" } : { type: "text" },
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw error;
  }
};

export const generateAssessmentDescription = async (title, subject, difficulty) => {
  const prompt = `Write a professional, concise description for an assessment. 
Title: ${title || 'Untitled Assessment'}
Subject: ${subject || 'General'}
Difficulty: ${difficulty || 'Medium'}

The description should be 2-3 sentences long and suitable for an enterprise Learning Management System.`;

  return await callGroqApi([
    { role: 'system', content: 'You are an expert assessment designer for an enterprise LMS.' },
    { role: 'user', content: prompt }
  ]);
};

export const generateQuestions = async (topic, count, taxonomy, type) => {
  const typeInstruction = type === 'Mixed Types (All)' 
    ? 'The questions MUST be of randomly selected types from: "mcq", "true_false", "multiple_select", "short_answer", "paragraph", "file_upload", "coding". Ensure a good mix of different types.'
    : `The questions MUST be of type "${type}".`;

  const prompt = `Generate ${count} questions about "${topic}" at the "${taxonomy}" level of Bloom's Taxonomy.
${typeInstruction}

Return ONLY a JSON object with a "questions" array containing the questions.
Each question object MUST have the following structure based on the type:
If type is "mcq": { "id": "q_timestamp_index", "type": "mcq", "text": "Question text", "options": ["opt1", "opt2", "opt3", "opt4"], "correctAnswer": "opt2", "marks": 2 }
If type is "true_false": { "id": "q_timestamp_index", "type": "true_false", "text": "Question text", "options": ["True", "False"], "correctAnswer": "True", "marks": 2 }
If type is "multiple_select": { "id": "q_timestamp_index", "type": "multiple_select", "text": "Question text", "options": ["opt1", "opt2", "opt3", "opt4"], "correctAnswers": ["opt1", "opt3"], "marks": 3 }
If type is "short_answer": { "id": "q_timestamp_index", "type": "short_answer", "text": "Question text", "correctAnswer": "Expected answer concept", "marks": 5 }
If type is "paragraph": { "id": "q_timestamp_index", "type": "paragraph", "text": "Question text", "marks": 10 }
If type is "file_upload": { "id": "q_timestamp_index", "type": "file_upload", "text": "Upload instructions text", "marks": 10 }
If type is "coding": { "id": "q_timestamp_index", "type": "coding", "text": "Problem description", "starterCode": "function solve() {\\n\\n}", "testCases": [{"input": "args", "output": "expected"}], "marks": 15 }

Output MUST be strictly valid JSON.`;

  const responseContent = await callGroqApi([
    { role: 'system', content: 'You are an expert curriculum designer. You only respond with strictly valid JSON.' },
    { role: 'user', content: prompt }
  ], "json");

  try {
    const parsed = JSON.parse(responseContent);
    return parsed.questions || [];
  } catch (err) {
    console.error("Failed to parse AI questions response:", err);
    return [];
  }
};

export const evaluateSubmission = async (questionText, answerText, maxMarks, questionType) => {
  if (!answerText || answerText.trim() === '') {
    return { suggestedMarks: 0, remarks: 'No answer provided.' };
  }

  const prompt = `You are evaluating a student's answer for an assessment.
Question Type: ${questionType}
Question: ${questionText}
Student's Answer: ${answerText}
Maximum Marks: ${maxMarks}

Provide a suggested score (a number from 0 to ${maxMarks}) and a brief 1-sentence remark explaining the score.
Return ONLY a valid JSON object with exactly these two keys:
- "suggestedMarks" (number)
- "remarks" (string)`;

  const responseContent = await callGroqApi([
    { role: 'system', content: 'You are a strict but fair AI grader for an enterprise LMS. You only respond with strictly valid JSON.' },
    { role: 'user', content: prompt }
  ], "json");

  try {
    const parsed = JSON.parse(responseContent);
    return {
      suggestedMarks: typeof parsed.suggestedMarks === 'number' ? parsed.suggestedMarks : Math.round(maxMarks * 0.5),
      remarks: parsed.remarks || 'Evaluated by AI.'
    };
  } catch (err) {
    console.error("Failed to parse AI evaluation response:", err);
    return { suggestedMarks: Math.round(maxMarks * 0.5), remarks: 'AI evaluation failed to parse properly.' };
  }
};
