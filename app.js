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
  const prompt = `You are a teacher revising a report card comment. Improve this text using a calm, professional, growth-oriented tone (Ontario Learning Skills style). Limit it to 400 characters:\n\n"${editedComment}"`;

  const newComment = await callOpenAI(prompt);
  commentBox.value = newComment.slice(0, 400);
});

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

  const aiComment = await callOpenAI(prompt);
  commentBox.value = aiComment.slice(0, 400);
  outputSection.style.display = 'block';
}

async function callOpenAI(prompt) {
  const apiKey = "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";
  const orgId = "org-WytD3fknsOU7jjP1gLdkqBBd";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Organization": orgId
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("🔍 OpenAI response:", data);
    return data.choices?.[0]?.message?.content || "⚠️ OpenAI returned no choices.";
  } catch (err) {
    console.error("❌ OpenAI API call failed:", err);
    return "❌ Error calling OpenAI API.";
  }
}
