import { auth, db } from './src/services/firebase.js';
import { initAuth, handleLogout } from './src/services/auth.js';
import { ContactList } from './src/components/ContactList.js';
import { TagManager } from './src/components/TagManager.js';
import { Modals } from './src/components/Modals.js';
import { get, ref, remove, push, set, update } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

export class CRMApp {
  constructor() {
    this.modals = new Modals();
    this.tagManager = new TagManager();
    this.contactList = null;
    this.currentContactKey = null;
    this.userId = null;
  }

  async init() {
    initAuth((user) => this.handleAuthStateChange(user));
    
    // Only add logout listener if element exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Initialize only existing components
    if (document.getElementById('userModal')) {
        this.modals.init();
    }
    
    if (document.getElementById('tagsInput')) {
        this.tagManager.init();
    }
    
    this.setupDeleteConfirmation();
    }

  handleAuthStateChange(user) {
    if (user) {
      this.userId = user.uid;
      this.contactList = new ContactList(
        this.userId, 
        db,
        (key) => this.handleEdit(key),
        (key) => this.handleDelete(key)
      );
      this.contactList.init();
      this.setupContactForm();
    }
  }

  async handleEdit(contactKey) {
    this.currentContactKey = contactKey;
    const contactSnapshot = await get(ref(db, `users/${this.userId}/contacts/${contactKey}`));
    const contact = contactSnapshot.val();
    
    // Populate form fields
    document.getElementById('fullName').value = contact.name;
    document.getElementById('email').value = contact.email;
    document.getElementById('phone').value = contact.phone || '';
    document.getElementById('birthDate').value = contact.birthday || '';
    this.tagManager.setTags(contact.tags || []);
    
    this.modals.showUserModal();
  }

  handleDelete(contactKey) {
    this.contactToDeleteKey = contactKey;
    this.modals.showDeleteModal();
  }

  setupContactForm() {
    this.modals.bindFormSubmit(async (e) => {
      e.preventDefault();
      const contactData = {
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        birthday: document.getElementById('birthDate').value,
        tags: this.tagManager.getTags(),
        lastContacted: new Date().toISOString().split('T')[0]
      };

      try {
        if (this.currentContactKey) {
          await update(ref(db, `users/${this.userId}/contacts/${this.currentContactKey}`), contactData);
        } else {
          const newContactRef = push(ref(db, `users/${this.userId}/contacts`));
          await set(newContactRef, contactData);
        }
        this.resetFormState();
      } catch (error) {
        console.error("Operation failed:", error);
        alert('Failed to save contact');
      }
    });
  }

  setupDeleteConfirmation() {
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    if (!deleteBtn) return;
    
    deleteBtn.addEventListener('click', async () => {
        if (!this.contactToDeleteKey) return;
        try {
            await remove(ref(db, `users/${this.userId}/contacts/${this.contactToDeleteKey}`));
            this.modals.hideDeleteModal();
        } catch (error) {
            console.error("Delete failed:", error);
            alert('Failed to delete contact');
        }
    });
}

  resetFormState() {
    this.currentContactKey = null;
    this.tagManager.setTags([]);
    this.modals.hideUserModal();
  }
}

// Initialize application
const app = new CRMApp();
app.init();