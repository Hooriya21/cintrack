/**
 * Quiz Module - Manages quiz creation, database, interactive quiz play, and history review.
 */
class QuizModule {
    constructor(appInstance) {
        this.app = appInstance;
        
        // Active play state
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.selectedAnswerIndex = null;
        this.userAnswers = []; // Store chosen indices
        
        // Sub-tabs
        this.subTabs = document.querySelectorAll('[data-quiz-sub]');
        this.panels = {
            list: document.getElementById('quiz-panel-list'),
            create: document.getElementById('quiz-panel-create')
        };
        
        // DOM binds - List view
        this.listContainer = document.getElementById('quiz-list-container');
        
        // DOM binds - Creator view
        this.creatorForm = document.getElementById('quiz-creator-form');
        this.questionsCreatorContainer = document.getElementById('quiz-questions-creator-container');
        this.addQuestionBtn = document.getElementById('quiz-add-question-btn');
        
        // DOM binds - Player view
        this.playerContainer = document.getElementById('quiz-player-container');
        this.playerTitle = document.getElementById('player-quiz-title');
        this.playerCurrentIndex = document.getElementById('player-current-index');
        this.playerTotalQuestions = document.getElementById('player-total-questions');
        this.playerProgressFill = document.getElementById('player-progress-fill');
        this.playerQuestionText = document.getElementById('player-question-text');
        this.playerOptionsContainer = document.getElementById('player-options-container');
        this.playerNextBtn = document.getElementById('player-next-btn');
        this.playerPrevBtn = document.getElementById('player-prev-btn');
        this.playerCloseBtn = document.getElementById('player-close-btn');
        
        // DOM binds - Results view
        this.resultContainer = document.getElementById('quiz-result-container');
        this.resultPercent = document.getElementById('result-score-percent');
        this.resultFraction = document.getElementById('result-score-fraction');
        this.resultMessage = document.getElementById('result-message');
        this.resultReviewList = document.getElementById('result-review-list');
        this.resultRetryBtn = document.getElementById('result-retry-btn');
        this.resultCloseBtn = document.getElementById('result-close-btn');
        
        // Question counters
        this.creatorQuestionIndex = 0;
    }

