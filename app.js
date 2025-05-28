const subjectSelect = document.getElementById('subject');
const customDiv = document.getElementById('customSubjectDiv');
const outputSection = document.getElementById('outputSection');
const commentBox = document.getElementById('generatedComment');
const viewSavedBtn = document.getElementById('viewSavedBtn');
const approveBtn = document.getElementById('approveBtn');
const studentSelect = document.getElementById('studentSelect');
const savedOutput = document.getElementById('savedOutput');
const saveTermBtn = document.getElementById('saveTermBtn');
const resetBtn = document.getElementById('resetBtn');
const termHistoryOutput = document.getElementById('termHistoryOutput');
const longCommentCheckbox = document.getElementById('longComment');

const BACKEND_URL = "https://your-backend-url-here"; // 🔁 Replace with your backend

subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
});

async function generateComment() {
  const name = document.getElementById('studentName').value;
  const gender = document.getElementById('gender').value;
  const grade = document.getElementById('grade').value;
  const subject = subjectSelect.value === 'Other'
    ? document.getElementById('customSubject').value
    : subjectSelect.value;
  const notes = document.getElementById('notes').value;
  const longMode = longCommentCheckbox.checked;

  let charLimit = 400;
  if (longMode) {
    if (/learning/i.test(subject)) charLimit = 1400;
    else if (/math/i.test(subject)) charLimit = 800;
    else charLimit = 600;
  }

  const scoreMatch = notes.match(/(\\d{1,2})\\s*\\/\\s*(\\d{1,2})/);
  let level = null;

  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]);
    const total = parseInt(scoreMatch[2]);
    const percent = (score / total) * 100;
    if (percent >= 80) level = 4;
    else if (percent >= 70) level = 3;
    else if (percent >= 60) level = 2;
    else level = 1;
  }

  const levelDescription = level
    ? `The student's performance aligns with Level ${level} expectations based on Ontario curriculum standards.`
    : "";

  const prompt = `
You are writing a professional Ontario elementary report card comment.

Follow these rules:
- DO NOT include test scores, marks, percentages, or letter grades.
- DO reflect the student's achievement level using curriculum-based language (Levels 1-4).
- DO provide a clear next step.
- DO maintain a calm, professional tone aligned with Growing Success.
- Comment length: approx. ${charLimit} characters.

Student: ${name}
Grade: ${grade}
Subject: ${subject}
Pronouns: ${gender}
Notes from teacher: ${notes}

${levelDescription}
`;

  const aiComment = await callBackend(prompt, charLimit);
  commentBox.value = cleanComment(aiComment);
  outputSection.style.display = 'block';
}

async function callBackend(prompt, charLimit) {
  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature: 0.3 })
    });
    const data = await response.json();
    return data.comment || "⚠️ No response from backend.";
  } catch (err) {
    console.error("❌ Error contacting backend:", err);
    return "⚠️ Error contacting backend.";
  }
}

function cleanComment(text) {
  return text.replace(/^["']|["']$/g, "").trim();
}
