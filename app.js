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

subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
});

regenerateBtn.addEventListener('click', async () => {
  const editedComment = commentBox.value;
  const regenPrompt = `You are a teacher revising a report card comment. Improve this text using a calm, professional, growth-oriented tone (Ontario Learning Skills style). Limit it to 400 characters:\n\n"${editedComment}"`;

  const newComment = await fakeOpenAICall(regenPrompt);
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
  terms.forEach((term, i) => {
    html += `<h4>${term.timestamp}</h4><pre>${JSON.stringify(term.data, null, 2)}</pre>`;
  });
  termHistoryOutput.innerHTML = html;
}

async function mergeComments(student, subject) {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  const comments = storage[student][subject];

  const prompt = `You are a teacher writing a report card. Merge the following comments into one professional and growth-oriented summary for ${student}'s ${subject}. Use Ontario Learning Skills tone. Limit to 400 characters:\n\n${comments.join("\n")}`;

  let merged = await fakeOpenAICall(prompt);
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

  const aiComment = await fakeOpenAICall(prompt);
  commentBox.value = aiComment.slice(0, 400);
  outputSection.style.display = 'block';
}

async function fakeOpenAICall(prompt) {
  console.log("Prompt sent to AI:", prompt);
  return `This is a sample comment generated based on your Learning Skills prompt. It is trimmed for style and length to reflect professional Ontario report card tone.`;
}
