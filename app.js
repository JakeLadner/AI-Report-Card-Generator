const subjectSelect = document.getElementById('subject');
const customDiv = document.getElementById('customSubjectDiv');
const outputSection = document.getElementById('outputSection');
const commentBox = document.getElementById('generatedComment');
const viewSavedBtn = document.getElementById('viewSavedBtn');
const studentSelect = document.getElementById('studentSelect');
const savedOutput = document.getElementById('savedOutput');
const BACKEND_URL = "https://your-backend-url.replit.app"; // <-- Replace with your backend URL

subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // This prevents the form from refreshing the page
  await generateComment(); // Calls the comment generator
});

async function generateComment() {
  const name = document.getElementById('studentName').value;
  const gender = document.getElementById('gender').value;
  const grade = document.getElementById('grade').value;
  const subject = subjectSelect.value === 'Other'
    ? document.getElementById('customSubject').value
    : subjectSelect.value;
  const notes = document.getElementById('notes').value;
  const longMode = document.getElementById('longCommentCheckbox')?.checked;

  let charLimit = 400;
  if (longMode) {
    if (/learning/i.test(subject)) charLimit = 1400;
    else if (/math/i.test(subject)) charLimit = 800;
    else charLimit = 600;
  }

  const prompt = `
You are writing a professional Ontario elementary report card comment.

Rules:
- Do NOT use test scores or grades
- Do NOT speak directly to the student
- Focus on observable learning behaviour
- Provide strengths, next steps, and end with a full sentence
- Max ${charLimit} characters

Student: ${name}
Gender: ${gender}
Grade: ${grade}
Subject: ${subject}
Notes: ${notes}
`;

  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature: 0.4 })
    });

    const data = await response.json();
    const comment = data?.result || "⚠️ No response from AI";
    commentBox.value = comment.slice(0, charLimit);
    outputSection.style.display = 'block';
  } catch (err) {
    console.error("Error:", err);
    alert("⚠️ Could not contact AI backend.");
  }
}
