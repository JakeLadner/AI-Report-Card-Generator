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

subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
});

regenerateBtn.addEventListener('click', async () => {
  const editedComment = commentBox.value;
  const regenPrompt = `You are a teacher revising a report card comment for a student. Please improve and polish this text while keeping a professional, strengths-based tone:\n\n"${editedComment}"`;

  const newComment = await fakeOpenAICall(regenPrompt);
  commentBox.value = newComment;
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
  console.log("SavedComments:", storage);
});

viewSavedBtn.addEventListener('click', () => {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  savedSection.style.display = 'block';
  studentSelect.innerHTML = "";

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
    html += `</ul><button onclick="mergeComments('${student}', '${subject}')">🧠 Merge Comments</button>`;
    html += `<div id="merged-${student}-${subject}" style="margin-top: 10px; padding: 10px; background: #f0f0f0;"></div>`;
  }

  savedOutput.innerHTML = html;
}

async function mergeComments(student, subject) {
  const storage = JSON.parse(localStorage.getItem("savedComments") || "{}");
  const comments = storage[student][subject];

  const prompt = `You are a teacher writing a report card. Please merge the following comments into one cohesive, professional, and strengths-based comment for ${student}'s ${subject} progress:\n\n${comments.join("\n")}`;

  const merged = await fakeOpenAICall(prompt);

  const resultBox = document.getElementById(`merged-${student}-${subject}`);
  resultBox.innerText = merged;
}

async function generateComment() {
  const name = document.getElementById('studentName').value;
  const gender = document.getElementById('gender').value;
  const grade = document.getElementById('grade').value;
  const subject = subjectSelect.value === 'Other' 
    ? document.getElementById('customSubject').value 
    : subjectSelect.value;
  const notes = document.getElementById('notes').value;

  const prompt = `You are a teacher writing a ${grade} report card comment in a professional and strengths-based tone. Use Ontario Curriculum language. The student's name is ${name}. Use '${gender.toLowerCase()}' pronouns. The subject is ${subject}. Based on these notes, write a 2–3 sentence comment: ${notes}`;

  const aiComment = await fakeOpenAICall(prompt);
  commentBox.value = aiComment;
  outputSection.style.display = 'block';
}

async function fakeOpenAICall(prompt) {
  console.log("Prompt sent to AI:", prompt);
  return `This is a sample merged comment based on your prompt.`;
}
