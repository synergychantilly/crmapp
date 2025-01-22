export class Modals {
    constructor() {
      this.userModal = document.getElementById('userModal');
      this.deleteModal = document.getElementById('deleteConfirmationModal');
      this.contactForm = document.getElementById('contactForm');
      this.closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
      this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
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

        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
        addUserBtn.addEventListener('click', () => this.showUserModal());
        }

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