// === ELEMENT SETUP ===
const subjectSelect = document.getElementById('subject');
const customDiv = document.getElementById('customSubjectDiv');
const outputSection = document.getElementById('outputSection');
const commentBox = document.getElementById('generatedComment');
const regenerateBtn = document.getElementById('regenerateBtn');
const approveBtn = document.getElementById('approveBtn');
const viewSavedBtn = document.getElementById('viewSavedBtn');
const savedSection = document.getElementById('savedCommentsSection');
const studentSelect = document.getElementById('studentSelect');
const savedOutput = document.getElementById('savedOutput');
const saveTermBtn = document.getElementById('saveTermBtn');
const resetBtn = document.getElementById('resetBtn');
const termHistoryOutput = document.getElementById('termHistoryOutput');
const longCommentCheckbox = document.getElementById('longComment');

const BACKEND_URL = "https://ba2c948e-a8cd-4883-963f-47c7669bd43b-00-1j7o8cnv42e8a.janeway.replit.dev";

// === EVENT LISTENERS ===
subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
});

regenerateBtn.addEventListener('click', async () => {
  const editedComment = commentBox.value;
  const prompt = `You are an Ontario teacher revising a report card comment. Tighten the language and remove vague or generic phrasing. Do not include marks, percentages, or direct address of the student. Do not refer to future grade levels. Keep tone professional and strengths-based. Limit to approximately 400 characters:\n\n"${editedComment}"`;

  const newComment = await callBackend(prompt);
  commentBox.value = cleanComment(newComment);
});
approveBtn.addEventListener('click', () => {
  const name = document.getElementById('studentName').value.trim();
  const subject = subjectSelect.value === 'Other'
    ? document.getElementById('customSubject').value.trim()
    : subjectSelect.value;
  const comment = commentBox.value.trim();

  if (!name || !subject || !comment) return alert("Missing data to save.");

  let storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  if (!storage[name]) storage[name] = {};
  if (!storage[name][subject]) storage[name][subject] = [];

  storage[name][subject].push(comment);
  localStorage.setItem("savedComments", JSON.stringify(storage));

  alert(`✅ Saved for ${name} under ${subject}`);
});

viewSavedBtn.addEventListener('click', () => {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  const terms = JSON.parse(localStorage.getItem("savedTerms") || "[]");

  savedSection.style.display = 'block';
  studentSelect.innerHTML = "";

  const students = Object.keys(storage);
  if (students.length === 0) {
    savedOutput.innerHTML = "<p>No saved comments found.</p>";
    return;
  }

  studentSelect.innerHTML = students.map(name => `<option value="${name}">${name}</option>`).join("");
  displaySavedComments(students[0]);
  displayTermHistory(terms);
});

studentSelect.addEventListener('change', () => {
  displaySavedComments(studentSelect.value);
});

saveTermBtn.addEventListener('click', () => {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  if (!Object.keys(storage).length) return alert("Nothing to save!");

  const terms = JSON.parse(localStorage.getItem("savedTerms") || "[]");
  const timestamp = new Date().toLocaleString();
  terms.push({ timestamp, data: storage });
  localStorage.setItem("savedTerms", JSON.stringify(terms));

  alert("💾 Term saved!");
});

resetBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to clear current term data?")) {
    localStorage.removeItem("savedComments");
    alert("🗑️ Data cleared.");
    location.reload();
  }
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

  let prompt = "";

  if (/math/i.test(subject)) {
    prompt = `
You are writing a professional Ontario elementary report card comment for MATH.

The teacher has provided notes. Use them to generate a comment that follows these strict rules:

❌ Do NOT mention test scores, percentages, grades, or assignments  
❌ Do NOT speak directly to the student (avoid “Mason should continue…”)  
❌ Do NOT use vague language like “understanding of angles”  
❌ Do NOT repeat the same word multiple times in a paragraph  
❌ Do NOT use motivational or praise phrases (e.g. “keep up the good work”)

✅ Focus on observable learning behaviours  
✅ Mention specific math skills (e.g. measurement, classification, problem-solving)  
✅ Use a clear next step  
✅ End with a professional full sentence  
✅ Limit to approximately ${charLimit} characters

Use this as an example of structure, tone, and clarity:  
"Mason consistently demonstrates the ability to accurately measure and classify angles up to 180 degrees. To support continued growth, he will focus on applying these skills in increasingly complex geometric problem-solving tasks."

Student: ${name}  
Pronouns: ${gender}  
Grade: ${grade}  
Subject: ${subject}  
Notes: ${notes}
`;
  } else {
    prompt = `
You are writing a subject-specific comment for an Ontario elementary report card.

✔ Use ONLY the teacher’s notes  
✔ DO NOT include grades, test names, or percentages  
✔ DO NOT address the student directly  
✔ DO NOT reference future grades  
✔ Focus on strengths, needs, and next steps  
✔ Keep it professional, calm, and clear  
✔ Limit to approximately ${charLimit} characters

Student: ${name}  
Pronouns: ${gender}  
Grade: ${grade}  
Subject: ${subject}  
Notes: ${notes}
`;
  }

  const aiComment = await callBackend(prompt, charLimit);
  commentBox.value = cleanComment(aiComment);
  outputSection.style.display = 'block';
}
// === BACKEND CALL ===
async function callBackend(prompt, charLimit) {
  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature: 0.3 })
    });

    const data = await response.json();
    return data.result || "⚠️ Backend returned no comment.";
  } catch (error) {
    console.error("❌ Error calling backend:", error);
    return "❌ Error contacting AI backend.";
  }
}

// === CLEANUP FILTERING ===
function cleanComment(comment) {
  const bannedPhrases = [
    "keep up the good work",
    "well done",
    "great job",
    "shows potential",
    "proficient",
    "effectively",
    "beyond 180",
    "real-world",
    "demonstrates proficiency",
    "end of comment",
    "this concludes the comment",
    "end of report card comment",
    "continuing to apply",
    "will support his growth",
    "will support her growth",
    "will support their growth",
    "to support learning",
    "in grade"
  ];

  const lines = comment
    .split(/[.?!]\s*/)
    .filter(Boolean)
    .map(line => line.trim())
    .filter(line => {
      const lower = line.toLowerCase();
      return (
        !bannedPhrases.some(p => lower.includes(p)) &&
        !/^(encouraging|continue|keep|aim|work)\b/i.test(lower)
      );
    });

  if (!lines.length) return "⚠️ Cleaned comment too short.";

  const final = lines.join(". ");
  return final.endsWith(".") ? final : final + ".";
}
