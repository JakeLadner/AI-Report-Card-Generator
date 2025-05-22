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

subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
});

regenerateBtn.addEventListener('click', async () => {
  const editedComment = commentBox.value;
  const prompt = `You are an Ontario teacher revising a report card comment. Tighten the language and remove any vague praise. Do not include marks, percentages, or direct address of the student. Keep tone professional and strengths-based. Limit to 400 characters:\n\n"${editedComment}"`;

  const newComment = await callBackend(prompt);
  commentBox.value = cleanComment(newComment.slice(0, 400));
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

async function mergeComments(student, subject) {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  const comments = storage[student][subject];

  let charLimit = 600;
  if (/math/i.test(subject)) charLimit = 800;
  if (/learning/i.test(subject)) charLimit = 1400;

  const prompt = `You are writing a final Ontario report card comment for ${subject}.

Merge the following comments into a single professional, strengths-based, and objective comment.

✔ No repetition  
✔ No marks, percentages, or test names  
✔ No direct address of the student  
✔ No phrases like “Keep up the good work” or “Well done”  
✔ Use full sentences, calm tone, and end with a summary  
✔ Limit to ${charLimit} characters

Student: ${student}  
Subject: ${subject}  
Comments:\n\n${comments.join("\n\n")}`;

  let merged = await callBackend(prompt, charLimit);
  merged = cleanComment(merged.trim().slice(0, charLimit));

  const displayBox = document.getElementById(`final-${student}-${subject}`);
  const charCount = document.getElementById(`charCount-${student}-${subject}`);

  displayBox.innerText = merged;
  charCount.innerText = `${merged.length} / ${charLimit} characters`;
}

function copyMerged(student, subject) {
  const text = document.getElementById(`final-${student}-${subject}`).innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("📋 Merged comment copied to clipboard!");
  });
}

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
You are writing a Math comment for an Ontario elementary report card.

✔ Use ONLY the teacher’s notes as input  
✔ DO NOT mention test scores, percentages, or evaluations  
✔ DO NOT speak directly to the student or use casual praise  
✔ Focus on strengths, skills, and measurable next steps  
✔ Tone must be objective, professional, and curriculum-aligned  
✔ End with a complete sentence  
✔ Limit to ${charLimit} characters

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
✔ DO NOT include any test scores, grades, or percentages  
✔ DO NOT address the student or use encouragement phrases  
✔ Focus on strengths, needs (if any), and next steps  
✔ Use professional, formal tone  
✔ End with a complete sentence  
✔ Limit to approximately ${charLimit} characters

Student: ${name}  
Pronouns: ${gender}  
Grade: ${grade}  
Subject: ${subject}  
Notes: ${notes}
`;
  }

  const aiComment = await callBackend(prompt, charLimit);
  commentBox.value = cleanComment(aiComment.slice(0, charLimit));
  outputSection.style.display = 'block';
}

async function callBackend(prompt, charLimit) {
  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        temperature: 0.3
      })
    });

    const data = await response.json();
    console.log("✅ Backend response:", data);
    return data.result || "⚠️ Backend returned no comment.";
  } catch (error) {
    console.error("❌ Error calling backend:", error);
    return "❌ Error contacting AI backend.";
  }
}

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
    "this concludes the comment"
  ];

  const lines = comment
    .split(/[.?!]\s*/)
    .filter(Boolean)
    .map(l => l.trim())
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
