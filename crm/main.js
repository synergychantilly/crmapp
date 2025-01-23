import { auth, db } from './src/services/firebase.js';
import { initAuth, handleLogout } from './src/services/auth.js';
import { ContactList } from './src/components/ContactList.js';
import { TagManager } from './src/components/TagManager.js';
import { Modals } from './src/components/Modals.js';
import { get, ref, remove, push, set, update, onValue } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getTagColorClass } from './src/utils/tagColors.js';
import { isBirthdayThisMonth } from './src/utils/helpers.js';

export class CRMApp {
  constructor() {
    this.modals = new Modals(this);
    this.tagManager = new TagManager();
    this.contactList = null;
    this.currentContactKey = null;
    this.userId = null;
    this.charts = {}; // Store chart instances
    this.db = db;
  }

  setupQuickActions() {
    const toggleBtn = document.querySelector('.quick-action-toggle');
    const panel = document.querySelector('.quick-actions-panel');
    
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('expanded');
    });
  
    // Action handlers
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleQuickAction(action);
        panel.classList.remove('expanded'); // Close after click
      });
    });
  }
  
  handleQuickAction(action) {
    switch(action) {
      case 'email':
        this.modals.showEmailModal(); // You'd create this modal next
        break;
      case 'call':
        console.log('Initiate call logic');
        break;
      case 'task':
        this.modals.showTaskModal();
        break;
      case 'note':
        this.modals.showNoteModal();
        break;
    }
  }

  async setupNoteSystem() {
    // Populate contact dropdown
    const contactsRef = ref(this.db, `users/${this.userId}/contacts`);
    onValue(contactsRef, (snapshot) => {
      const contacts = snapshot.val() || {};
      const select = document.getElementById('noteContactSelect');
      
      // Clear existing options first
      select.innerHTML = '<option value="">Select a contact</option>';
      
      // Add contacts only if they have a name
      Object.entries(contacts).forEach(([key, contact]) => {
        if (contact.name) {
          const option = document.createElement('option');
          option.value = key;
          option.textContent = contact.name;
          select.appendChild(option);
        }
      });
  
      // Set default date (ensure this element exists in both modals)
      const dateField = document.getElementById('noteDate');
      if (dateField) {
        dateField.value = new Date().toISOString().split('T')[0];
      }
    });
  
    // Handle note submission
    document.getElementById('noteForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const contactKey = document.getElementById('noteContactSelect').value;
      const content = document.getElementById('noteContent').value.trim();
      
      if (!contactKey || !content) {
        alert('Please select a contact and enter note content');
        return;
      }

      const note = {
        content,
        timestamp: new Date().toISOString(), // Store in UTC
        userEmail: auth.currentUser.email // Add current user's email
      };
  
      try {
        const contactRef = ref(this.db, `users/${this.userId}/contacts/${contactKey}/notes`);
        await push(contactRef, note);
        this.modals.hideNoteModal();
      } catch (error) {
        console.error("Error saving note:", error);
        alert('Failed to save note');
      }
    });
  }
  

  async init() {
    initAuth((user) => this.handleAuthStateChange(user));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (document.getElementById('userModal')) {
        this.modals.init();
    }

    if (document.getElementById('tagsInput')) {
        this.tagManager.init();
    }

    this.setupDeleteConfirmation();
    this.setupChartToggles(); // Initialize chart toggles
    this.setupQuickActions(); // Add this line
  }

  handleAuthStateChange(user) {
    if (user) {
        this.userId = user.uid;
        // Check if contact elements exist before initializing ContactList
        const contactGridExists = document.getElementById('contactGrid') || document.getElementById('contactTableBody');
        if (contactGridExists) {
            this.contactList = new ContactList(
                this.userId,
                db,
                (key) => this.handleEdit(key),
                (key) => this.handleDelete(key),
                this
            );
            this.contactList.init();
        }
        this.setupContactForm();
        this.setupAnalytics();
        this.setupNoteSystem();
    }
  }

  setupAnalytics() {
    const contactsRef = ref(this.db, `users/${this.userId}/contacts`);
    onValue(contactsRef, (snapshot) => {
      const data = snapshot.val();
      const contacts = data ? Object.values(data) : [];
      
      // Add null checks before updating elements
      const totalEl = document.getElementById('totalContacts');
      const birthdayEl = document.getElementById('birthdayContacts');
      
      if (totalEl) totalEl.textContent = contacts.length;
      if (birthdayEl) {
        birthdayEl.textContent = contacts.filter(c => isBirthdayThisMonth(c.birthday)).length;
      }
      
      // Only render charts if we're on the dashboard page
      if (document.getElementById('totalContactsChart')) {
        this.renderCharts(contacts);
      }
    });
  }

  renderCharts(contacts) {
      this.renderTotalContactsChart(contacts);
      this.renderContactsByTagChart(contacts);
      this.renderBirthdaysChart(contacts);
      this.renderContactsOverTimeChart(contacts);
  }

    renderTotalContactsChart(contacts) {
      const ctx = document.getElementById('totalContactsChart').getContext('2d');
      if (this.charts.totalContactsChart) {
          this.charts.totalContactsChart.destroy();
      }
      this.charts.totalContactsChart = new Chart(ctx, {
          type: 'bar',
          data: {
              labels: ['Total Contacts'],
              datasets: [{
                  label: 'Total Contacts',
                  data: [contacts.length],
                  backgroundColor: 'rgba(42, 91, 215, 0.6)',
                  borderColor: 'rgba(42, 91, 215, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                  y: {
                      beginAtZero: true,
                      ticks: {
                          stepSize: 1
                      }
                  }
              },
              plugins: {
                  legend: {
                      position: 'top',
                  }
              }
          }
      });
  }

  renderContactsByTagChart(contacts) {
      const tagCounts = {};
      contacts.forEach(contact => {
          if (contact.tags) {
              contact.tags.forEach(tag => {
                  tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
          }
      });

      const ctx = document.getElementById('contactsByTagChart').getContext('2d');
      if (this.charts.contactsByTagChart) {
          this.charts.contactsByTagChart.destroy();
      }
      this.charts.contactsByTagChart = new Chart(ctx, {
          type: 'pie',
          data: {
              labels: Object.keys(tagCounts),
              datasets: [{
                  label: 'Contacts by Tag',
                  data: Object.values(tagCounts),
                  backgroundColor: Object.keys(tagCounts).map(tag => {
                      const color = getTagColorClass(tag).class.replace('tag-color-', 'rgba(') + ', 0.6)';
                      return color;
                  }),
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      position: 'right',
                      align: 'start'
                  }
              }
          }
      });
  }

  renderBirthdaysChart(contacts) {
      const birthdaysThisMonth = contacts.filter(contact => isBirthdayThisMonth(contact.birthday)).length;
      const ctx = document.getElementById('birthdaysChart').getContext('2d');
      
      if (this.charts.birthdaysChart) {
          this.charts.birthdaysChart.destroy();
      }
      this.charts.birthdaysChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: ['Upcoming Birthdays', 'Other'],
              datasets: [{
                  label: 'Birthdays',
                  data: [birthdaysThisMonth, contacts.length - birthdaysThisMonth],
                  backgroundColor: ['rgba(246, 173, 85, 0.6)', 'rgba(42, 91, 215, 0.6)'],
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      position: 'right',
                  }
              }
          }
      });
  }

  renderContactsOverTimeChart(contacts) {
      const dateCounts = {};
      contacts.forEach(contact => {
          const date = contact.dateCreated ? contact.dateCreated.split('T')[0] : 'N/A';
          dateCounts[date] = (dateCounts[date] || 0) + 1;
      });

      const ctx = document.getElementById('contactsOverTimeChart').getContext('2d');
      if (this.charts.contactsOverTimeChart) {
          this.charts.contactsOverTimeChart.destroy();
      }
      this.charts.contactsOverTimeChart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: Object.keys(dateCounts),
              datasets: [{
                  label: 'Contacts Over Time',
                  data: Object.values(dateCounts),
                  backgroundColor: 'rgba(42, 91, 215, 0.2)',
                  borderColor: 'rgba(42, 91, 215, 1)',
                  borderWidth: 2,
                  fill: true
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                  y: {
                      beginAtZero: true,
                      ticks: {
                          stepSize: 1
                      }
                  }
              },
              plugins: {
                  legend: {
                      position: 'top',
                  }
              }
          }
      });
  }

  setupChartToggles() {
    document.querySelectorAll('.toggle-chart').forEach(button => {
        button.addEventListener('click', (e) => {
            const chartCard = e.target.closest('.chart-card');
            const isMinimized = chartCard.classList.toggle('minimized');
            const icon = button.querySelector('i');
            
            // Update icon classes
            icon.classList.toggle('fa-eye', isMinimized);
            icon.classList.toggle('fa-eye-slash', !isMinimized);
            
            // Handle chart resize
            const chartId = button.dataset.chart;
            if (!isMinimized && this.charts[chartId]) {
                setTimeout(() => {
                    this.charts[chartId].resize();
                    this.charts[chartId].update();
                }, 100);
            }
        });
    });
  }

  async handleEdit(contactKey) {
    this.currentContactKey = contactKey;
    const contactSnapshot = await get(ref(this.db, `users/${this.userId}/contacts/${contactKey}`));
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
        lastContacted: new Date().toISOString().split('T')[0],
        dateCreated: new Date().toISOString().split('T')[0],
        notes: []
      };

      try {
        if (this.currentContactKey) {
          await update(ref(this.db, `users/${this.userId}/contacts/${this.currentContactKey}`), contactData);
        } else {
          const newContactRef = push(ref(this.db, `users/${this.userId}/contacts`));
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
            await remove(ref(this.db, `users/${this.userId}/contacts/${this.contactToDeleteKey}`));
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