/**
 * Reminders Module - Schedules alarms, manages alerts, handles browser notification APIs, and renders overlay modals.
 */
class RemindersModule {
    constructor(appInstance) {
        this.app = appInstance;
        
        this.reminderForm = document.getElementById('reminder-form');
        this.remindersContainer = document.getElementById('reminders-list-container');
        this.dashRemindersContainer = document.getElementById('dash-reminder-list');
        
        // Notifications request box
        this.notificationBox = document.getElementById('browser-notification-request-box');
        this.btnRequestNotif = document.getElementById('btn-request-notifications');
        
        // Modal DOM binds
        this.modalOverlay = document.getElementById('reminder-modal');
        this.modalText = document.getElementById('reminder-modal-text');
        this.modalDismissBtn = document.getElementById('reminder-modal-dismiss');
        
        // Clock interval to check alarms
        this.checkInterval = null;
        this.audioContext = null;
        this.alarmOscillators = []; // Store active oscillators to stop them
    }

    init() {
        // Form submission
        if (this.reminderForm) {
            this.reminderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddReminder();
            });
            
            // Default inputs to today
            const dateInput = document.getElementById('reminder-date');
            const timeInput = document.getElementById('reminder-time');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
                dateInput.min = today;
            }
            if (timeInput) {
                const now = new Date();
                timeInput.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            }
        }

        // Modal close button
        if (this.modalDismissBtn) {
            this.modalDismissBtn.addEventListener('click', () => this.dismissAlarm());
        }

        // Notification permission request
        if (this.btnRequestNotif) {
            this.btnRequestNotif.addEventListener('click', () => this.requestNotificationPermission());
        }
        
        this.checkNotificationStatus();
        this.render();

        // Start checking alarm timer loop (runs every 3 seconds)
        this.startReminderClock();
    }

    checkNotificationStatus() {
        if (!this.notificationBox) return;

        if (!('Notification' in window)) {
            // Browser doesn't support notifications
            this.notificationBox.style.display = 'none';
        } else if (Notification.permission === 'granted' || Notification.permission === 'denied') {
            // Already decided
            this.notificationBox.style.display = 'none';
        } else {
            // Default state, show permission card
            this.notificationBox.style.display = 'flex';
        }
    }

    requestNotificationPermission() {
        if (!('Notification' in window)) return;
        
        Notification.requestPermission().then(permission => {
            this.checkNotificationStatus();
            if (permission === 'granted') {
                this.app.showToast('Desktop notifications enabled!', 'success');
            } else {
                this.app.showToast('Notifications declined. In-app alerts will still work.', 'warning');
            }
        });
    }

    handleAddReminder() {
        const titleInput = document.getElementById('reminder-title');
        const dateInput = document.getElementById('reminder-date');
        const timeInput = document.getElementById('reminder-time');

        if (!titleInput.value.trim() || !dateInput.value || !timeInput.value) return;

        const newReminder = {
            id: 'reminder_' + Date.now(),
            title: titleInput.value.trim(),
            date: dateInput.value,
            time: timeInput.value,
            triggered: false,
            createdAt: new Date().toISOString()
        };

        // Validate time is in the future
        const targetDateTime = new Date(`${newReminder.date}T${newReminder.time}`);
        if (targetDateTime <= new Date()) {
            this.app.showToast('Please select a date and time in the future!', 'danger');
            return;
        }

        this.app.state.reminders.push(newReminder);
        this.app.saveState();
        
        // Reset text title
        titleInput.value = '';
        this.render();
        this.app.showToast('Study reminder scheduled!', 'success');
        this.app.updateDashboardStats();
    }

    deleteReminder(reminderId) {
        const index = this.app.state.reminders.findIndex(r => r.id === reminderId);
        if (index !== -1) {
            this.app.state.reminders.splice(index, 1);
            this.app.saveState();
            this.render();
            this.app.showToast('Reminder cancelled.', 'warning');
            this.app.updateDashboardStats();
        }
    }

    render() {
        const reminders = this.app.state.reminders.filter(r => !r.triggered);
        
        // Sort by chronological time (earliest first)
        reminders.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

        // 1. Render in Reminders View
        if (this.remindersContainer) {
            if (reminders.length === 0) {
                this.remindersContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">⏰</div>
                        <h4>No reminders scheduled</h4>
                        <p>Create a reminder on the left to schedule a revision alarm.</p>
                    </div>
                `;
            } else {
                this.remindersContainer.innerHTML = reminders.map(reminder => {
                    const formattedDate = new Date(reminder.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });

                    return `
                        <div class="reminder-item" data-id="${reminder.id}">
                            <div class="reminder-details">
                                <span class="reminder-title">${this.app.escapeHtml(reminder.title)}</span>
                                <span class="reminder-time">🔔 ${formattedDate} at ${reminder.time}</span>
                            </div>
                            <button class="btn-delete-reminder" aria-label="Cancel reminder">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    `;
                }).join('');

                // Bind delete event
                this.remindersContainer.querySelectorAll('.btn-delete-reminder').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('.reminder-item').dataset.id;
                        this.deleteReminder(id);
                    });
                });
            }
        }

        // 2. Render on Dashboard Widget (limit to 3 upcoming)
        if (this.dashRemindersContainer) {
            const nextReminders = reminders.slice(0, 3);

            if (nextReminders.length === 0) {
                this.dashRemindersContainer.innerHTML = `
                    <div class="empty-state-mini">No upcoming alarms.</div>
                `;
            } else {
                this.dashRemindersContainer.innerHTML = nextReminders.map(reminder => {
                    const formattedDate = new Date(reminder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return `
                        <div class="reminder-mini-item">
                            <div class="mini-item-details">
                                <span class="mini-item-title">${this.app.escapeHtml(reminder.title)}</span>
                                <span class="mini-item-meta">⏰ ${formattedDate} at ${reminder.time}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    /* Periodic alarm checker */
    startReminderClock() {
        if (this.checkInterval) clearInterval(this.checkInterval);

        this.checkInterval = setInterval(() => {
            const now = new Date();
            let stateChanged = false;

            this.app.state.reminders.forEach(reminder => {
                if (!reminder.triggered) {
                    const reminderTime = new Date(`${reminder.date}T${reminder.time}`);
                    
                    // Check if current time is equal to or past scheduled time
                    if (now >= reminderTime) {
                        reminder.triggered = true;
                        stateChanged = true;
                        this.triggerAlarm(reminder);
                    }
                }
            });

            if (stateChanged) {
                // Filter out triggered reminders from active list
                this.app.state.reminders = this.app.state.reminders.filter(r => !r.triggered);
                this.app.saveState();
                this.render();
                this.app.updateDashboardStats();
            }
        }, 3000); // Check once every 3 seconds
    }

    triggerAlarm(reminder) {
        // 1. Browser Native Notification
        if (window.Notification && Notification.permission === 'granted') {
            new Notification('Aether Study Alarm!', {
                body: `Time to start: "${reminder.title}"`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3277/3277413.png'
            });
        }

        // 2. Play Alarm Sound
        this.playAlarmSound();

        // 3. Show UI Alarm Modal
        if (this.modalText) {
            this.modalText.textContent = `It is time for your scheduled study session:\n"${reminder.title}"`;
        }
        if (this.modalOverlay) {
            this.modalOverlay.style.display = 'flex';
        }
    }

    dismissAlarm() {
        if (this.modalOverlay) {
            this.modalOverlay.style.display = 'none';
        }
        this.stopAlarmSound();
    }

    playAlarmSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this.audioContext;
            if (ctx.state === 'suspended') ctx.resume();

            const now = ctx.currentTime;
            
            // Stop any leftover alarm sound
            this.stopAlarmSound();

            // Setup a repeating double chime ring using oscillators
            const playChimeRing = (startTime) => {
                // High bell sound chord
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(587.33, startTime); // D5
                
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, startTime); // A5

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

                osc1.start(startTime);
                osc2.start(startTime);

                osc1.stop(startTime + 1.0);
                osc2.stop(startTime + 1.0);

                this.alarmOscillators.push(osc1, osc2);
            };

            // Play alarm chime sequences for 15 seconds or until dismissed
            for (let i = 0; i < 10; i++) {
                playChimeRing(now + (i * 1.5));
                playChimeRing(now + (i * 1.5) + 0.25); // double ring effect
            }

        } catch (e) {
            console.error('Failed to play alarm audio:', e);
        }
    }

    stopAlarmSound() {
        if (this.alarmOscillators && this.alarmOscillators.length > 0) {
            this.alarmOscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch(e) {}
            });
            this.alarmOscillators = [];
        }
    }
}

// Make globally available
window.RemindersModule = RemindersModule;
