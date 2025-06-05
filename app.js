const subjectSelect = document.getElementById('subject');
const customDiv = document.getElementById('customSubjectDiv');
const outputSection = document.getElementById('outputSection');
const commentBox = document.getElementById('generatedComment');
const approveBtn = document.getElementById('approveBtn');
const viewSavedBtn = document.getElementById('viewSavedBtn');
const studentSelect = document.getElementById('studentSelect');
const savedOutput = document.getElementById('savedOutput');
const saveTermBtn = document.getElementById('saveTermBtn');
const resetBtn = document.getElementById('resetBtn');
const termHistoryOutput = document.getElementById('termHistoryOutput');
const longCommentCheckbox = document.getElementById('longComment');
const levelSelect = document.getElementById('level'); // Added Level dropdown

const BACKEND_URL = "https://your-backend-url.replit.app"; // Replace with your backend URL

subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
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
  const students = Object.keys(storage);

  if (students.length === 0) {
    savedOutput.innerHTML = "<p>No saved comments found.</p>";
    return;
  }

  studentSelect.innerHTML = students.map(name => `<option value="${name}">${name}</option>`).join("");
  displaySavedComments(students[0]);

  studentSelect.addEventListener('change', () => {
    displaySavedComments(studentSelect.value);
  });
});

function displaySavedComments(student) {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  const subjects = storage[student];
  let html = "";

  for (const [subject, comments] of Object.entries(subjects)) {
    html += `<h4>${subject}</h4><ul>`;
    comments.forEach(comment => {
      html += `<li>${comment}</li>`;
    });
    html += `</ul>`;
  }

  savedOutput.innerHTML = html;
}

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
  const level = levelSelect.value;

  let charLimit = 400;
  if (longMode) {
    if (/learning/i.test(subject)) charLimit = 1400;
    else if (/math/i.test(subject)) charLimit = 800;
    else charLimit = 600;
  }

  const prompt = `
You are an Ontario elementary report card comment generator.

Use the Ontario Achievement Chart and Growing Success guidelines:
- Focus on strengths, areas for improvement, and clear next steps.
- Reflect the selected achievement level: ${level} (Level 1-4).
- Do NOT mention marks, percentages, or grades.
- Do NOT speak directly to the student (no "you" or "your").
- Use asset-based language and a calm, professional tone.
- Approximately ${charLimit} characters.

Student: ${name}
Grade: ${grade}
Subject: ${subject}
Pronouns: ${gender}
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
  } catch (error) {
    console.error("Error:", error);
    alert("⚠️ Could not contact AI backend.");
  }
}
