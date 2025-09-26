(function () {
    const STORAGE_KEY = 'memovault-notes';

    const addNoteBtn = document.getElementById('addNoteBtn');
    const addNoteModal = document.getElementById('addNoteModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const noteTitle = document.getElementById('modalNoteTitle');
    const noteContent = document.getElementById('modalNoteContent');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const notesContainer = document.getElementById('notesContainer');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');

    const trashModal = document.getElementById('confirmDeleteModal');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    let selectedModalTag = null;
    let noteToDelete = null;
    let editingNoteId = null;

    addNoteBtn.addEventListener('click', () => {
        editingNoteId = null;
        selectedModalTag = null;
        clearForm();
        showModal();
    });

    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === addNoteModal) closeModal();
    });

    document.querySelectorAll('.tags-container button').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tags-container button').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            selectedModalTag = btn.dataset.tag;
        });
    });

    saveNoteBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();

        if (!title || !content) {
            alert('Please enter both title and content');
            return;
        }

        const tag = selectedModalTag || 'ideas';

        if (editingNoteId) {
            updateNote(editingNoteId, title, content, tag);
        } else {
            const note = {
                id: Date.now().toString(),
                title,
                content,
                tag: tag.charAt(0).toUpperCase() + tag.slice(1),
                date: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
            };
            addNoteToDOM(note);
            saveNoteToStorage(note);
        }

        toggleEmptyState();
        clearForm();
        closeModal();
        editingNoteId = null;
    });

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        Array.from(document.querySelectorAll('.note-card')).forEach((card) => {
            const titleEl = card.querySelector('.note-title');
            const contentEl = card.querySelector('.note-content');
            const title = titleEl ? titleEl.innerText.toLowerCase() : '';
            const content = contentEl ? contentEl.innerText.toLowerCase() : '';
            card.style.display = title.includes(q) || content.includes(q) ? 'flex' : 'none';
        });
        toggleEmptyState();
    });

    filterSelect.addEventListener('change', () => {
        const selectedTag = String(filterSelect.value).toLowerCase();
        Array.from(document.querySelectorAll('.note-card')).forEach((card) => {
            const tagEl = card.querySelector('.note-tag');
            const tagText = tagEl ? tagEl.textContent.toLowerCase() : '';
            card.style.display = selectedTag === 'all notes' || tagText.includes(selectedTag) ? 'flex' : 'none';
        });
        toggleEmptyState();
    });

    cancelBtn.addEventListener('click', () => {
        trashModal.classList.remove('active');
        setTimeout(() => {
            trashModal.style.display = 'none';
            noteToDelete = null;
        }, 300);
    });

    confirmBtn.addEventListener('click', () => {
        if (noteToDelete) {
            noteToDelete.element.remove();
            deleteNoteFromStorage(noteToDelete.id);
            noteToDelete = null;
        }
        toggleEmptyState();
        trashModal.classList.remove('active');
        setTimeout(() => (trashModal.style.display = 'none'), 300);
    });

    function addNoteToDOM(note) {
        const card = document.createElement('div');
        card.classList.add('note-card', 'fade-in');
        card.dataset.id = note.id;

        card.innerHTML = `
          <div class="note-header">
            <h4 class="note-title">${escapeHtml(note.title)}</h4>
            <div class="card-button">
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <p class="note-content">${escapeHtml(note.content)}</p>
          <div class="note-footer">
            <span class="note-tag tag-${note.tag.toLowerCase()}">${getTagIcon(note.tag.toLowerCase())} ${note.tag}</span>
            <span class="note-date">${note.date}</span>
          </div>
        `;

        card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(note));
        card.querySelector('.delete-btn').addEventListener('click', () => {
            noteToDelete = { element: card, id: card.dataset.id };
            trashModal.style.display = 'flex';
            setTimeout(() => trashModal.classList.add('active'), 10);
        });

        notesContainer.appendChild(card);
    }

    function getTagIcon(tag) {
        switch (tag) {
            case 'ideas': return '<i class="fas fa-lightbulb"></i>';
            case 'work': return '<i class="fas fa-briefcase"></i>';
            case 'personal': return '<i class="fas fa-user"></i>';
            case 'reminders': return '<i class="fas fa-bell"></i>';
            default: return '';
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function closeModal() {
        addNoteModal.classList.remove('active');
        setTimeout(() => (addNoteModal.style.display = 'none'), 300);
    }

    function clearForm() {
        noteTitle.value = '';
        noteContent.value = '';
        selectedModalTag = null;
        document.querySelectorAll('.tags-container button').forEach(b => b.classList.remove('active'));
        document.querySelector('#addNoteModal .modal-title h3').textContent = 'New Note';
        saveNoteBtn.textContent = 'Save Note';
    }

    function toggleEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const visibleNotes = Array.from(document.querySelectorAll('.note-card')).filter((n) => n.style.display !== 'none');
        emptyState.style.display = visibleNotes.length === 0 ? 'flex' : 'none';
    }

    function saveNoteToStorage(note) {
        const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        notes.push(note);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    function loadNotes() {
        notesContainer.innerHTML = '';
        const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        notes.forEach((note) => addNoteToDOM(note));
        toggleEmptyState();
    }

    function deleteNoteFromStorage(id) {
        const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const filtered = notes.filter((n) => n.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }

    function openEditModal(note) {
        editingNoteId = note.id;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        selectedModalTag = note.tag.toLowerCase();

        const modalTitle = document.querySelector('#addNoteModal .modal-title h3');
        modalTitle.textContent = 'Edit Note';
        document.querySelectorAll('.tags-container button').forEach(b => {
            b.classList.remove('active');
            if (b.dataset.tag === selectedModalTag) b.classList.add('active');
        });
        saveNoteBtn.textContent = "Update Note";
        showModal();
    }

    function updateNote(id, title, content, tag) {
        const card = notesContainer.querySelector(`[data-id="${id}"]`);
        if (card) {
            card.querySelector('.note-title').textContent = title;
            card.querySelector('.note-content').textContent = content;
            const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1);
            const tagEl = card.querySelector('.note-tag');
            tagEl.className = `note-tag tag-${tag.toLowerCase()}`;
            tagEl.innerHTML = `${getTagIcon(tag.toLowerCase())} ${formattedTag}`;
        }
        let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1);
        notes = notes.map(note => note.id === id ? { ...note, title, content, tag: formattedTag } : note);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    function showModal() {
        addNoteModal.style.display = 'flex';
        setTimeout(() => addNoteModal.classList.add('active'), 10);
    }

    document.addEventListener('DOMContentLoaded', loadNotes);
})();
