import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { 
  getDatabase,
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  get
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcz3F4mbJ87PiNuiOBx8QwDNHTeAIEefM",
  authDomain: "minicrm-4ae44.firebaseapp.com",
  databaseURL: "https://minicrm-4ae44-default-rtdb.firebaseio.com",
  projectId: "minicrm-4ae44",
  storageBucket: "minicrm-4ae44.appspot.com",
  messagingSenderId: "572080501512",
  appId: "1:572080501512:web:0040edf973e4e7a57d72bd",
  measurementId: "G-J0QCX0WVSD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    initCRM(user.uid);
  } else {
    window.location.href = '../index.html';
  }
});

async function initCRM(userId) {
  function getTagColorClass(tagName) {
    const hash = Array.from(tagName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = (hash % 6) + 1; // Returns 1-6
    return {
        class: `tag-color-${colorIndex}`,
        index: colorIndex
    };
  }

  let currentTags = [];
  let currentContactKey = null;
  const contactsRef = ref(db, `users/${userId}/contacts`);

  // Real-time database listener
  onValue(contactsRef, (snapshot) => {
    const data = snapshot.val();
    const contacts = data ? Object.entries(data) : [];
    renderContacts(contacts);
  }, (error) => {
    console.error("Database error:", error);
  });

  // DOM Elements
  const contactGrid = document.getElementById('contactGrid');
  const addUserBtn = document.getElementById('addUserBtn');
  const userModal = document.getElementById('userModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const contactForm = document.getElementById('contactForm');
  const tagsInput = document.getElementById('tagsInput');

  // Modal Handling
  const showModal = () => {
    userModal.style.display = 'flex';
    setTimeout(() => userModal.classList.add('active'), 10);
  };

  const hideModal = () => {
    userModal.classList.remove('active');
    setTimeout(() => {
      userModal.style.display = 'none';
      contactForm.reset();
      currentTags = [];
      currentContactKey = null;
      renderTags();
    }, 300);
  };

  addUserBtn.addEventListener('click', () => {
    contactForm.onsubmit = handleCreateContact;
    showModal();
  });

  closeModalBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => e.target === userModal && hideModal());

  // Enhanced Tag Management
  tagsInput.addEventListener('keydown', (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      processTagInput();
    }
  });

  tagsInput.addEventListener('blur', () => {
    processTagInput();
  });

  function processTagInput() {
    const input = tagsInput.value.trim();
    
    if (input) {
      const newTags = input.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !currentTags.includes(tag));
      
      currentTags = [...new Set([...currentTags, ...newTags])];
      tagsInput.value = '';
      renderTags();
    }
  }

  function renderTags() {
    const container = document.querySelector('.tags-container');
    container.innerHTML = currentTags.map(tag => {
        const color = getTagColorClass(tag);
        return `
            <div class="tag ${color.class}">
                <span>${tag}</span>
                <span class="tag-remove" data-tag="${tag}">&times;</span>
            </div>
        `;
    }).join('');

    // Add event listeners to remove buttons
    container.querySelectorAll('.tag-remove').forEach(removeBtn => {
      removeBtn.addEventListener('click', (e) => {
        const tagToRemove = e.target.dataset.tag;
        currentTags = currentTags.filter(t => t !== tagToRemove);
        renderTags();
      });
    });
  }

  // Contact Operations
  async function handleCreateContact(e) {
    e.preventDefault();
    
    const newContact = {
      name: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      birthday: document.getElementById('birthDate').value,
      tags: currentTags.length > 0 ? currentTags : null,
      lastContacted: new Date().toISOString().split('T')[0]
    };

    try {
      const newContactRef = push(contactsRef);
      await set(newContactRef, newContact);
      hideModal();
    } catch (error) {
      console.error("Save failed:", error);
      alert('Failed to save contact');
    }
  }

  async function handleEditContact(e) {
    const contactCard = e.target.closest('.contact-card');
    currentContactKey = contactCard.dataset.key;
    
    const contactSnapshot = await get(ref(db, `users/${userId}/contacts/${currentContactKey}`));
    const contact = contactSnapshot.val();
  
    currentTags = contact.tags ? [...contact.tags] : [];
    
    document.getElementById('fullName').value = contact.name;
    document.getElementById('email').value = contact.email;
    document.getElementById('phone').value = contact.phone || '';
    document.getElementById('birthDate').value = contact.birthday || '';
    
    renderTags();
    tagsInput.focus();

    contactForm.onsubmit = handleUpdateContact;
    showModal();
  }

  async function handleUpdateContact(e) {
    e.preventDefault();
    
    const updatedContact = {
      name: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      birthday: document.getElementById('birthDate').value,
      tags: currentTags.length > 0 ? currentTags : null,
      lastContacted: new Date().toISOString().split('T')[0]
    };

    try {
      await update(ref(db, `users/${userId}/contacts/${currentContactKey}`), updatedContact);
      hideModal();
    } catch (error) {
      console.error("Update failed:", error);
      alert('Failed to update contact');
    }
  }

  // Delete Confirmation Modal Handling
  const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  let contactToDeleteKey = null;

  const showDeleteModal = () => {
    deleteConfirmationModal.style.display = 'flex';
    setTimeout(() => deleteConfirmationModal.classList.add('active'), 10);
  };

  const hideDeleteModal = () => {
    deleteConfirmationModal.classList.remove('active');
    setTimeout(() => {
      deleteConfirmationModal.style.display = 'none';
      contactToDeleteKey = null;
    }, 300);
  };

  closeDeleteModalBtn.addEventListener('click', hideDeleteModal);
  cancelDeleteBtn.addEventListener('click', hideDeleteModal);
  window.addEventListener('click', (e) => e.target === deleteConfirmationModal && hideDeleteModal());

  async function handleDeleteContact(e) {
    contactToDeleteKey = e.target.closest('.contact-card').dataset.key;
    showDeleteModal();
  }

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!contactToDeleteKey) return;

    try {
      await remove(ref(db, `users/${userId}/contacts/${contactToDeleteKey}`));
      hideDeleteModal();
    } catch (error) {
      console.error("Delete failed:", error);
      alert('Failed to delete contact');
    }
  });

  // Rendering Functions
  function renderContacts(contacts) {
    contactGrid.innerHTML = contacts.map(([key, contact]) => {
      const tags = contact.tags || [];
      
      return `
        <div class="contact-card" data-key="${key}">
          <h3>${contact.name}</h3>
          <div class="contact-details">
            <p><i class="fas fa-envelope"></i> ${contact.email}</p>
            ${contact.phone ? `<p><i class="fas fa-phone"></i> ${contact.phone}</p>` : ''}
            ${contact.birthday ? `<p class="clean-font"><i class="fas fa-birthday-cake"></i> ${formatBirthday(contact.birthday)}</p>` : ''}
            ${tags.length ? `
             <div class="tags-preview">
                ${tags.map(tag => {
                    const color = getTagColorClass(tag);
                    return `<span class="tag-preview" data-color="${color.index}">${tag}</span>`;
                }).join('')}
              </div>
            ` : ''}
          </div>
          <div class="contact-actions">
            <button class="action-btn edit-btn">
              <i class="fas fa-edit"></i>
              Edit
            </button>
            <button class="action-btn delete-btn">
              <i class="fas fa-trash-alt"></i>
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteContact);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', handleEditContact);
    });

    updateMetrics(contacts.map(([_, c]) => c));
  }

  function formatBirthday(dateString) {
    const options = { month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  function updateMetrics(contacts) {
    document.getElementById('totalContacts').textContent = contacts.length;
    document.getElementById('birthdayContacts').textContent = 
      contacts.filter(c => isBirthdayThisMonth(c.birthday)).length;
  }

  function isBirthdayThisMonth(birthday) {
    if(!birthday) return false;
    const now = new Date();
    const birthDate = new Date(birthday);
    return birthDate.getMonth() === now.getMonth();
  }
}

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please check console for details.');
  }
});