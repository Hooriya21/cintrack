/**
 * Pomodoro Module - Manages study focus timers, break timers, sound alerts, and logs.
 */
class PomodoroModule {
    constructor(appInstance) {
        this.app = appInstance;
        
        // Timer settings default (minutes)
        this.durations = {
            pomodoro: 25,
            short: 5,
            long: 15
        };
        
        this.currentMode = 'pomodoro'; // 'pomodoro', 'short', 'long'
        this.timerState = 'idle';      // 'idle', 'running', 'paused'
        
        this.timeLeft = 0;             // in seconds
        this.totalDuration = 0;        // in seconds
        this.timerInterval = null;
        this.audioContext = null;
        
        // DOM bindings
        this.countdownEl = document.getElementById('pomo-countdown');
        this.statusTextEl = document.getElementById('pomo-status-text');
        this.toggleBtn = document.getElementById('pomo-toggle');
        this.toggleBtnText = document.getElementById('pomo-toggle-text');
        this.resetBtn = document.getElementById('pomo-reset');
        this.progressRing = document.getElementById('timer-ring');
        
        this.dashTimeEl = document.getElementById('dash-pomo-time');
        this.dashStatusEl = document.getElementById('dash-pomo-status');
        this.dashStartBtn = document.getElementById('dash-pomo-start');
        
        this.logsContainer = document.getElementById('pomo-logs-container');
        this.soundSelect = document.getElementById('pomo-sound-select');
        
        // Settings inputs
        this.workInput = document.getElementById('pomo-work-input');
        this.shortInput = document.getElementById('pomo-short-input');
        this.longInput = document.getElementById('pomo-long-input');
        this.saveSettingsBtn = document.getElementById('pomo-save-settings');
        
        this.ringCircumference = 597; // 2 * Math.PI * 95
    }

