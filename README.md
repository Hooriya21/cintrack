# 🌌 Aether Study Planner

A premium, highly interactive, and beautiful single-page productivity suite for students and scholars. Aether combines core learning tools (Tasks, Pomodoro, Quizzes, Flashcards, and Reminders) into a seamless, glassmorphic layout.

---

## ✨ Features

### 1. 📊 Unified Dashboard
* **Dynamic Greetings & Time**: Updates based on the time of day (Morning/Afternoon/Evening) and local date.
* **Quick Stats**: Track task completion percentages, accumulated focus minutes, and quizzes taken.
* **Urgent Task List**: Shows top 3 pending high-priority tasks.
* **Reminder Alert Feed**: Displays next scheduled study alarms.
* **Practice Prompts**: Inline recommendations pointing you to custom flashcard decks or featured quizzes.

### 2. 📝 Task Planner
* **Categorization**: Tag tasks as 📚 *Study*, 📝 *Assignment*, 🔄 *Revision*, or 🚀 *Project*.
* **Prioritization**: Set *Low*, *Medium*, or *High* priority levels with reactive visual badges.
* **Progress Meter**: Automatic calculations update the completion progress bar.
* **Smart Sorting**: Organizes items dynamically (incomplete items with highest priority and closest due dates float to the top).

### 3. ⏱️ Pomodoro Focus Timer
* **Classic Intervals**: Switch between 25-minute Focus, 5-minute Short Break, and 15-minute Long Break intervals.
* **Dynamic Ring Progress**: Animated circular SVG stroke tracking session countdown.
* **Custom Configs**: Adjust work/break durations directly via the sidebar settings panel.
* **Web Audio Synthesizer**: Produces clean completion tones (crystal chimes, bells, zen gongs) built directly inside browser audio scripts, requiring zero external audio file loads.

### 4. 🧠 Interactive Quiz Zone
* **Featured Quiz**: Comes preloaded with a 10-question **Learning Science & Study Skills** quiz checking memory retrieval concepts.
* **Interactive Player**: Shows question progress with a progress bar, choice selection cards, and instant grading.
* **Review Mode**: Compiles correctness diagnostics, comparing your answers side-by-side with the correct options.
* **Quiz Creator**: Design custom quizzes (multiple choice or true/false) with dynamic question builders.

### 5. 📇 3D Flashcards
* **Deck Folders**: Separate terms by subjects or subjects.
* **3D Flip Card**: Interactive visual card flips 180 degrees in a 3D scene on click.
* **Recall Rating**: Score your memory using Leitner-like buttons (*Easy*, *Medium*, *Hard*) to schedule review progress.
* **Interactive Lists**: View and manage all cards inside selected decks with quick-delete buttons.

### 6. ⏰ Alarms & Reminders
* **Schedule Builder**: Pick future dates and times for exams, lectures, or study sessions.
* **Desktop Notifications**: Requests native browser API permissions to send alert popups even when working in other tabs.
* **Modal Alarm Overlay**: A glassmorphic overlay pops up with custom alarms when reminders are triggered.

---

## 🛠️ Technology Stack
* **Markup**: Semantic HTML5 structures.
* **Styling**: Vanilla CSS3 custom variables (HSL theme tokens, 3D transform animations, glassmorphic filters).
* **Programming**: Modular ES6 JavaScript, state management via browser `localStorage` persistence.
* **Audio**: Native Web Audio API synthesizer.

---

## 🚀 Running Locally

No installation, Node modules, or development servers are required! Because Aether is built with clean, client-side vanilla technologies:

1. Clone or download the repository.
2. Locate the `index.html` file.
3. Double-click `index.html` or drag it into any modern web browser (Chrome, Firefox, Safari, Edge).
4. **Desktop Notifications**: If prompted, click **Allow** on the permission toast to enable background desktop alerts.

---

## 📦 Pushing to a Remote Server

To host your project on GitHub:

```bash
# 1. Open your terminal and navigate to the project directory
cd "c:\Users\Asus\OneDrive\Desktop\cintrack"

# 2. Add your GitHub remote link
git remote add origin https://github.com/Hooriya21/YOUR-REPOS-NAME.git

# 3. Push the local branch to your repository
git push -u origin main
```

---

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
