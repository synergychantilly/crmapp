import { ref, onValue, push, set, update, remove, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { formatBirthday, isBirthdayThisMonth } from "../utils/helpers.js";
import { getTagColorClass } from "../utils/tagColors.js";

export class ContactList {
    constructor(userId, db, handleEditCallback, handleDeleteCallback) {
        this.userId = userId;
        this.db = db;
        this.handleEditCallback = handleEditCallback;
        this.handleDeleteCallback = handleDeleteCallback;
        this.currentContactKey = null;
        this.contactGrid = document.getElementById('contactGrid') || document.getElementById('contactTableBody');
    }

    init() {
        this.setupRealtimeListener();
        this.addEventListeners(); // Corrected from setupDeleteHandlers
    }

  setupRealtimeListener() {
    const contactsRef = ref(this.db, `users/${this.userId}/contacts`);
    onValue(contactsRef, (snapshot) => {
      const data = snapshot.val();
      const contacts = data ? Object.entries(data) : [];
      this.renderContacts(contacts);
    });
  }

  renderContacts(contacts) {
    if (this.contactGrid.id === 'contactGrid') {
        // Render as cards for crm.html
        this.contactGrid.innerHTML = contacts.map(([key, contact]) => {
            const tagsHTML = contact.tags ? contact.tags.map(tag => {
                const colorClass = getTagColorClass(tag).class;
                return `<div class="tag ${colorClass}">${tag}</div>`;
            }).join('') : '';

            return `
                <div class="contact-card" data-key="${key}">
                    <div class="contact-details">
                        <p><strong>${contact.name}</strong></p>
                        <p>${contact.email}</p>
                        <p>${contact.phone || ''}</p>
                        <p>${contact.birthday ? formatBirthday(contact.birthday) : ''}</p>
                        <div class="tags-preview">
                            ${tagsHTML}
                        </div>
                    </div>
                    <div class="contact-actions">
                        <button class="action-btn edit-btn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } else if (this.contactGrid.id === 'contactTableBody') {
        // Render as table for contacts.html
        this.contactGrid.innerHTML = contacts.map(([key, contact]) => {
            const tagsHTML = contact.tags ? contact.tags.map(tag => {
                const colorClass = getTagColorClass(tag).class;
                return `<div class="tag ${colorClass}">${tag}</div>`;
            }).join('') : '';

            return `
                <tr data-key="${key}">
                    <td><strong>${contact.name}</strong></td>
                    <td>${new Date(contact.lastContacted).toLocaleDateString()}</td>
                    <td>${contact.email}</td>
                    <td>${contact.birthday ? formatBirthday(contact.birthday) : ''}</td>
                    <td>
                        <div class="tags-preview">
                            ${tagsHTML}
                        </div>
                    </td>
                    <td>
                        <button class="action-btn edit-btn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    this.addEventListeners();
    this.updateMetrics(contacts.map(([_, c]) => c));
}

  addEventListeners() {
    // Scope queries to the contactGrid container
    this.contactGrid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleDeleteContact(e));
    });
    this.contactGrid.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleEditContact(e));
    });
  }

  async handleEditContact(e) {
    const contactCard = e.target.closest('[data-key]');
    const contactKey = contactCard.dataset.key;
    this.handleEditCallback(contactKey);
    this.currentContactKey = contactKey;
    const contactSnapshot = await get(ref(this.db, `users/${this.userId}/contacts/${this.currentContactKey}`));
    return contactSnapshot.val();
  }

  updateMetrics(contacts) {
    const totalElement = document.getElementById('totalContacts');
    const birthdayElement = document.getElementById('birthdayContacts');
    
    if (totalElement) {
        totalElement.textContent = contacts.length;
    }
    
    if (birthdayElement) {
        birthdayElement.textContent = contacts.filter(c => isBirthdayThisMonth(c.birthday)).length;
    }
  }

  handleDeleteContact(e) {
    const contactElement = e.target.closest('[data-key]'); // Works for any element
    const contactKey = contactElement.dataset.key;
    this.handleDeleteCallback(contactKey);
  }
}