const subjectSelect = document.getElementById('subject');
const customDiv = document.getElementById('customSubjectDiv');

subjectSelect.addEventListener('change', () => {
  if (subjectSelect.value === 'Other') {
    customDiv.style.display = 'block';
  } else {
    customDiv.style.display = 'none';
  }
});

document.getElementById('commentForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('studentName').value;
  const gender = document.getElementById('gender').value;
  const subject = subjectSelect.value === 'Other'
    ? document.getElementById('customSubject').value
    : subjectSelect.value;
  const notes = document.getElementById('notes').value;

  const mockResponse = `📘 Example Comment for ${name}:

${name} demonstrates strong engagement in ${subject}. ${gender} shows enthusiasm, participates actively, and reflects a solid understanding of concepts.`;

  document.getElementById('output').innerText = mockResponse;
});
