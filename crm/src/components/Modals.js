import { ref, remove } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { db } from '../services/firebase.js';

export class Modals {
    constructor(crmApp) {
      this.userModal = document.getElementById('userModal');
      this.deleteModal = document.getElementById('deleteConfirmationModal');
      this.contactForm = document.getElementById('contactForm');
      this.closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
      this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
      this.noteModal = document.getElementById('noteModal');
      this.closeNoteModalBtn = document.getElementById('closeNoteModal');
      this.viewNotesModal = document.getElementById('viewNotesModal');
      this.closeViewNotesBtn = document.getElementById('closeViewNotesBtn');
      this.closeViewNotesModalBtn = document.getElementById('closeViewNotesModal');
      this.crmApp = crmApp;
    }
  
    init() {
        if (document.getElementById('addUserBtn')) {
            document.getElementById('addUserBtn').addEventListener('click', () => this.showUserModal());
        }
        
        if (this.closeDeleteModalBtn) {
            this.closeDeleteModalBtn.addEventListener('click', () => this.hideDeleteModal());
        }
        
        if (this.cancelDeleteBtn) {
            this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteModal());
        }

        if (this.closeNoteModalBtn) {
          this.closeNoteModalBtn.addEventListener('click', () => this.hideNoteModal());
        }

        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
        addUserBtn.addEventListener('click', () => this.showUserModal());
        }
        if (this.closeViewNotesBtn) {
          this.closeViewNotesBtn.addEventListener('click', () => this.hideViewNotesModal());
        }
        if (this.closeViewNotesModalBtn) {
            this.closeViewNotesModalBtn.addEventListener('click', () => this.hideViewNotesModal());
        }
        window.addEventListener('click', (e) => {
            if (e.target === this.viewNotesModal) this.hideViewNotesModal();
        });

        this.contactForm = document.getElementById('contactForm');

        document.getElementById('addUserBtn').addEventListener('click', () => this.showUserModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.hideUserModal());
        this.closeDeleteModalBtn.addEventListener('click', () => this.hideDeleteModal());
        this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteModal());
        window.addEventListener('click', (e) => {
        if (e.target === this.userModal) this.hideUserModal();
        if (e.target === this.deleteModal) this.hideDeleteModal();
      });
    }

    showNoteModal() {
      this.noteModal = document.getElementById('noteModal');
      this.noteModal.style.display = 'flex';
      setTimeout(() => this.noteModal.classList.add('active'), 10);
    }
    
    hideNoteModal() {
      this.noteModal.classList.remove('active');
      setTimeout(() => {
        this.noteModal.style.display = 'none';
        document.getElementById('noteForm').reset();
      }, 300);
    }

// In Modals class
    showViewNotesModal(notes, contactKey) {
      // Get the correct modal reference
      this.viewNotesModal = document.getElementById('viewNotesModal');
      const container = document.getElementById('notesContainer');

      this.currentNotes = notes;
      this.currentContactKey = contactKey;

      this.addNoteDeleteHandlers();
      
      // Show the modal
      this.viewNotesModal.style.display = 'flex';
      setTimeout(() => this.viewNotesModal.classList.add('active'), 10);

      // Populate notes
      const notesArray = Object.entries(notes || {});
      container.innerHTML = notesArray
      .map(([noteKey, note], index) => `
          <div class="note-bubble" data-note-id="${noteKey}">
            <div class="delete-controls">
              <button class="note-delete-btn">
                <i class="fas fa-trash-alt"></i>
              </button>
              <div class="confirm-delete hidden">
                <button class="btn danger xsmall confirm-delete-btn">Delete</button>
                <button class="btn secondary xsmall cancel-delete-btn">Cancel</button>
              </div>
            </div>
            <div class="note-header">
              <small>${this.formatEasternTime(note.timestamp)}</small>
            </div>
            <p>${note.content}</p>
            <div class="note-footer">
              <span class="note-author">${note.userEmail || 'System'}</span>
            </div>
          </div>
        `).join('') || '<p class="text-muted">No notes found for this contact</p>';
    }
    
    hideViewNotesModal() {
        this.viewNotesModal.classList.remove('active');
        setTimeout(() => {
            this.viewNotesModal.style.display = 'none';
        }, 300);
    }

    addNoteDeleteHandlers() {
      const container = document.getElementById('notesContainer');
      
      container.addEventListener('click', async (e) => {
        const noteBubble = e.target.closest('.note-bubble');
        if (!noteBubble) return;
    
        const noteKey = noteBubble.dataset.noteId;
        const deleteBtn = e.target.closest('.note-delete-btn');
        const confirmDeleteBtn = e.target.closest('.confirm-delete-btn');
        const cancelDeleteBtn = e.target.closest('.cancel-delete-btn');
    
        if (deleteBtn) {
          // Show confirmation buttons
          const controls = deleteBtn.closest('.delete-controls');
          controls.querySelector('.note-delete-btn').classList.add('hidden');
          controls.querySelector('.confirm-delete').classList.remove('hidden');
        }
    
        if (cancelDeleteBtn) {
          // Hide confirmation buttons
          const controls = cancelDeleteBtn.closest('.delete-controls');
          controls.querySelector('.note-delete-btn').classList.remove('hidden');
          controls.querySelector('.confirm-delete').classList.add('hidden');
        }
    
        if (confirmDeleteBtn) {
          try {
            const noteRef = ref(
              this.crmApp.db,
              `users/${this.crmApp.userId}/contacts/${this.currentContactKey}/notes/${noteKey}`
            );
            await remove(noteRef);
            noteBubble.remove();
          } catch (error) {
            console.error('Error deleting note:', error);
            alert('Failed to delete note');
          }
        }
      });
    }

    formatEasternTime(isoString) {
      return new Date(isoString).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' (ET)';
    }
  
    showUserModal() {
        if (!this.userModal) return;
        this.userModal.style.display = 'flex';
        setTimeout(() => this.userModal.classList.add('active'), 10);
    }
  
    hideUserModal() {
      this.userModal.classList.remove('active');
      setTimeout(() => {
        this.userModal.style.display = 'none';
        this.contactForm.reset();
      }, 300);
    }
  
    showDeleteModal() {
        if (!this.deleteModal) return;
        this.deleteModal.style.display = 'flex';
        setTimeout(() => this.deleteModal.classList.add('active'), 10);
    }
  
    hideDeleteModal() {
      this.deleteModal.classList.remove('active');
      setTimeout(() => {
        this.deleteModal.style.display = 'none';
      }, 300);
    }
  
    bindFormSubmit(handler) {
      this.contactForm.onsubmit = handler;
    }
  }