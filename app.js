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
  const prompt = `You are a teacher revising a report card comment. Improve this text using a calm, professional, growth-oriented tone (Ontario curriculum style). Limit it to 400 characters. End with a complete sentence:\n\n"${editedComment}"`;

  const newComment = await callBackend(prompt);
  commentBox.value = newComment.slice(0, 400);
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

  const prompt = `You are a teacher writing a report card. Merge the following comments into one professional and growth-oriented summary for ${student}'s ${subject}. Use Ontario curriculum tone. Limit to 400 characters. End with a complete sentence:\n\n${comments.join("\n")}`;

  let merged = await callBackend(prompt);
  merged = merged.trim().slice(0, 400);

  const displayBox = document.getElementById(`final-${student}-${subject}`);
  const charCount = document.getElementById(`charCount-${student}-${subject}`);

  displayBox.innerText = merged;
  charCount.innerText = `${merged.length} / 400 characters`;
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

  let prompt = "";

  if (subject.toLowerCase().includes("math")) {
    prompt = `
You are a teacher writing a **math report card comment** following Ontario’s *Growing Success* and the 2020 Math Curriculum.

Write a professional, accurate, calm comment suitable for a report card.

✔ Base your comment only on the evidence provided in the notes  
✔ Use a formal, strengths-based tone without direct-to-student language  
✔ Focus on knowledge, skill development, and next steps related to the strand  
✔ Avoid filler phrases like “Keep up the good work” or “strong work habits” unless mentioned  
✔ Do not assume growth areas unless stated  
✔ End with a full, clean sentence  
✔ Keep the comment under 400 characters

Student: ${name}  
Pronouns: ${gender}  
Grade: ${grade}  
Subject: ${subject}  
Notes: ${notes}
`;
  } else {
    prompt = `
You are a teacher writing a report card comment in a professional and strengths-based tone aligned to the Ontario curriculum. Be specific, honest, and growth-oriented.

Focus on:
1. Strengths (work habits, collaboration, thinking, communication, etc.)
2. Areas for growth with examples
3. A next step
4. Calm, clear closing — no fluff

Avoid vague or overly enthusiastic language. Keep within 400 characters. End with a complete, polished sentence.

Student: ${name}  
Pronouns: ${gender}  
Grade: ${grade}  
Subject: ${subject}  
Notes: ${notes}
`;
  }

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
