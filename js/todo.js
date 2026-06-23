/**
 * Todo Module - Handles Task management logic and UI updates
 */
class TodoModule {
    constructor(appInstance) {
        this.app = appInstance;
        this.currentFilter = 'all';
        this.todoForm = document.getElementById('todo-form');
        this.todoContainer = document.getElementById('todo-list-container');
        this.progressBar = document.getElementById('todo-progress-bar');
        this.progressPercent = document.getElementById('todo-progress-percent');
        this.dashTodoContainer = document.getElementById('dash-todo-list');
        this.dashTasksProgress = document.getElementById('dash-tasks-progress');
    }

    init() {
        // Setup Form submission
        if (this.todoForm) {
            this.todoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTask();
            });
        }

        // Setup filters
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        // Set default date input value to today
        const dateInput = document.getElementById('task-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            dateInput.min = today;
        }

        this.render();
    }

    handleAddTask() {
        const titleInput = document.getElementById('task-title');
        const dateInput = document.getElementById('task-date');
        const timeInput = document.getElementById('task-time');
        const priorityInput = document.getElementById('task-priority');
        const categoryInput = document.getElementById('task-category');

        if (!titleInput.value.trim()) return;

        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title: titleInput.value.trim(),
            dueDate: dateInput.value,
            dueTime: timeInput.value || '23:59',
            priority: priorityInput.value,
            category: categoryInput.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.app.state.tasks.push(newTask);
        this.app.saveState();
        
        // Reset form but keep defaults
        titleInput.value = '';
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        
        this.app.showToast('Task added successfully!', 'success');
        this.render();
        
        // Update Dashboard too
        this.app.updateDashboardStats();
    }

    toggleTask(taskId) {
        const task = this.app.state.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.app.saveState();
            this.render();
            this.app.updateDashboardStats();
            
            if (task.completed) {
                this.app.showToast('Task completed! Keep it up!', 'success');
            }
        }
    }

    deleteTask(taskId) {
        const index = this.app.state.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            this.app.state.tasks.splice(index, 1);
            this.app.saveState();
            this.render();
            this.app.updateDashboardStats();
            this.app.showToast('Task deleted.', 'warning');
        }
    }

    render() {
        const tasks = this.app.state.tasks;
        
        // Filter tasks
        let filteredTasks = tasks;
        if (this.currentFilter === 'active') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        }

        // Sort: incomplete first, then by priority (high > medium > low), then by date
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            
            return new Date(a.dueDate + 'T' + a.dueTime) - new Date(b.dueDate + 'T' + b.dueTime);
        });

        // 1. Render in Full Todo View
        if (this.todoContainer) {
            if (filteredTasks.length === 0) {
                this.todoContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h4>No tasks found</h4>
                        <p>${this.currentFilter === 'all' ? 'Add tasks to organize your study session.' : 'Try changing your filter.'}</p>
                    </div>
                `;
            } else {
                this.todoContainer.innerHTML = filteredTasks.map(task => {
                    const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    });
                    
                    const categoryLabel = {
                        study: '📚 Study',
                        assignment: '📝 Assignment',
                        revision: '🔄 Revision',
                        project: '🚀 Project'
                    }[task.category] || task.category;

                    return `
                        <div class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                            <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
                            <div class="todo-details">
                                <div class="todo-title">${this.app.escapeHtml(task.title)}</div>
                                <div class="todo-meta">
                                    <span class="todo-badge badge-${task.priority}">${task.priority}</span>
                                    <span class="todo-category">${categoryLabel}</span>
                                    <span class="todo-date">📅 Due: ${formattedDate} at ${task.dueTime}</span>
                                </div>
                            </div>
                            <button class="btn-delete-task" aria-label="Delete task">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    `;
                }).join('');

                // Bind Toggle Event
                this.todoContainer.querySelectorAll('.todo-checkbox').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        const id = e.target.closest('.todo-item').dataset.id;
                        this.toggleTask(id);
                    });
                });

                // Bind Delete Event
                this.todoContainer.querySelectorAll('.btn-delete-task').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('.todo-item').dataset.id;
                        this.deleteTask(id);
                    });
                });
            }
        }

        // Calculate and Render Progress Bar
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
        if (this.progressPercent) {
            this.progressPercent.textContent = `${percent}%`;
        }
        if (this.dashTasksProgress) {
            this.dashTasksProgress.textContent = `${percent}%`;
        }

        // 2. Render mini checklist on Dashboard (limit to 3 high-priority / pending tasks)
        if (this.dashTodoContainer) {
            const pendingTasks = tasks.filter(t => !t.completed)
                .sort((a, b) => {
                    const priorityWeight = { high: 3, medium: 2, low: 1 };
                    return priorityWeight[b.priority] - priorityWeight[a.priority];
                })
                .slice(0, 3);

            if (pendingTasks.length === 0) {
                this.dashTodoContainer.innerHTML = `
                    <div class="empty-state-mini">All caught up! No urgent tasks.</div>
                `;
            } else {
                this.dashTodoContainer.innerHTML = pendingTasks.map(task => {
                    const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return `
                        <div class="todo-mini-item" data-id="${task.id}">
                            <div class="mini-item-details">
                                <span class="mini-item-title">${this.app.escapeHtml(task.title)}</span>
                                <span class="mini-item-meta">${task.priority.toUpperCase()} | 📅 ${formattedDate}</span>
                            </div>
                            <input type="checkbox" class="todo-checkbox mini-cb">
                        </div>
                    `;
                }).join('');

                // Bind mini toggles
                this.dashTodoContainer.querySelectorAll('.mini-cb').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        const id = e.target.closest('.todo-mini-item').dataset.id;
                        this.toggleTask(id);
                    });
                });
            }
        }
    }
}

// Make globally available
window.TodoModule = TodoModule;
