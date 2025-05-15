const subjectSelect = document.getElementById('subject');
const customDiv = document.getElementById('customSubjectDiv');
const outputSection = document.getElementById('outputSection');
const commentBox = document.getElementById('generatedComment');
const regenerateBtn = document.getElementById('regenerateBtn');

subjectSelect.addEventListener('change', () => {
  customDiv.style.display = subjectSelect.value === 'Other' ? 'block' : 'none';
});

document.getElementById('commentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  await generateComment();
});

regenerateBtn.addEventListener('click', async () => {
  const editedComment = commentBox.value;
  const regenPrompt = `You are a teacher revising a report card comment for a student. Please improve and polish this text while keeping a professional, strengths-based tone:

"${editedComment}"`;
  
  const newComment = await fakeOpenAICall(regenPrompt);
  commentBox.value = newComment;
});

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
  // Placeholder for OpenAI — replace with API call in future
  console.log("Prompt sent to AI:", prompt);
  return `This is a sample generated comment based on your prompt.`;
}
