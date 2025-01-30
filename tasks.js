import { auth, db } from './src/services/firebase.js';
import { ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { Modals } from './src/components/Modals.js';

export class TaskManager {
    constructor() {
        this.userId = null;
        this.currentCategory = null;
        this.users = [];
        this.modals = new Modals(this);
        this.pendingDelete = null;
        this.modals.deleteHandler = this.handleDeleteConfirmation.bind(this);
        
        this.initAuth();
        this.initEventListeners();
        this.loadUsers();
    }

    initAuth() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.userId = user.uid;
                this.loadCategories();
            }
        });
    }

    initEventListeners() {
        const taskForm = document.getElementById('taskForm');
        const newTaskForm = taskForm.cloneNode(true);
        taskForm.parentNode.replaceChild(newTaskForm, taskForm);
    
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });

        document.getElementById('createCategoryBtn').addEventListener('click', () => {
            this.showModal('category');
        });

        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCategory();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });
        
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.modals.hideAllModals());
        });
    }

    loadUsers() {
        const usersRef = ref(db, 'users');
        onValue(usersRef, (snapshot) => {
            this.users = snapshot.val() ? Object.values(snapshot.val()) : [];
            this.populateAssigneeDropdown();
        });
    }

    populateAssigneeDropdown() {
        const select = document.getElementById('assignedTo');
        select.innerHTML = this.users.map(user => 
            `<option value="${user.email}">${user.email}</option>`
        ).join('');
    }

    loadCategories() {
        const categoriesRef = ref(db, `users/${this.userId}/categories`);
        onValue(categoriesRef, (snapshot) => {
            const categories = snapshot.val() || {};
            this.renderCategories(categories);
        });
    }

    renderCategories(categories) {
        const container = document.getElementById('categoriesContainer');
        container.innerHTML = Object.entries(categories).map(([key, category]) => `
            <div class="category-card">
                <button class="delete-category-btn">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <div class="category-header" data-category-id="${key}">
                    <h3 class="category-title">${category.name}</h3>
                    <div class="category-actions">
                        <span class="task-count">${Object.keys(category.tasks || {}).length} tasks</span>
                        <button class="btn secondary" data-category="${key}">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
                <div class="category-details">
                    <p>${category.description || 'No description'}</p>
                    <small>Created by ${category.createdBy} • ${new Date(category.createdAt).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    
        // Add category click handlers
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const categoryId = header.dataset.categoryId;
                    this.showCategoryTasks(categoryId, categories[categoryId].name);
                }
            });
        });
    
        // Add delete handlers
        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryId = e.target.closest('.category-card').querySelector('.category-header').dataset.categoryId;
                this.handleDeleteCategory(categoryId);
            });
        });
    }

    async handleDeleteCategory(categoryId) {
        this.pendingDelete = { type: 'category', id: categoryId };
        this.modals.showDeleteModal();
    }
    
    async handleDeleteTask(taskId) {
        this.pendingDelete = { type: 'task', id: taskId };
        this.modals.showDeleteModal();
    }

    async handleDeleteConfirmation() {
        if (!this.pendingDelete) return;
    
        try {
            if (this.pendingDelete.type === 'category') {
                const categoryRef = ref(db, `users/${this.userId}/categories/${this.pendingDelete.id}`);
                await remove(categoryRef);
            } else if (this.pendingDelete.type === 'task') {
                const taskRef = ref(db, `users/${this.userId}/categories/${this.currentCategory.id}/tasks/${this.pendingDelete.id}`);
                await remove(taskRef);
            }
            this.modals.hideDeleteModal();
            this.pendingDelete = null;
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete');
        }
    }

    createCategory() {
        const categoryData = {
            name: document.getElementById('categoryName').value,
            description: document.getElementById('categoryDescription').value,
            createdBy: auth.currentUser.email,
            createdAt: new Date().toISOString(),
            tasks: {}
        };

        const categoriesRef = ref(db, `users/${this.userId}/categories`);
        push(categoriesRef, categoryData)
            .then(() => this.hideModals())
            .catch(console.error);

        this.modals.hideAllModals();
    }

    createTask() {
        if (!this.currentCategory) {
            alert('Please select a category first');
            return;
        }

        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            dueDate: document.getElementById('dueDate').value,
            assignedTo: document.getElementById('assignedTo').value,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        const tasksRef = ref(db, `users/${this.userId}/categories/${this.currentCategory.id}/tasks`);        push(tasksRef, taskData)
        .then(() => {
            this.modals.hideAllModals();
            document.getElementById('taskForm').reset();
        })
        .catch(console.error);

        this.modals.hideAllModals();
    }

    showModal(type) {
        document.getElementById(`${type}Modal`).classList.add('active');
    }

    hideModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showCategoryTasks(categoryId, categoryName) {
        this.currentCategory = { id: categoryId, name: categoryName };
        const container = document.getElementById('categoriesContainer');

        document.getElementById('createTaskBtn').addEventListener('click', () => {
            document.getElementById('taskCategory').value = categoryName;
            this.modals.showTaskModal();
        });
        
        // Update header
        const header = document.querySelector('.content-header');
        header.innerHTML = `
            <div class="back-header">
                <button class="btn secondary" id="backToCategories">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h1>${categoryName} Tasks</h1>
            </div>
            <button class="btn primary" id="createTaskBtn">
                <i class="fas fa-plus"></i> New Task
            </button>
        `;
    
        // Load tasks
        const tasksRef = ref(db, `users/${this.userId}/categories/${categoryId}/tasks`);
        onValue(tasksRef, (snapshot) => {
            const tasks = snapshot.val() || {};
            this.renderTasks(tasks);
        });
    
        // Add back button handler
        document.getElementById('backToCategories').addEventListener('click', () => {
            this.loadCategories();
            document.querySelector('.content-header').innerHTML = `
                <h1>Task Management</h1>
                <button class="btn primary" id="createCategoryBtn">
                    <i class="fas fa-plus"></i> New Category
                </button>
            `;
            this.initEventListeners();
        });
    }

    renderTasks(tasks) {
        const container = document.getElementById('categoriesContainer');
        container.innerHTML = Object.entries(tasks).map(([key, task]) => `
            <div class="task-item" data-task-id="${key}">
                <div>
                    <h4>${task.title}</h4>
                    <div class="task-meta">
                        <span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                        <span class="task-status ${task.status.toLowerCase()}">${task.status}</span>
                    </div>
                    <p>${task.description || ''}</p>
                </div>
                <div class="task-actions">
                    <button class="action-btn delete-task-btn">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    initTaskDeletion() {
        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.handleDeleteTask(taskId);
            });
        });
    }
    
    async handleDeleteTask(taskId) {
        if (confirm('Delete this task?')) {
            const taskRef = ref(db, `users/${this.userId}/categories/${this.currentCategory.id}/tasks/${taskId}`);
            await remove(taskRef);
        }
    }
}

// Initialize the task manager
new TaskManager();