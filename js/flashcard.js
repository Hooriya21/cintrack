/**
 * Flashcard Module - Manages study decks, custom flashcards, 3D card flip rendering, and study progress.
 */
class FlashcardModule {
    constructor(appInstance) {
        this.app = appInstance;
        
        this.activeDeckId = null;
        this.studySession = null; // { deck, cards, currentIndex, isFlipped }
        
        // DOM bindings - Sidebar / Deck Creator
        this.decksContainer = document.getElementById('decks-container');
        this.deckCreatorForm = document.getElementById('deck-creator-form');
        this.deckNameInput = document.getElementById('deck-name-input');
        
        // DOM bindings - Deck Details & Editor
        this.deckDetailsPanel = document.getElementById('deck-details-panel');
        this.selectedDeckName = document.getElementById('selected-deck-name');
        this.deckActionsButtons = document.getElementById('deck-actions-buttons');
        this.deckEmptyState = document.getElementById('deck-empty-state');
        this.deckActiveEditor = document.getElementById('deck-active-editor');
        this.activeDeckCount = document.getElementById('active-deck-count');
        this.deckCardsList = document.getElementById('deck-cards-list');
        
        // DOM bindings - Flashcard Creator Form
        this.flashcardCreatorForm = document.getElementById('flashcard-creator-form');
        this.cardFrontInput = document.getElementById('card-front');
        this.cardBackInput = document.getElementById('card-back');
        
        // DOM bindings - Study Runner view
        this.studyRunnerPanel = document.getElementById('study-runner-panel');
        this.studyRunnerDeckTitle = document.getElementById('study-runner-deck-title');
        this.studyCurrentIndex = document.getElementById('study-current-index');
        this.studyTotalCards = document.getElementById('study-total-cards');
        this.studyFlashcardElement = document.getElementById('study-flashcard-element');
        this.studyCardFrontText = document.getElementById('study-card-front-text');
        this.studyCardBackText = document.getElementById('study-card-back-text');
        this.studyInstructionText = document.getElementById('study-instruction-text');
        this.studyEvaluationActions = document.getElementById('study-evaluation-actions');
        
        // Study actions
        this.studyCloseBtn = document.getElementById('study-close-btn');
        this.studyDeckBtn = document.getElementById('study-deck-btn');
        this.deleteDeckBtn = document.getElementById('delete-deck-btn');
    }

