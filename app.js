// The frontend talks to the Express API. For local use, run the backend on port 3000.
const API_URL = '/api/projects';

const form = document.getElementById('projectForm');
const rows = document.getElementById('projectRows');
const message = document.getElementById('message');
const count = document.getElementById('count');
const projectId = document.getElementById('projectId');
const formTitle = document.getElementById('formTitle');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));
}
function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || (result.errors || ['Request failed']).join(', '));
  return result;
}
async function loadProjects() {
  rows.innerHTML = '<tr><td colspan="5" class="empty">Loading projects…</td></tr>';
  try {
    const result = await apiRequest(API_URL);
    count.textContent = result.count;
    if (!result.data.length) {
      rows.innerHTML = '<tr><td colspan="5" class="empty">No projects yet. Add the first project using the form.</td></tr>';
      return;
    }
    rows.innerHTML = result.data.map(project => `
      <tr>
        <td>${project.id}</td>
        <td><span class="project-name">${escapeHtml(project.project_title)}</span>
            <span class="student-name">${escapeHtml(project.student_name)}</span></td>
        <td>${escapeHtml(project.category)}</td>
        <td><span class="status status-${statusClass(project.status)}">${escapeHtml(project.status)}</span></td>
        <td><div class="actions">
          <button class="secondary small-button" type="button" data-edit="${project.id}">Edit</button>
          <button class="danger small-button" type="button" data-delete="${project.id}">Delete</button>
        </div></td>
      </tr>`).join('');
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="5" class="empty">Cannot reach API. Start the backend first. ${escapeHtml(error.message)}</td></tr>`;
    count.textContent = '—';
  }
}
function resetForm() {
  form.reset();
  projectId.value = '';
  formTitle.textContent = 'Add a project';
  saveButton.textContent = 'Save project';
  cancelButton.classList.add('hidden');
  document.getElementById('status').value = 'In Progress';
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const payload = {
    project_title: document.getElementById('project_title').value.trim(),
    student_name: document.getElementById('student_name').value.trim(),
    category: document.getElementById('category').value,
    description: document.getElementById('description').value.trim(),
    status: document.getElementById('status').value
  };
  const id = projectId.value;
  try {
    const result = await apiRequest(id ? `${API_URL}/${id}` : API_URL, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    showMessage(result.message);
    resetForm();
    await loadProjects();
  } catch (error) { showMessage(error.message, true); }
});
rows.addEventListener('click', async event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) {
    try {
      const result = await apiRequest(`${API_URL}/${editId}`);
      const p = result.data;
      projectId.value = p.id;
      document.getElementById('project_title').value = p.project_title;
      document.getElementById('student_name').value = p.student_name;
      document.getElementById('category').value = p.category;
      document.getElementById('description').value = p.description;
      document.getElementById('status').value = p.status;
      formTitle.textContent = `Edit project #${p.id}`;
      saveButton.textContent = 'Save changes';
      cancelButton.classList.remove('hidden');
      document.getElementById('project_title').focus();
      showMessage(`Project #${p.id} loaded for editing.`);
    } catch (error) { showMessage(error.message, true); }
  }
  if (deleteId) {
    const confirmed = window.confirm(`Delete project #${deleteId}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const result = await apiRequest(`${API_URL}/${deleteId}`, { method: 'DELETE' });
      showMessage(result.message);
      if (projectId.value === deleteId) resetForm();
      await loadProjects();
    } catch (error) { showMessage(error.message, true); }
  }
});
cancelButton.addEventListener('click', resetForm);
document.getElementById('refreshButton').addEventListener('click', loadProjects);
loadProjects();