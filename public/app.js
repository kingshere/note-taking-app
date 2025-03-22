document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api';
  
  // DOM Elements
  const noteForm = document.getElementById('note-form');
  const notesList = document.getElementById('notesList');
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const categorySelect = document.getElementById('category');
  const categoryFilter = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('searchInput');
  const noteIdInput = document.getElementById('noteId');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const formMode = document.getElementById('form-mode');
  const notesCount = document.getElementById('notesCount');
  const newCategoryInput = document.getElementById('newCategory');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  
  let allNotes = [];
  let editor = null;
  
  // Initialize TinyMCE
  const initEditor = () => {
    tinymce.init({
      selector: '#content',
      height: 300,
      menubar: false,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | formatselect | ' +
        'bold italic backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | help',
      content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
      setup: function(ed) {
        editor = ed;
      }
    });
  };
  
  // Initialize the editor
  initEditor();
  
  // Load all notes
  const loadNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/notes`);
      allNotes = await response.json();
      
      updateNotesDisplay();
    } catch (error) {
      console.error('Error loading notes:', error);
      showToast('Failed to load notes. Please try again.', 'error');
    }
  };
  
  // Update notes display based on filters
  const updateNotesDisplay = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryId = categoryFilter.value;
    
    let filteredNotes = [...allNotes];
    
    // Apply category filter
    if (categoryId) {
      filteredNotes = filteredNotes.filter(note => 
        note.categoryId === parseInt(categoryId)
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        note.content.toLowerCase().includes(searchTerm)
      );
    }
    
    // Update notes count
    notesCount.textContent = filteredNotes.length;
    
    // Render notes
    notesList.innerHTML = '';
    
    if (filteredNotes.length === 0) {
      notesList.innerHTML = `
        <div class="empty-notes">
          <i class="fas fa-sticky-note"></i>
          <p>No notes found. ${searchTerm || categoryId ? 'Try changing your filters.' : 'Create your first note!'}</p>
        </div>
      `;
      return;
    }
    
    filteredNotes.forEach(note => {
      const noteElement = createNoteElement(note);
      notesList.appendChild(noteElement);
    });
  };
  
  // Create note element
  const createNoteElement = (note) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-card';
    noteDiv.classList.add('new-note');
    
    const date = new Date(note.updatedAt);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    // Create a temporary div to strip HTML tags for preview
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    noteDiv.innerHTML = `
      <div class="note-header">
        <h3 class="note-title">${note.title}</h3>
        ${note.category ? `<span class="note-category">${note.category.name}</span>` : ''}
      </div>
      <p class="note-content">${formatContent(textContent)}</p>
      <div class="note-footer">
        <span class="note-date">Last updated: ${formattedDate}</span>
        <div class="note-actions">
          <button class="edit-btn" data-id="${note.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="delete-btn" data-id="${note.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
          <button class="view-btn" data-id="${note.id}">
            <i class="fas fa-eye"></i> View
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    const editBtn = noteDiv.querySelector('.edit-btn');
    const deleteBtn = noteDiv.querySelector('.delete-btn');
    const viewBtn = noteDiv.querySelector('.view-btn');
    
    editBtn.addEventListener('click', () => editNote(note));
    deleteBtn.addEventListener('click', () => deleteNote(note.id));
    viewBtn.addEventListener('click', () => viewNote(note));
    
    return noteDiv;
  };
  
  // View note in a modal
  const viewNote = (note) => {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    modalContainer.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${note.title}</h2>
          ${note.category ? `<span class="note-category">${note.category.name}</span>` : ''}
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="note-full-content">${note.content}</div>
        </div>
        <div class="modal-footer">
          <button class="edit-modal-btn primary-btn">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="close-modal-btn secondary-btn">
            Close
          </button>
        </div>
      </div>
    `;
    
    // Add to body
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    const closeButtons = modalContainer.querySelectorAll('.close-modal, .close-modal-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
      });
    });
    
    // Edit button
    const editBtn = modalContainer.querySelector('.edit-modal-btn');
    editBtn.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      editNote(note);
    });
  };
  
  // Format content (truncate if too long)
  const formatContent = (content) => {
    if (content.length > 150) {
      return content.substring(0, 150) + '...';
    }
    return content;
  };
  
  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const categories = await response.json();
      
      // Clear existing options except the first one
      categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
      categoryFilter.innerHTML = '<option value="">All Categories</option>';
      
      categories.forEach(category => {
        // Add to category select
        const selectOption = document.createElement('option');
        selectOption.value = category.id;
        selectOption.textContent = category.name;
        categorySelect.appendChild(selectOption);
        
        // Add to category filter
        const filterOption = document.createElement('option');
        filterOption.value = category.id;
        filterOption.textContent = category.name;
        categoryFilter.appendChild(filterOption);
      });
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Failed to load categories. Please try again.', 'error');
    }
  };
  
  // Add new category
  const addCategory = async () => {
    const name = newCategoryInput.value.trim();
    
    if (!name) {
      showToast('Please enter a category name', 'error');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add category');
      }
      
      newCategoryInput.value = '';
      loadCategories();
      showToast('Category added successfully', 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      showToast(error.message, 'error');
    }
  };
  
  // Save note (create or update)
  const saveNote = async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    // Get content from TinyMCE
    const content = editor.getContent();
    const categoryId = categorySelect.value;
    
    if (!title || !content) {
      showToast('Please enter both title and content', 'error');
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
          body: JSON.stringify({ 
            title, 
            content,
            categoryId: categoryId || null
          }),
        });
      } else {
        // Create new note
        response = await fetch(`${API_URL}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            title, 
            content,
            categoryId: categoryId || null
          }),
        });
      }
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save note');
      }
      
      resetForm();
      loadNotes();
      showToast(`Note ${noteId ? 'updated' : 'created'} successfully`, 'success');
    } catch (error) {
      console.error('Error saving note:', error);
      showToast(error.message, 'error');
    }
  };
  
  // Edit note
  const editNote = (note) => {
    noteIdInput.value = note.id;
    titleInput.value = note.title;
    
    // Set content in TinyMCE
    editor.setContent(note.content);
    
    if (note.categoryId) {
      categorySelect.value = note.categoryId;
    } else {
      categorySelect.value = '';
    }
    
    formMode.textContent = 'Edit';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Note';
    cancelBtn.style.display = 'block';
    
    // Scroll to form
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
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
      
      showToast('Note deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Failed to delete note. Please try again.', 'error');
    }
  };
  
  // Reset form
  const resetForm = () => {
    noteForm.reset();
    noteIdInput.value = '';
    
    // Reset TinyMCE content
    editor.setContent('');
    
    formMode.textContent = 'Create New';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Note';
    cancelBtn.style.display = 'none';
  };
  
  // Show toast notification
  const showToast = (message, type = 'info') => {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
      
      // Add toast container styles
      const style = document.createElement('style');
      style.textContent = `
        .toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        
        .toast {
          padding: 12px 20px;
          margin-bottom: 10px;
          border-radius: 4px;
          color: white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          animation: slideIn 0.3s ease-out forwards;
        }
        
        .toast i {
          margin-right: 10px;
        }
        
        .toast-success {
          background-color: #4CAF50;
        }
        
        .toast-error {
          background-color: #f44336;
        }
        
        .toast-info {
          background-color: #2196F3;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon;
    switch (type) {
      case 'success':
        icon = 'fas fa-check-circle';
        break;
      case 'error':
        icon = 'fas fa-exclamation-circle';
        break;
      default:
        icon = 'fas fa-info-circle';
    }
    
    toast.innerHTML = `<i class="${icon}"></i> ${message}`;
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, 3000);
  };
  
  // Event listeners
  noteForm.addEventListener('submit', saveNote);
  cancelBtn.addEventListener('click', resetForm);
  addCategoryBtn.addEventListener('click', addCategory);
  searchInput.addEventListener('input', updateNotesDisplay);
  categoryFilter.addEventListener('change', updateNotesDisplay);
  
  // Initial load
  loadCategories();
  loadNotes();
});