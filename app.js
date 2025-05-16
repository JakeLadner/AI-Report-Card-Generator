const subjectSelect = document.getElementById('subject');
const customDiv = document.getElementById('customSubjectDiv');
const outputSection = document.getElementById('outputSection');
const commentBox = document.getElementById('generatedComment');
const regenerateBtn = document.getElementById('regenerateBtn');

// ✅ This is your Replit backend URL
const BACKEND_URL = "https://ba2c948e-a8cd-4883-963f-47c7669bd43b-00-1j7o8cnv42e8a.janeway.replit.dev";

subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
});

regenerateBtn.addEventListener('click', async () => {
  const editedComment = commentBox.value;
  const prompt = `You are a teacher revising a report card comment. Improve this text using a calm, professional, growth-oriented tone (Ontario Learning Skills style). Limit it to 400 characters:\n\n"${editedComment}"`;

  const newComment = await callBackend(prompt);
  commentBox.value = newComment.slice(0, 400);
});

async function generateComment() {
  const name = document.getElementById('studentName').value;
  const gender = document.getElementById('gender').value;
  const grade = document.getElementById('grade').value;
  const subject = subjectSelect.value === 'Other'
    ? document.getElementById('customSubject').value
    : subjectSelect.value;
  const notes = document.getElementById('notes').value;

  const prompt = `
You are a teacher writing a professional report card comment for the Ontario Learning Skills section.

Use the tone and structure from these examples: calm, strengths-based, honest, and growth-oriented.

Avoid casual or overly enthusiastic language. Do not use overly positive phrases like “amazing” or “wonderful.” Do not speak directly to the student.

Structure:
1. Describe strengths (work habits, collaboration, initiative, independence, etc.)
2. Describe areas of growth with examples
3. Offer a next step and note future direction
4. End with a reflective, supportive closing

Keep it within 400 characters. Focus on clarity and professionalism.

Student: ${name}  
Pronouns: ${gender}  
Grade: ${grade}  
Subject: ${subject}  
Notes: ${notes}
`;

  const aiComment = await callBackend(prompt);
  commentBox.value = aiComment.slice(0, 400);
  outputSection.style.display = 'block';
}

async function callBackend(prompt) {
  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    console.log("✅ Backend response:", data);
    return data.result || "⚠️ Backend returned no comment.";
  } catch (error) {
    console.error("❌ Error calling backend:", error);
    return "❌ Error contacting AI backend.";
  }
}