    init() {
        // 1. Setup Sub Navigation
        this.subTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.subTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const activeSub = tab.dataset.quizSub;
                Object.keys(this.panels).forEach(key => {
                    this.panels[key].classList.remove('active');
                });
                this.panels[activeSub].classList.add('active');

                if (activeSub === 'create') {
                    this.resetCreator();
                } else {
                    this.renderList();
                }
            });
        });

        // 2. Setup Creator Form
        if (this.addQuestionBtn) {
            this.addQuestionBtn.addEventListener('click', () => this.addQuestionField());
        }
        if (this.creatorForm) {
            this.creatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateQuiz();
            });
        }

        // 3. Setup Player controls
        if (this.playerCloseBtn) {
            this.playerCloseBtn.addEventListener('click', () => this.exitQuiz());
        }
        if (this.playerNextBtn) {
            this.playerNextBtn.addEventListener('click', () => this.nextQuestion());
        }
        if (this.playerPrevBtn) {
            this.playerPrevBtn.addEventListener('click', () => this.prevQuestion());
        }
        
        // 4. Setup Results controls
        if (this.resultCloseBtn) {
            this.resultCloseBtn.addEventListener('click', () => this.closeResults());
        }
        if (this.resultRetryBtn) {
            this.resultRetryBtn.addEventListener('click', () => this.retryQuiz());
        }

        // Ensure default 10 question quiz exists in state
        this.ensureDefaultQuiz();
        this.renderList();
    }

    ensureDefaultQuiz() {
        const defaultQuizId = 'default_learning_science';
        const hasDefault = this.app.state.quizzes.some(q => q.id === defaultQuizId);
        
        if (!hasDefault) {
            const defaultQuiz = {
                id: defaultQuizId,
                title: "Learning Science & Study Skills",
                isDefault: true,
                questions: [
                    {
                        text: "What is the Leitner system primarily used for?",
                        options: [
                            "Active Recall & Spaced Repetition",
                            "Speed reading techniques",
                            "Mind mapping course outlines",
                            "Verbatim transcription note taking"
                        ],
                        correctIndex: 0
                    },
                    {
                        text: "According to learning science, \"cramming\" information the night before an exam is more effective than spaced study over weeks.",
                        options: [
                            "True",
                            "False"
                        ],
                        correctIndex: 1 // False
                    },
                    {
                        text: "The \"Pomodoro Technique\" recommends focusing for how many minutes by default?",
                        options: [
                            "15 minutes",
                            "25 minutes",
                            "45 minutes",
                            "60 minutes"
                        ],
                        correctIndex: 1
                    },
                    {
                        text: "Which of the following describes the \"Feynman Technique\"?",
                        options: [
                            "Re-reading lecture slides five times consecutively",
                            "Highlighting every key vocabulary sentence in neon yellow",
                            "Explaining a complex concept in simple terms as if teaching a child",
                            "Drawing elaborate colored drawings of biology systems"
                        ],
                        correctIndex: 2
                    },
                    {
                        text: "What does the term \"Active Recall\" mean in studying?",
                        options: [
                            "Passively scanning pages of a textbook or notebook",
                            "Re-writing lecture slides word-for-word repeatedly",
                            "Retrieving information from your mind without looking at cues",
                            "Listening to recorded lectures while you are sleeping"
                        ],
                        correctIndex: 2
                    },
                    {
                        text: "The hippocampus is the region of the human brain most associated with forming new memory pathways.",
                        options: [
                            "True",
                            "False"
                        ],
                        correctIndex: 0 // True
                    },
                    {
                        text: "Which popular study strategy has been scientifically shown to have the lowest utility for long-term learning?",
                        options: [
                            "Summarization of paragraphs",
                            "Practice testing and mock exams",
                            "Distributed practice schedules",
                            "Re-reading textbooks and highlighting notes"
                        ],
                        correctIndex: 3
                    },
                    {
                        text: "Interleaving study involves switching between different topics or subjects rather than focusing on a single topic for hours.",
                        options: [
                            "True",
                            "False"
                        ],
                        correctIndex: 0 // True
                    },
                    {
                        text: "What is a \"Retrieval Practice\"?",
                        options: [
                            "Searching on Google for immediate quiz answers",
                            "Testing yourself to actively recall core concepts",
                            "Finding lost note sheets in folders",
                            "Watching visual instructional videos"
                        ],
                        correctIndex: 1
                    },
                    {
                        text: "To convert transient short-term memories into stable long-term memory structures, which biological process must occur?",
                        options: [
                            "Memory Consolidation",
                            "Sensory Transduction",
                            "Adaptation",
                            "Habituation"
                        ],
                        correctIndex: 0
                    }
                ]
            };
            this.app.state.quizzes.unshift(defaultQuiz);
            this.app.saveState();
        }
    }

    renderList() {
        if (!this.listContainer) return;

        const quizzes = this.app.state.quizzes;

        this.listContainer.innerHTML = quizzes.map(quiz => {
            const isDefault = quiz.isDefault ? '<span class="todo-badge badge-low" style="margin-left: 8px;">Featured</span>' : '';
            return `
                <div class="quiz-card" data-id="${quiz.id}">
                    <div class="quiz-card-info">
                        <h3>${this.app.escapeHtml(quiz.title)} ${isDefault}</h3>
                        <p>Total Questions: ${quiz.questions.length}</p>
                    </div>
                    <div class="quiz-card-actions">
                        <button class="btn btn-sm btn-primary btn-play-quiz">Start Play</button>
                        ${quiz.isDefault ? '' : '<button class="btn btn-sm btn-outline btn-delete-quiz">Delete</button>'}
                    </div>
                </div>
            `;
        }).join('');

        // Bind Play Button
        this.listContainer.querySelectorAll('.btn-play-quiz').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.quiz-card').dataset.id;
                this.startQuiz(id);
            });
        });

        // Bind Delete Button
        this.listContainer.querySelectorAll('.btn-delete-quiz').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.quiz-card').dataset.id;
                this.deleteQuiz(id);
            });
        });

        // Update dashboard recommendation title
        const recoTitle = document.getElementById('reco-title');
        const recoBtn = document.getElementById('dash-reco-btn');
        if (recoTitle && quizzes.length > 0) {
            recoTitle.textContent = `Practice: ${quizzes[0].title}`;
            if (recoBtn) {
                recoBtn.onclick = () => {
                    this.app.switchTab('quiz');
                    this.startQuiz(quizzes[0].id);
                };
            }
        }
    }

    deleteQuiz(quizId) {
        if (confirm('Are you sure you want to delete this quiz?')) {
            const index = this.app.state.quizzes.findIndex(q => q.id === quizId);
            if (index !== -1) {
                this.app.state.quizzes.splice(index, 1);
                this.app.saveState();
                this.renderList();
                this.app.showToast('Quiz deleted.', 'warning');
            }
        }
    }

    resetCreator() {
        if (this.questionsCreatorContainer) {
            this.questionsCreatorContainer.innerHTML = '';
            this.creatorQuestionIndex = 0;
            const titleInput = document.getElementById('quiz-title');
            if (titleInput) titleInput.value = '';
            this.addQuestionField(); // Start with 1 question field
        }
    }

    addQuestionField() {
        const qIndex = this.creatorQuestionIndex++;
        const questionCard = document.createElement('div');
        questionCard.className = 'question-builder-card';
        questionCard.dataset.index = qIndex;
        
        questionCard.innerHTML = `
            <button type="button" class="btn-remove-question" aria-label="Remove question">&times;</button>
            <div class="form-group" style="margin-bottom: 12px;">
                <label>Question ${qIndex + 1}</label>
                <input type="text" class="question-text-input" placeholder="Enter question..." required>
            </div>
            
            <div class="form-group" style="margin-bottom: 12px;">
                <label>Question Type</label>
                <select class="question-type-select">
                    <option value="mc">Multiple Choice (4 Options)</option>
                    <option value="tf">True / False</option>
                </select>
            </div>

            <div class="options-container">
                <div class="options-builder-grid">
                    <div class="option-input-wrapper">
                        <span>A</span>
                        <input type="text" class="opt-input" placeholder="Option A" required>
                    </div>
                    <div class="option-input-wrapper">
                        <span>B</span>
                        <input type="text" class="opt-input" placeholder="Option B" required>
                    </div>
                    <div class="option-input-wrapper opt-c-d">
                        <span>C</span>
                        <input type="text" class="opt-input opt-mc" placeholder="Option C" required>
                    </div>
                    <div class="option-input-wrapper opt-c-d">
                        <span>D</span>
                        <input type="text" class="opt-input opt-mc" placeholder="Option D" required>
                    </div>
                </div>

                <div class="form-group" style="margin-top: 14px; margin-bottom: 0;">
                    <label>Correct Answer</label>
                    <select class="correct-answer-select">
                        <option value="0">Option A</option>
                        <option value="1">Option B</option>
                        <option value="2" class="opt-mc-select">Option C</option>
                        <option value="3" class="opt-mc-select">Option D</option>
                    </select>
                </div>
            </div>
        `;

        this.questionsCreatorContainer.appendChild(questionCard);

        // Bind delete question button
        questionCard.querySelector('.btn-remove-question').addEventListener('click', () => {
            if (this.questionsCreatorContainer.children.length > 1) {
                questionCard.remove();
                this.reindexCreatorQuestions();
            } else {
                this.app.showToast('Your quiz must have at least 1 question!', 'warning');
            }
        });

        // Bind question type switch
        const typeSelect = questionCard.querySelector('.question-type-select');
        const optCd = questionCard.querySelectorAll('.opt-c-d');
        const mcInputs = questionCard.querySelectorAll('.opt-mc');
        const mcSelectOpts = questionCard.querySelectorAll('.opt-mc-select');
        const correctSelect = questionCard.querySelector('.correct-answer-select');

        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'tf') {
                // Hide C & D options, change A/B text to True/False
                optCd.forEach(el => el.style.display = 'none');
                mcInputs.forEach(el => el.removeAttribute('required'));
                mcSelectOpts.forEach(el => el.style.display = 'none');
                
                // Prepopulate True/False inputs and lock them
                const aInput = questionCard.querySelectorAll('.opt-input')[0];
                const bInput = questionCard.querySelectorAll('.opt-input')[1];
                aInput.value = "True";
                bInput.value = "False";
                aInput.readOnly = true;
                bInput.readOnly = true;
                
                if (correctSelect.value > 1) {
                    correctSelect.value = "0";
                }
            } else {
                // Restore Multiple Choice
                optCd.forEach(el => el.style.display = 'flex');
                mcInputs.forEach(el => el.setAttribute('required', ''));
                mcSelectOpts.forEach(el => el.style.display = 'block');
                
                const aInput = questionCard.querySelectorAll('.opt-input')[0];
                const bInput = questionCard.querySelectorAll('.opt-input')[1];
                aInput.value = "";
                bInput.value = "";
                aInput.readOnly = false;
                bInput.readOnly = false;
            }
        });
    }

    reindexCreatorQuestions() {
        const questionCards = this.questionsCreatorContainer.querySelectorAll('.question-builder-card');
        questionCards.forEach((card, index) => {
            card.querySelector('label').textContent = `Question ${index + 1}`;
        });
        this.creatorQuestionIndex = questionCards.length;
    }

    handleCreateQuiz() {
        const titleInput = document.getElementById('quiz-title');
        const questionCards = this.questionsCreatorContainer.querySelectorAll('.question-builder-card');
        
        if (!titleInput.value.trim()) return;

        const quizQuestions = [];
        
        for (let card of questionCards) {
            const textInput = card.querySelector('.question-text-input');
            const typeSelect = card.querySelector('.question-type-select');
            const optInputs = card.querySelectorAll('.opt-input');
            const correctSelect = card.querySelector('.correct-answer-select');
            
            const options = [];
            const optionLimit = typeSelect.value === 'tf' ? 2 : 4;
            
            for (let i = 0; i < optionLimit; i++) {
                options.push(optInputs[i].value.trim());
            }

            quizQuestions.push({
                text: textInput.value.trim(),
                options: options,
                correctIndex: parseInt(correctSelect.value)
            });
        }

        const newQuiz = {
            id: 'quiz_' + Date.now(),
            title: titleInput.value.trim(),
            questions: quizQuestions,
            isDefault: false
        };

        this.app.state.quizzes.push(newQuiz);
        this.app.saveState();
        
        this.app.showToast('Quiz created successfully!', 'success');
        
        // Switch back to list
        const listTab = document.querySelector('[data-quiz-sub="list"]');
        if (listTab) listTab.click();
    }

    /* PLAYER LOGIC */
    startQuiz(quizId) {
        const quiz = this.app.state.quizzes.find(q => q.id === quizId);
        if (!quiz || quiz.questions.length === 0) return;

        this.currentQuiz = quiz;
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(quiz.questions.length).fill(null);
        this.selectedAnswerIndex = null;
        
        if (this.playerTitle) this.playerTitle.textContent = quiz.title;
        if (this.playerTotalQuestions) this.playerTotalQuestions.textContent = quiz.questions.length;
        
        this.playerContainer.style.display = 'flex';
        
        this.loadQuestion();
    }

    loadQuestion() {
        if (!this.currentQuiz) return;
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        if (this.playerCurrentIndex) this.playerCurrentIndex.textContent = this.currentQuestionIndex + 1;
        if (this.playerQuestionText) this.playerQuestionText.textContent = question.text;
        
        // Calculate progress percentage
        const progressPercent = ((this.currentQuestionIndex + 1) / this.currentQuiz.questions.length) * 100;
        if (this.playerProgressFill) this.playerProgressFill.style.width = `${progressPercent}%`;

        // Render option buttons
        if (this.playerOptionsContainer) {
            this.playerOptionsContainer.innerHTML = '';
            
            question.options.forEach((option, index) => {
                const optLetter = String.fromCharCode(65 + index); // A, B, C, D
                const button = document.createElement('button');
                button.className = 'option-btn';
                if (this.userAnswers[this.currentQuestionIndex] === index) {
                    button.classList.add('selected');
                }
                button.dataset.index = index;
                button.innerHTML = `
                    <span class="option-letter">${optLetter}</span>
                    <span>${this.app.escapeHtml(option)}</span>
                `;
                
                button.addEventListener('click', () => {
                    this.selectOption(index);
                });
                
                this.playerOptionsContainer.appendChild(button);
            });
        }

        // Toggle back buttons visibility
        if (this.playerPrevBtn) {
            this.playerPrevBtn.style.visibility = this.currentQuestionIndex > 0 ? 'visible' : 'hidden';
        }

        // Handle Next/Finish button label and state
        if (this.playerNextBtn) {
            const isLast = this.currentQuestionIndex === this.currentQuiz.questions.length - 1;
            this.playerNextBtn.textContent = isLast ? 'Finish Quiz' : 'Next Question';
            this.playerNextBtn.disabled = this.userAnswers[this.currentQuestionIndex] === null;
        }
    }

    selectOption(index) {
        this.selectedAnswerIndex = index;
        this.userAnswers[this.currentQuestionIndex] = index;
        
        // Highlight active DOM elements
        const buttons = this.playerOptionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            if (parseInt(btn.dataset.index) === index) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        // Enable next button
        if (this.playerNextBtn) {
            this.playerNextBtn.disabled = false;
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadQuestion();
        }
    }

    nextQuestion() {
        if (!this.currentQuiz) return;

        const isLast = this.currentQuestionIndex === this.currentQuiz.questions.length - 1;
        
        if (isLast) {
            this.evaluateQuiz();
        } else {
            this.currentQuestionIndex++;
            this.loadQuestion();
        }
    }

    evaluateQuiz() {
        const quiz = this.currentQuiz;
        let score = 0;
        
        const reviewData = quiz.questions.map((question, qIdx) => {
            const userChoiceIdx = this.userAnswers[qIdx];
            const isCorrect = userChoiceIdx === question.correctIndex;
            if (isCorrect) score++;

            return {
                questionText: question.text,
                userChoice: question.options[userChoiceIdx] || "Skipped",
                correctChoice: question.options[question.correctIndex],
                isCorrect: isCorrect
            };
        });

        const percent = Math.round((score / quiz.questions.length) * 100);
        
        // Hide player view, display results
        this.playerContainer.style.display = 'none';
        this.resultContainer.style.display = 'flex';

        // Set scores
        if (this.resultPercent) this.resultPercent.textContent = `${percent}%`;
        if (this.resultFraction) this.resultFraction.textContent = `${score}/${quiz.questions.length}`;

        // Set message
        let feedbackMsg = "Keep Practicing!";
        if (percent === 100) feedbackMsg = "Perfect Score! 🌟";
        else if (percent >= 80) feedbackMsg = "Outstanding Job! 🔥";
        else if (percent >= 50) feedbackMsg = "Good Attempt! 👍";
        
        if (this.resultMessage) this.resultMessage.textContent = feedbackMsg;

        // Render review items
        if (this.resultReviewList) {
            this.resultReviewList.innerHTML = reviewData.map((item, idx) => `
                <div class="review-item">
                    <div class="review-question">${idx + 1}. ${this.app.escapeHtml(item.questionText)}</div>
                    <div class="review-ans-row">
                        <span class="review-correct">✓ Correct: ${this.app.escapeHtml(item.correctChoice)}</span>
                        ${item.isCorrect 
                            ? `<span class="review-your matched">✓ Your answer matched</span>` 
                            : `<span class="review-your">✗ You answered: ${this.app.escapeHtml(item.userChoice)}</span>`}
                    </div>
                </div>
            `).join('');
        }

        // Save stats to app
        this.app.state.totalQuizzesTaken++;
        this.app.saveState();
        this.app.updateDashboardStats();
    }

    retryQuiz() {
        this.resultContainer.style.display = 'none';
        if (this.currentQuiz) {
            this.startQuiz(this.currentQuiz.id);
        }
    }

    exitQuiz() {
        if (confirm('Exit quiz? Current progress will be lost.')) {
            this.playerContainer.style.display = 'none';
            this.currentQuiz = null;
        }
    }

    closeResults() {
        this.resultContainer.style.display = 'none';
        this.currentQuiz = null;
    }
}

// Make globally available
window.QuizModule = QuizModule;
