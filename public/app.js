document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api';
  
  // DOM Elements
  const notesList = document.getElementById('notesList');
  const noteForm = document.querySelector('.form-container');
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const noteIdInput = document.getElementById('noteId');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  
  // Load all notes
  const loadNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/notes`);
      const notes = await response.json();
      
      notesList.innerHTML = '';
      
      if (notes.length === 0) {
        notesList.innerHTML = '<p>No notes found. Create your first note!</p>';
        return;
      }
      
      notes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesList.appendChild(noteElement);
      });
    } catch (error) {
      console.error('Error loading notes:', error);
      alert('Failed to load notes. Please try again.');
    }
  };
  
  // Create note element
  const createNoteElement = (note) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-card';
    
    const date = new Date(note.updatedAt);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    noteDiv.innerHTML = `
      <h3 class="note-title">${note.title}</h3>
      <p class="note-date">Last updated: ${formattedDate}</p>
      <p class="note-content">${note.content}</p>
      <div class="note-actions">
        <button class="edit-btn" data-id="${note.id}">Edit</button>
        <button class="delete-btn" data-id="${note.id}">Delete</button>
      </div>
    `;
    
    // Add event listeners
    const editBtn = noteDiv.querySelector('.edit-btn');
    const deleteBtn = noteDiv.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => editNote(note));
    deleteBtn.addEventListener('click', () => deleteNote(note.id));
    
    return noteDiv;
  };
  
  // Save note (create or update)
  const saveNote = async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
      alert('Please enter both title and content');
      return;
    }
    
    const noteId = noteIdInput.value;
    
    try {
      let response;
      
      if (noteId) {
        // Update existing note
        response = await fetch(`${API_URL}/notes/${noteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, content }),
        });
      } else {
        // Create new note
        response = await fetch(`${API_URL}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, content }),
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save note');
      }
      
      resetForm();
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };
  
  // Edit note
  const editNote = (note) => {
    noteIdInput.value = note.id;
    titleInput.value = note.title;
    contentInput.value = note.content;
    saveBtn.textContent = 'Update Note';
    cancelBtn.style.display = 'block';
    
    // Scroll to form
    noteForm.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Delete note
  const deleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      loadNotes();
      
      // If we're editing the note that was just deleted, reset the form
      if (noteIdInput.value == id) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };
  
  // Reset form
  const resetForm = () => {
    noteIdInput.value = '';
    titleInput.value = '';
    contentInput.value = '';
    saveBtn.textContent = 'Save Note';
    cancelBtn.style.display = 'none';
  };
  
  // Event listeners
  saveBtn.addEventListener('click', saveNote);
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });
  
  // Initial load
  loadNotes();
});