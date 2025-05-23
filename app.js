// ---[ Setup and Element References ]---
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

// ---[ Event Handlers ]---
subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
});

regenerateBtn.addEventListener('click', async () => {
  const editedComment = commentBox.value;
  const prompt = `You are an Ontario teacher revising a report card comment. Tighten the language and remove vague or generic phrasing. Do not include marks, percentages, or direct address of the student. Keep tone professional and strengths-based. Limit to approximately 400 characters:\n\n"${editedComment}"`;

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

// ---[ Comment Display ]---
function displaySavedComments(student) {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  const subjects = storage[student];
  let html = "";

  for (const [subject, comments] of Object.entries(subjects)) {
    html += `<h4>${subject}</h4><ul>`;
    comments.forEach(comment => {
      html += `<li>${comment}</li>`;
    });
    html += `</ul>
      <button onclick="mergeComments('${student}', '${subject}')">🧠 Merge Comments</button>
      <div id="merged-${student}-${subject}" style="margin-top:10px; padding:10px; background:#eef;">
        <strong>Final Comment for ${subject}:</strong><br/>
        <div id="final-${student}-${subject}"></div>
        <div id="charCount-${student}-${subject}" style="font-size: 0.8em; color: gray;"></div>
        <button onclick="copyMerged('${student}', '${subject}')">📋 Copy to Clipboard</button>
      </div>`;
  }

  savedOutput.innerHTML = html;
}

function displayTermHistory(terms) {
  if (!terms.length) {
    termHistoryOutput.innerHTML = "<h3>No past terms saved yet.</h3>";
    return;
  }

  let html = "<h3>📂 Past Terms</h3>";
  terms.forEach(term => {
    html += `<h4>${term.timestamp}</h4><pre>${JSON.stringify(term.data, null, 2)}</pre>`;
  });
  termHistoryOutput.innerHTML = html;
}

// ---[ AI Comment Generation ]---
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

  const prompt = `
You are writing an Ontario elementary report card comment.

✔ Use only the teacher’s notes  
✔ Do NOT include marks, grades, test names  
✔ Do NOT speak to the student directly  
✔ Focus on strengths, needs, and next steps  
✔ End with a full sentence  
✔ Limit to approximately ${charLimit} characters

Student: ${name}  
Pronouns: ${gender}  
Grade: ${grade}  
Subject: ${subject}  
Notes: ${notes}
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
    return data.result || "⚠️ Backend returned no comment.";
  } catch (error) {
    console.error("❌ Error calling backend:", error);
    return "❌ Error contacting AI backend.";
  }
}

// ---[ Final Cleanup Filter ]---
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
    "to support learning"
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
