import { ref, onValue, push, set, update, remove, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { formatBirthday, isBirthdayThisMonth } from "../utils/helpers.js";
import { getTagColorClass } from "../utils/tagColors.js";

export class ContactList {
    constructor(userId, db, handleEditCallback, handleDeleteCallback, crmApp ) {
        this.userId = userId;
        this.db = db;
        this.handleEditCallback = handleEditCallback;
        this.handleDeleteCallback = handleDeleteCallback;
        this.currentContactKey = null;
        this.contactGrid = document.getElementById('contactGrid') || document.getElementById('contactTableBody');
        this.searchInput = document.getElementById('searchInput');
        this.allContacts = [];
        this.crmApp = crmApp;
    }

    init() {
        if (!this.contactGrid) {
            console.warn('Contact grid/table element not found.');
            return; // Exit if no element found
        }
        this.setupRealtimeListener();
        this.addEventListeners();
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.handleSearch());
        }
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const filteredContacts = this.allContacts.filter(([_, contact]) => {
            const nameMatch = contact.name.toLowerCase().includes(searchTerm);
            const emailMatch = contact.email.toLowerCase().includes(searchTerm);
            const phoneMatch = contact.phone && contact.phone.toLowerCase().includes(searchTerm);
            const tagMatch = contact.tags && contact.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            return nameMatch || emailMatch || phoneMatch || tagMatch;
        });
        this.renderContacts(filteredContacts);
    }


    setupRealtimeListener() {
        const contactsRef = ref(this.db, `users/${this.userId}/contacts`);
        onValue(contactsRef, (snapshot) => {
            const data = snapshot.val();
            this.allContacts = data ? Object.entries(data) : [];
            this.renderContacts(this.allContacts);
        });
    }

    renderContacts(contacts) {
        if (!this.contactGrid) {
            console.error('Contact grid/table element not found');
            return;
        } try {
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
                        <td>${contact.phone}</td>
                        <td>${contact.email}</td>
                        <td>
                            <div class="tags-preview">
                                ${tagsHTML}
                            </div>
                        </td>
                        <td>
                        ${contact.dateCreated ? 
                            `${new Date(contact.dateCreated).toLocaleDateString('en-US', {
                            timeZone: 'America/New_York',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                            })} ` 
                        : 'N/A'}
                        </td>
                        <td>
                            <div class="action-buttons-grid">
                                <button class="action-btn edit-btn">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                                <button class="action-btn note-btn" data-key="${key}">
                                    <i class="fas fa-comment-dots"></i>
                                </button>
                                <button class="action-btn view-notes-btn" data-key="${key}">
                                    <i class="fas fa-history"></i>
                                    ${this.hasTodayNote(contact.notes) ? '<span class="note-indicator"></span>' : ''}
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

            this.addEventListeners();
            this.updateMetrics(contacts.map(([_, c]) => c));
        } catch (error) {
            console.error('Error rendering contacts:', error);
            this.contactGrid.innerHTML = `<tr><td colspan="6">Error loading contacts</td></tr>`;
        }
    }

    addEventListeners() {
        if (!this.contactGrid) return; // Check if contactGrid exists
        this.contactGrid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteContact(e));
        });
        this.contactGrid.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEditContact(e));
        });
        this.contactGrid.querySelectorAll('.note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const contactKey = e.target.closest('button').dataset.key;
              this.handleNoteButtonClick(contactKey);
            });
        });
        this.contactGrid.querySelectorAll('.view-notes-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contactKey = e.target.closest('button').dataset.key;
                this.handleViewNotes(contactKey);
            });
        });
    }

    hasTodayNote(notes) {
        if (!notes) return false;
        const today = new Date().toISOString().split('T')[0];
        return Object.values(notes).some(note => 
            note.timestamp && note.timestamp.startsWith(today)
        );
    }

  async handleEditContact(e) {
    const contactCard = e.target.closest('[data-key]');
    const contactKey = contactCard.dataset.key;
    this.handleEditCallback(contactKey);
    this.currentContactKey = contactKey;
    const contactSnapshot = await get(ref(this.db, `users/${this.userId}/contacts/${this.currentContactKey}`));
    return contactSnapshot.val();
  }

  handleNoteButtonClick(contactKey) {
    const select = document.getElementById('noteContactSelect');
    select.value = contactKey;
    this.crmApp.modals.showNoteModal();
  }
  
  async handleViewNotes(contactKey) {
    try {
        const notesRef = ref(this.db, `users/${this.userId}/contacts/${contactKey}/notes`);
        const snapshot = await get(notesRef);
        const notes = snapshot.val() || {};
        
        // Add this line to actually show the modal after fetching notes
        this.crmApp.modals.showViewNotesModal(notes, contactKey);
    } catch (error) {
        console.error("Error fetching notes:", error);
        alert('Failed to load notes');
    }
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