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

// === MAIN GENERATE FUNCTION ===
async function generateComment() {
  const name = document.getElementById('studentName').value;
  const gender = document.getElementById('gender').value;
  const grade = document.getElementById('grade').value;
  const subject = subjectSelect.value === 'Other'
    ? document.getElementById('customSubject').value
    : subjectSelect.value;
  const notes = document.getElementById('notes').value;
  const level = document.getElementById('achievementLevel').value;
  const longMode = longCommentCheckbox.checked;

  let charLimit = 400;
  if (longMode) {
    if (/learning/i.test(subject)) charLimit = 1400;
    else if (/math/i.test(subject)) charLimit = 800;
    else charLimit = 600;
  }

  let levelInstruction = "";
  if (level === "Level 1") {
    levelInstruction = "The student is working at Level 1. Emphasize emerging understanding, significant support needed, and early skill development.";
  } else if (level === "Level 2") {
    levelInstruction = "The student is working at Level 2. Describe developing understanding and growing consistency.";
  } else if (level === "Level 3") {
    levelInstruction = "The student is working at Level 3. Indicate solid understanding, meeting expectations, and demonstrating consistency.";
  } else if (level === "Level 4") {
    levelInstruction = "The student is working at Level 4. Highlight independence, mastery, and the ability to apply learning in new contexts.";
  }

  const prompt = `
You are writing a professional Ontario elementary report card comment for the subject of ${subject}.

Use the teacher notes provided and include these characteristics:
${levelInstruction}

❌ Do NOT mention test scores, percentages, or grades  
❌ Do NOT speak directly to the student  
❌ Do NOT use vague phrases like "strong student" or "great job"  
❌ Avoid repetitive language or praise-only statements

✅ Use a clear, professional tone  
✅ Describe learning behaviours, skills, and next steps  
✅ Tailor the language to the specified achievement level  
✅ Keep the comment around ${charLimit} characters max

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

// === COMMENT CLEANUP ===
function cleanComment(comment) {
  const bannedPhrases = [
    "keep up the good work",
    "well done",
    "great job",
    "shows potential",
    "end of comment",
    "this concludes the comment",
    "to support his growth",
    "to support her growth",
    "to support their growth"
  ];

  const lines = comment
    .split(/[.?!]\\s*/)
    .filter(Boolean)
    .map(line => line.trim())
    .filter(line => {
      const lower = line.toLowerCase();
      return (
        !bannedPhrases.some(p => lower.includes(p)) &&
        !/^(encouraging|continue|keep|aim|work)\\b/i.test(lower)
      );
    });

  if (!lines.length) return "⚠️ Cleaned comment too short.";
  const final = lines.join(". ");
  return final.endsWith(".") ? final : final + ".";
}

// === OTHER INTERACTIONS ===
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

function displaySavedComments(student) {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  const subjects = storage[student];
  let html = "";

  for (const [subject, comments] of Object.entries(subjects)) {
    html += `<h4>${subject}</h4><ul>`;
    comments.forEach(comment => {
      html += `<li>${comment}</li>`;
    });
    html += "</ul>";
  }

  savedOutput.innerHTML = html;
}

function displayTermHistory(terms) {
  if (!terms.length) {
    termHistoryOutput.innerHTML = "<h3>No past terms saved yet.</h3>";
    return;
  }

  let html = "<h3>📂 Past Terms</h3>";
  terms.forEach((term) => {
    html += `<h4>${term.timestamp}</h4><pre>${JSON.stringify(term.data, null, 2)}</pre>`;
  });
  termHistoryOutput.innerHTML = html;
}

subjectSelect.addEventListener("change", () => {
  customDiv.style.display = subjectSelect.value === "Other" ? "block" : "none";
});

document.getElementById("commentForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  await generateComment();
});
