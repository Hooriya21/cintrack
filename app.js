/**
 * Aether Study Planner - Main Application Manager
 */
class AetherApp {
    constructor() {
        this.state = this.loadState();
        
        // Modules
        this.todo = null;
        this.pomodoro = null;
        this.quiz = null;
        this.flashcard = null;
        this.reminders = null;

        // General DOM bindings
        this.themeToggle = document.getElementById('theme-toggle');
        this.greetingText = document.getElementById('greeting-text');
        this.dateText = document.getElementById('current-date-text');
        this.navItems = document.querySelectorAll('.nav-item');
        this.views = document.querySelectorAll('.app-view');
        this.toastOverlay = document.getElementById('toast-overlay-container');
    }

    init() {
        // 1. Initialize Nav switching
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.switchTab(item.dataset.tab);
            });
        });

        // 2. Initialize Theme Toggling
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        this.applySavedTheme();

        // 3. Render header clock/date and greeting
        this.updateHeaderTime();
        setInterval(() => this.updateHeaderTime(), 60000); // refresh every minute

        // 4. Instantiate and initialize sub-modules
        this.todo = new TodoModule(this);
        this.pomodoro = new PomodoroModule(this);
        this.quiz = new QuizModule(this);
        this.flashcard = new FlashcardModule(this);
        this.reminders = new RemindersModule(this);

        this.todo.init();
        this.pomodoro.init();
        this.quiz.init();
        this.flashcard.init();
        this.reminders.init();

        // 5. Update dashboard stats
        this.updateDashboardStats();

        // 6. Bind quick navigation buttons from dashboard
        const manageTasksBtn = document.getElementById('dash-tasks-view-btn');
        if (manageTasksBtn) manageTasksBtn.onclick = () => this.switchTab('todo');

        const viewRemindersBtn = document.getElementById('dash-reminders-view-btn');
        if (viewRemindersBtn) viewRemindersBtn.onclick = () => this.switchTab('reminders');

        console.log('Aether Study Planner Initialized successfully!');
    }

    loadState() {
        const defaultState = {
            tasks: [],
            pomodoroLogs: [],
            pomodoroSettings: { pomodoro: 25, short: 5, long: 15 },
            totalFocusMinutes: 0,
            quizzes: [],
            totalQuizzesTaken: 0,
            flashcardDecks: [],
            totalFlashcardReviews: 0,
            reminders: []
        };

        try {
            const saved = localStorage.getItem('aether_study_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge to ensure no missing keys if schema updates
                return { ...defaultState, ...parsed };
            }
        } catch (e) {
            console.error('Failed to load state from localStorage:', e);
        }
        return defaultState;
    }

    saveState() {
        try {
            localStorage.setItem('aether_study_state', JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save state to localStorage:', e);
        }
    }

    switchTab(tabId) {
        // Update nav items active styles
        this.navItems.forEach(item => {
            if (item.dataset.tab === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Toggle active views
        this.views.forEach(view => {
            const viewId = view.id.replace('-view', '');
            if (viewId === tabId) {
                view.classList.add('active');
            } else {
                view.classList.remove('active');
            }
        });

        // Trigger updates if entering a specific view
        if (tabId === 'dashboard') {
            this.updateDashboardStats();
            // Sync dashboard Pomodoro display with current state
            if (this.pomodoro) {
                this.pomodoro.updateDisplay();
            }
        }
        if (tabId === 'todo' && this.todo) {
            this.todo.render();
        }
        if (tabId === 'reminders' && this.reminders) {
            this.reminders.render();
        }
    }

    updateDashboardStats() {
        // Today's Date
        this.updateHeaderTime();

        // 1. Focus duration stats
        const focusHoursEl = document.getElementById('dash-focus-hours');
        if (focusHoursEl) {
            const totalMins = this.state.totalFocusMinutes;
            if (totalMins >= 60) {
                const hrs = (totalMins / 60).toFixed(1);
                focusHoursEl.textContent = `${hrs}h`;
            } else {
                focusHoursEl.textContent = `${totalMins}m`;
            }
        }

        // 2. Quiz count stats
        const quizTakenEl = document.getElementById('dash-quiz-taken');
        if (quizTakenEl) {
            quizTakenEl.textContent = this.state.totalQuizzesTaken;
        }

        // 3. Re-render mini lists in dashboard
        if (this.todo) this.todo.render();
        if (this.reminders) this.reminders.render();
    }

    updateHeaderTime() {
        const now = new Date();
        
        // Format: DayOfWeek, Month Day, Year (e.g., Tuesday, June 23, 2026)
        if (this.dateText) {
            this.dateText.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Greeting based on time of day
        if (this.greetingText) {
            const hrs = now.getHours();
            let greeting = 'Good morning, Scholar!';
            if (hrs >= 12 && hrs < 17) {
                greeting = 'Good afternoon, Scholar!';
            } else if (hrs >= 17) {
                greeting = 'Good evening, Scholar!';
            }
            this.greetingText.textContent = greeting;
        }
    }

    /* Theme Management */
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('aether_theme', newTheme);
        this.showToast(`Switched to ${newTheme} mode`, 'success');
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem('aether_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    /* Toast Notification Utility */
    showToast(message, type = 'primary') {
        if (!this.toastOverlay) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        toast.innerHTML = `
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close">&times;</button>
        `;

        this.toastOverlay.appendChild(toast);

        // Bind close button
        toast.querySelector('.toast-close').onclick = () => toast.remove();

        // Self-dismiss after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            toast.addEventListener('animationend', () => toast.remove());
        }, 4000);
    }

    /* Utility: Escape HTML for XSS prevention */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Start application when DOM loads
window.addEventListener('DOMContentLoaded', () => {
    window.App = new AetherApp();
    window.App.init();
});
