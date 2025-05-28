const subjectSelect = document.getElementById('subject');
const customDiv = document.getElementById('customSubjectDiv');
const outputSection = document.getElementById('outputSection');
const commentBox = document.getElementById('generatedComment');
const approveBtn = document.getElementById('approveBtn');
const viewSavedBtn = document.getElementById('viewSavedBtn');
const savedSection = document.getElementById('savedCommentsSection');
const studentSelect = document.getElementById('studentSelect');
const savedOutput = document.getElementById('savedOutput');
const saveTermBtn = document.getElementById('saveTermBtn');
const resetBtn = document.getElementById('resetBtn');
const termHistoryOutput = document.getElementById('termHistoryOutput');
const longCommentCheckbox = document.getElementById('longComment');

const BACKEND_URL = "https://your-backend-url-here"; // Replace with your actual backend URL

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
  terms.forEach((term) => {
    html += `<h4>${term.timestamp}</h4><pre>${JSON.stringify(term.data, null, 2)}</pre>`;
  });
  termHistoryOutput.innerHTML = html;
}

async function mergeComments(student, subject) {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  const comments = storage[student][subject];

  const prompt = `You are a teacher writing a final Ontario report card comment. Merge these comments into one, grouped by subject, in a professional tone. Length: up to 800 characters.

${comments.join("\n")}`;

  let merged = await callBackend(prompt, 800);
  merged = merged.trim();

  const displayBox = document.getElementById(`final-${student}-${subject}`);
  const charCount = document.getElementById(`charCount-${student}-${subject}`);

  displayBox.innerText = merged;
  charCount.innerText = `${merged.length} characters`;
}

function copyMerged(student, subject) {
  const text = document.getElementById(`final-${student}-${subject}`).innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("📋 Merged comment copied to clipboard!");
  });
}

// === COMMENT GENERATOR ===
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

Do NOT include test scores or grades. Avoid praise. Focus on specific math skills (measurement, problem solving, etc.). Highlight strengths, needs, and next steps. End with a professional sentence. Limit: ${charLimit} characters.

Student: ${name}  
Pronouns: ${gender}  
Grade: ${grade}  
Subject: ${subject}  
Notes: ${notes}`;
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
Notes: ${notes}`;
  }

  try {
    const aiComment = await callBackend(prompt, charLimit);
    commentBox.value = cleanComment(aiComment);
    outputSection.style.display = 'block';
  } catch (error) {
    console.error("❌ Error generating comment:", error);
    alert("There was an error generating the comment. Please try again.");
  }
}

async function callBackend(prompt, charLimit) {
  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature: 0.3 })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "⚠️ No response from AI.";
  } catch (error) {
    console.error("❌ Backend error:", error);
    return "⚠️ Could not reach backend.";
  }
}

function cleanComment(text) {
  return text.replace(/end of comment.*$/i, "").trim();
}