    init() {
        // Setup deck creator
        if (this.deckCreatorForm) {
            this.deckCreatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateDeck();
            });
        }

        // Setup flashcard creator
        if (this.flashcardCreatorForm) {
            this.flashcardCreatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateCard();
            });
        }

        // Study controls
        if (this.studyDeckBtn) {
            this.studyDeckBtn.addEventListener('click', () => this.startStudySession());
        }
        if (this.deleteDeckBtn) {
            this.deleteDeckBtn.addEventListener('click', () => this.deleteDeck());
        }
        if (this.studyCloseBtn) {
            this.studyCloseBtn.addEventListener('click', () => this.exitStudySession());
        }

        // 3D card click to flip
        if (this.studyFlashcardElement) {
            this.studyFlashcardElement.addEventListener('click', () => this.flipCard());
        }

        // Recall rating actions
        const recallButtons = document.querySelectorAll('.btn-recall');
        recallButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = e.currentTarget.dataset.recall;
                this.submitRecallRating(rating);
            });
        });

        // Ensure default deck is loaded
        this.ensureDefaultDeck();
        this.renderDecks();
    }

    ensureDefaultDeck() {
        const defaultDeckId = 'deck_memory_strategies';
        const hasDefault = this.app.state.flashcardDecks.some(d => d.id === defaultDeckId);

        if (!hasDefault) {
            const defaultDeck = {
                id: defaultDeckId,
                name: "Memory Strategies",
                cards: [
                    {
                        id: 'card_1',
                        front: "Spaced Repetition",
                        back: "Studying information at increasing intervals over time to reinforce long-term memory storage."
                    },
                    {
                        id: 'card_2',
                        front: "Active Recall",
                        back: "Testing your mind to retrieve answers directly, strengthening neural connections compared to passive review."
                    },
                    {
                        id: 'card_3',
                        front: "Leitner System",
                        back: "A flashcard learning technique where cards are sorted into boxes based on how well you know each card."
                    },
                    {
                        id: 'card_4',
                        front: "Elaborative Rehearsal",
                        back: "Connecting new study information to existing long-term knowledge to make it more meaningful."
                    }
                ]
            };
            this.app.state.flashcardDecks.unshift(defaultDeck);
            this.app.saveState();
        }
    }

    renderDecks() {
        if (!this.decksContainer) return;

        const decks = this.app.state.flashcardDecks;

        if (decks.length === 0) {
            this.decksContainer.innerHTML = '<div class="empty-state-mini">No decks created yet.</div>';
            return;
        }

        this.decksContainer.innerHTML = decks.map(deck => `
            <div class="deck-item ${this.activeDeckId === deck.id ? 'active' : ''}" data-id="${deck.id}">
                <span>📂 ${this.app.escapeHtml(deck.name)}</span>
                <span class="deck-card-count">${deck.cards.length} cards</span>
            </div>
        `).join('');

        // Bind clicks
        this.decksContainer.querySelectorAll('.deck-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectDeck(item.dataset.id);
            });
        });
    }

    handleCreateDeck() {
        const name = this.deckNameInput.value.trim();
        if (!name) return;

        const newDeck = {
            id: 'deck_' + Date.now(),
            name: name,
            cards: []
        };

        this.app.state.flashcardDecks.push(newDeck);
        this.app.saveState();
        this.deckNameInput.value = '';
        
        this.renderDecks();
        this.selectDeck(newDeck.id);
        this.app.showToast('Flashcard deck created!', 'success');
    }

    selectDeck(deckId) {
        this.activeDeckId = deckId;
        this.renderDecks();

        const deck = this.app.state.flashcardDecks.find(d => d.id === deckId);
        if (!deck) return;

        // Update Details view
        if (this.selectedDeckName) this.selectedDeckName.textContent = deck.name;
        if (this.deckActionsButtons) this.deckActionsButtons.style.display = 'flex';
        if (this.deckEmptyState) this.deckEmptyState.style.display = 'none';
        if (this.deckActiveEditor) this.deckActiveEditor.style.display = 'block';
        if (this.activeDeckCount) this.activeDeckCount.textContent = deck.cards.length;

        // Render card items list
        this.renderCardsList(deck);
    }

    deleteDeck() {
        if (!this.activeDeckId) return;
        
        const deck = this.app.state.flashcardDecks.find(d => d.id === this.activeDeckId);
        if (!deck) return;

        if (confirm(`Delete the entire deck "${deck.name}"? This action cannot be undone.`)) {
            const index = this.app.state.flashcardDecks.findIndex(d => d.id === this.activeDeckId);
            if (index !== -1) {
                this.app.state.flashcardDecks.splice(index, 1);
                this.app.saveState();
                
                this.activeDeckId = null;
                this.renderDecks();

                // Reset view
                if (this.selectedDeckName) this.selectedDeckName.textContent = 'Select a Deck';
                if (this.deckActionsButtons) this.deckActionsButtons.style.display = 'none';
                if (this.deckEmptyState) this.deckEmptyState.style.display = 'flex';
                if (this.deckActiveEditor) this.deckActiveEditor.style.display = 'none';
                
                this.app.showToast('Deck deleted.', 'warning');
            }
        }
    }

    handleCreateCard() {
        if (!this.activeDeckId) return;

        const front = this.cardFrontInput.value.trim();
        const back = this.cardBackInput.value.trim();

        if (!front || !back) return;

        const deck = this.app.state.flashcardDecks.find(d => d.id === this.activeDeckId);
        if (deck) {
            const newCard = {
                id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                front: front,
                back: back
            };
            deck.cards.push(newCard);
            this.app.saveState();

            this.cardFrontInput.value = '';
            this.cardBackInput.value = '';
            
            if (this.activeDeckCount) this.activeDeckCount.textContent = deck.cards.length;
            this.renderCardsList(deck);
            this.renderDecks(); // update count in sidebar
            this.app.showToast('Card added!', 'success');
        }
    }

    deleteCard(cardId) {
        const deck = this.app.state.flashcardDecks.find(d => d.id === this.activeDeckId);
        if (deck) {
            const index = deck.cards.findIndex(c => c.id === cardId);
            if (index !== -1) {
                deck.cards.splice(index, 1);
                this.app.saveState();
                
                if (this.activeDeckCount) this.activeDeckCount.textContent = deck.cards.length;
                this.renderCardsList(deck);
                this.renderDecks();
                this.app.showToast('Card deleted.', 'warning');
            }
        }
    }

    renderCardsList(deck) {
        if (!this.deckCardsList) return;

        if (deck.cards.length === 0) {
            this.deckCardsList.innerHTML = '<div class="empty-state-mini">This deck has no cards. Add one above!</div>';
            return;
        }

        this.deckCardsList.innerHTML = deck.cards.map(card => `
            <div class="deck-card-item" data-id="${card.id}">
                <div class="deck-card-texts">
                    <span class="card-front-txt">${this.app.escapeHtml(card.front)}</span>
                    <span class="card-back-txt">${this.app.escapeHtml(card.back)}</span>
                </div>
                <button class="btn-delete-card" aria-label="Delete card">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `).join('');

        // Bind delete action
        this.deckCardsList.querySelectorAll('.btn-delete-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.deck-card-item').dataset.id;
                this.deleteCard(id);
            });
        });
    }

    /* STUDY RUNNER SESSION LOGIC */
    startStudySession() {
        const deck = this.app.state.flashcardDecks.find(d => d.id === this.activeDeckId);
        if (!deck || deck.cards.length === 0) {
            this.app.showToast('Add some cards to this deck first!', 'warning');
            return;
        }

        // Shuffle copy of cards
        const shuffledCards = [...deck.cards].sort(() => Math.random() - 0.5);

        this.studySession = {
            deck: deck,
            cards: shuffledCards,
            currentIndex: 0,
            isFlipped: false
        };

        // UI view swap
        if (this.deckDetailsPanel) this.deckDetailsPanel.style.display = 'none';
        if (this.studyRunnerPanel) this.studyRunnerPanel.style.display = 'block';

        if (this.studyRunnerDeckTitle) this.studyRunnerDeckTitle.textContent = `Studying: ${deck.name}`;
        if (this.studyTotalCards) this.studyTotalCards.textContent = shuffledCards.length;

        this.loadStudyCard();
    }

    loadStudyCard() {
        if (!this.studySession) return;
        
        const card = this.studySession.cards[this.studySession.currentIndex];
        this.studySession.isFlipped = false;

        // Reset DOM card transforms
        if (this.studyFlashcardElement) {
            this.studyFlashcardElement.classList.remove('flipped');
        }

        if (this.studyCurrentIndex) this.studyCurrentIndex.textContent = this.studySession.currentIndex + 1;
        if (this.studyCardFrontText) this.studyCardFrontText.textContent = card.front;
        if (this.studyCardBackText) this.studyCardBackText.textContent = card.back;
        
        // Hide evaluation buttons, reset instructions
        if (this.studyInstructionText) {
            this.studyInstructionText.textContent = "Click the card above to reveal the definition, then rate your recall.";
        }
        if (this.studyEvaluationActions) {
            this.studyEvaluationActions.style.display = 'none';
        }
    }

    flipCard() {
        if (!this.studySession) return;
        
        this.studySession.isFlipped = !this.studySession.isFlipped;
        
        if (this.studyFlashcardElement) {
            this.studyFlashcardElement.classList.toggle('flipped', this.studySession.isFlipped);
        }

        if (this.studySession.isFlipped) {
            if (this.studyInstructionText) {
                this.studyInstructionText.textContent = "How well did you recall this concept?";
            }
            if (this.studyEvaluationActions) {
                this.studyEvaluationActions.style.display = 'grid';
            }
        } else {
            if (this.studyInstructionText) {
                this.studyInstructionText.textContent = "Click the card above to reveal the definition.";
            }
            if (this.studyEvaluationActions) {
                this.studyEvaluationActions.style.display = 'none';
            }
        }
    }

    submitRecallRating(rating) {
        if (!this.studySession) return;

        // Move to next card or complete
        const session = this.studySession;
        
        // We can use rating in logs or stats if desired, e.g. for Leitner system
        // For simplicity of study progress, we proceed forward.
        if (session.currentIndex < session.cards.length - 1) {
            session.currentIndex++;
            this.loadStudyCard();
        } else {
            // Completed study session!
            this.app.showToast('Excellent! Deck completed!', 'success');
            
            // Increment dashboard stats
            this.app.state.totalFlashcardReviews += session.cards.length;
            this.app.saveState();
            this.app.updateDashboardStats();

            this.exitStudySession();
        }
    }

    exitStudySession() {
        this.studySession = null;
        if (this.deckDetailsPanel) this.deckDetailsPanel.style.display = 'block';
        if (this.studyRunnerPanel) this.studyRunnerPanel.style.display = 'none';
        
        // Re-render deck lists
        if (this.activeDeckId) {
            const deck = this.app.state.flashcardDecks.find(d => d.id === this.activeDeckId);
            if (deck) this.renderCardsList(deck);
        }
    }
}

// Make globally available
window.FlashcardModule = FlashcardModule;