    init() {
        // Load custom settings from state if they exist
        if (this.app.state.pomodoroSettings) {
            this.durations = { ...this.app.state.pomodoroSettings };
            if (this.workInput) this.workInput.value = this.durations.pomodoro;
            if (this.shortInput) this.shortInput.value = this.durations.short;
            if (this.longInput) this.longInput.value = this.durations.long;
        }

        // Set initial timer values
        this.setMode(this.currentMode);

        // Bind main screen buttons
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleTimer());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetTimer());
        }

        // Bind mode select buttons
        const modeButtons = document.querySelectorAll('.timer-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.timerState === 'running' && !confirm('A session is running. Do you want to switch modes and discard current progress?')) {
                    return;
                }
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setMode(btn.dataset.mode);
            });
        });

        // Bind Settings Apply button
        if (this.saveSettingsBtn) {
            this.saveSettingsBtn.addEventListener('click', () => this.applyCustomTimes());
        }

        // Bind Dashboard widget buttons
        if (this.dashStartBtn) {
            this.dashStartBtn.addEventListener('click', () => {
                this.toggleTimer();
            });
        }
        const dashViewBtn = document.getElementById('dash-pomo-view-btn');
        if (dashViewBtn) {
            dashViewBtn.addEventListener('click', () => {
                this.app.switchTab('pomodoro');
            });
        }

        this.renderLogs();
    }

    setMode(mode) {
        this.currentMode = mode;
        this.stopTimerInterval();
        this.timerState = 'idle';
        
        // Calculate duration in seconds
        const mins = this.durations[mode];
        this.totalDuration = mins * 60;
        this.timeLeft = this.totalDuration;
        
        // Update texts
        let statusTitle = "Ready to Focus";
        if (mode === 'short') statusTitle = "Short Break Time";
        if (mode === 'long') statusTitle = "Long Break Time";
        
        if (this.statusTextEl) this.statusTextEl.textContent = statusTitle;
        if (this.dashStatusEl) this.dashStatusEl.textContent = mode;
        
        if (this.toggleBtnText) this.toggleBtnText.textContent = "Start Session";
        if (this.dashStartBtn) this.dashStartBtn.textContent = "Start";
        
        this.updateRing(0);
        this.updateDisplay();
    }

    applyCustomTimes() {
        const work = parseInt(this.workInput.value);
        const short = parseInt(this.shortInput.value);
        const long = parseInt(this.longInput.value);

        if (isNaN(work) || work < 1 || isNaN(short) || short < 1 || isNaN(long) || long < 1) {
            this.app.showToast('Please enter valid times above 0 minutes.', 'danger');
            return;
        }

        this.durations = { pomodoro: work, short: short, long: long };
        this.app.state.pomodoroSettings = { ...this.durations };
        this.app.saveState();
        
        this.app.showToast('Timer intervals updated!', 'success');
        this.setMode(this.currentMode);
    }

    toggleTimer() {
        // Initialize AudioContext on user interaction
        this.initAudioContext();

        if (this.timerState === 'idle' || this.timerState === 'paused') {
            this.startTimer();
        } else {
            this.pauseTimer();
        }
    }

    startTimer() {
        this.timerState = 'running';
        if (this.toggleBtnText) this.toggleBtnText.textContent = "Pause Session";
        if (this.dashStartBtn) this.dashStartBtn.textContent = "Pause";
        
        let statusTitle = "Focusing...";
        if (this.currentMode === 'short') statusTitle = "Resting...";
        if (this.currentMode === 'long') statusTitle = "Relaxing...";
        
        if (this.statusTextEl) this.statusTextEl.textContent = statusTitle;
        if (this.dashStatusEl) this.dashStatusEl.textContent = `${this.currentMode} (running)`;

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            const progress = (this.totalDuration - this.timeLeft) / this.totalDuration;
            this.updateRing(progress);

            if (this.timeLeft <= 0) {
                this.timerCompleted();
            }
        }, 1000);
    }

    pauseTimer() {
        this.timerState = 'paused';
        this.stopTimerInterval();
        if (this.toggleBtnText) this.toggleBtnText.textContent = "Resume Session";
        if (this.dashStartBtn) this.dashStartBtn.textContent = "Resume";
        if (this.statusTextEl) this.statusTextEl.textContent = "Session Paused";
        if (this.dashStatusEl) this.dashStatusEl.textContent = `${this.currentMode} (paused)`;
    }

    resetTimer() {
        this.setMode(this.currentMode);
        this.app.showToast('Timer reset.', 'warning');
    }

    stopTimerInterval() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (this.countdownEl) this.countdownEl.textContent = timeStr;
        if (this.dashTimeEl) this.dashTimeEl.textContent = timeStr;
    }

    updateRing(progress) {
        if (this.progressRing) {
            const offset = this.ringCircumference - (progress * this.ringCircumference);
            this.progressRing.style.strokeDashoffset = offset;
        }
    }

    timerCompleted() {
        this.stopTimerInterval();
        this.playAlertSound();
        
        // Notify browser if supported
        this.triggerBrowserNotification();

        const completedMode = this.currentMode;
        
        if (completedMode === 'pomodoro') {
            // Log study duration
            const focusMinutes = this.durations.pomodoro;
            this.app.state.totalFocusMinutes += focusMinutes;
            
            // Add focus session log
            const now = new Date();
            const logText = `Focus Session completed at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${focusMinutes}m)`;
            this.app.state.pomodoroLogs.unshift(logText);
            this.app.state.pomodoroLogs = this.app.state.pomodoroLogs.slice(0, 10); // Keep last 10 logs
            
            this.app.saveState();
            this.app.updateDashboardStats();
            this.renderLogs();
            
            this.app.showToast('Excellent work! Time for a short break.', 'success');
            this.setMode('short');
        } else {
            this.app.showToast('Break completed! Back to focus.', 'success');
            this.setMode('pomodoro');
        }
    }

    renderLogs() {
        if (!this.logsContainer) return;
        
        const logs = this.app.state.pomodoroLogs;
        
        if (logs.length === 0) {
            this.logsContainer.innerHTML = `
                <div class="empty-state-mini">No sessions completed yet. Let's do this!</div>
            `;
        } else {
            this.logsContainer.innerHTML = logs.map(log => `
                <div class="log-item">
                    <span>${this.app.escapeHtml(log)}</span>
                    <span class="log-time">✓ Done</span>
                </div>
            `).join('');
        }
    }

    /* Web Audio Synthesizer */
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playAlertSound() {
        if (!this.audioContext) return;
        const soundType = this.soundSelect ? this.soundSelect.value : 'bell';
        
        if (soundType === 'none') return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        if (soundType === 'beep') {
            // Short digital beep
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.frequency.setValueAtTime(880, now); // A5
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        } 
        else if (soundType === 'bell') {
            // Crystal clear chime bell chord
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
            freqs.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                gainNode.gain.setValueAtTime(0, now);
                // Stagger starting values slightly for ring effect
                gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05 + (index * 0.02));
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 - (index * 0.1));
                
                osc.start(now);
                osc.stop(now + 2.0);
            });
        } 
        else if (soundType === 'zen') {
            // Low meditative gong
            const oscBase = ctx.createOscillator();
            const oscOvertone1 = ctx.createOscillator();
            const oscOvertone2 = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscBase.type = 'sine';
            oscBase.frequency.value = 110; // Low A2
            
            oscOvertone1.type = 'triangle';
            oscOvertone1.frequency.value = 220; // A3
            
            oscOvertone2.type = 'sine';
            oscOvertone2.frequency.value = 330; // E4
            
            oscBase.connect(gainNode);
            oscOvertone1.connect(gainNode);
            oscOvertone2.connect(gainNode);
            
            gainNode.connect(ctx.destination);
            
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
            
            oscBase.start(now);
            oscOvertone1.start(now);
            oscOvertone2.start(now);
            
            oscBase.stop(now + 3.2);
            oscOvertone1.stop(now + 3.2);
            oscOvertone2.stop(now + 3.2);
        }
    }

    triggerBrowserNotification() {
        if (window.Notification && Notification.permission === 'granted') {
            const title = this.currentMode === 'pomodoro' ? 'Break Time!' : 'Focus Session Time!';
            const options = {
                body: this.currentMode === 'pomodoro' 
                    ? 'Great focus session! Let\'s rest your eyes for a few minutes.' 
                    : 'Break is over. Ready to concentrate again?',
                icon: 'https://cdn-icons-png.flaticon.com/512/3277/3277413.png'
            };
            new Notification(title, options);
        }
    }
}

// Make globally available
window.PomodoroModule = PomodoroModule;
