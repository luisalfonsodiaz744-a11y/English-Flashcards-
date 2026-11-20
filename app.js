const STORAGE_KEY = "english_vocab_trainer_v1";

const DEFAULT_CARDS = [
  {
    id: "1",
    term: "Debug",
    definition: "To find and fix errors or bugs in software code.",
    example: "I spent twenty minutes debugging the login form.",
    category: "Programming",
    mastered: false,
  },
  {
    id: "2",
    term: "Breakpoint",
    definition: "An intentional stopping point in code used during debugging.",
    example: "Set a breakpoint before the loop to inspect the variables.",
    category: "Programming",
    mastered: false,
  },
  {
    id: "3",
    term: "Deployment",
    definition: "Releasing an application so users can access it.",
    example: "Our team scheduled the deployment for Friday morning.",
    category: "Software & Tools",
    mastered: false,
  },
  {
    id: "4",
    term: "Repository",
    definition: "A central storage location for project code and version history.",
    example: "Push your changes to the main repository.",
    category: "Software & Tools",
    mastered: false,
  },
  {
    id: "5",
    term: "Trade-off",
    definition: "A balance between two options where gaining one means losing something else.",
    example: "Simplicity versus flexibility is a common design trade-off.",
    category: "Daily & Work",
    mastered: false,
  },
  {
    id: "6",
    term: "Walkthrough",
    definition: "A step-by-step live explanation or demonstration of how something works.",
    example: "I prepared a three-minute walkthrough of the app.",
    category: "Daily & Work",
    mastered: false,
  },
];

let state = loadState();
let studyIndex = 0;
let answerVisible = false;
let currentQuizCard = null;
let quizAnswered = false;

// DOM references
const masteredCountEl = document.getElementById("masteredCount");
const totalCountEl = document.getElementById("totalCount");
const accuracyRateEl = document.getElementById("accuracyRate");
const statusBannerEl = document.getElementById("statusBanner");

const studyModeBtn = document.getElementById("studyModeBtn");
const quizModeBtn = document.getElementById("quizModeBtn");
const categoryFilterEl = document.getElementById("categoryFilter");

const studySection = document.getElementById("studySection");
const quizSection = document.getElementById("quizSection");

const cardCategoryEl = document.getElementById("cardCategory");
const cardMasteredBadgeEl = document.getElementById("cardMasteredBadge");
const cardTermEl = document.getElementById("cardTerm");
const cardExampleEl = document.getElementById("cardExample");
const cardAnswerBoxEl = document.getElementById("cardAnswerBox");
const cardDefinitionEl = document.getElementById("cardDefinition");

const flipBtn = document.getElementById("flipBtn");
const markMasteredBtn = document.getElementById("markMasteredBtn");
const nextCardBtn = document.getElementById("nextCardBtn");

const quizCategoryEl = document.getElementById("quizCategory");
const quizTermEl = document.getElementById("quizTerm");
const quizOptionsEl = document.getElementById("quizOptions");
const quizFeedbackEl = document.getElementById("quizFeedback");
const nextQuizBtn = document.getElementById("nextQuizBtn");

const addCardForm = document.getElementById("addCardForm");
const termInput = document.getElementById("termInput");
const definitionInput = document.getElementById("definitionInput");
const exampleInput = document.getElementById("exampleInput");
const categorySelect = document.getElementById("categorySelect");
const formErrorEl = document.getElementById("formError");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    cards: DEFAULT_CARDS,
    quizAttempts: 0,
    quizCorrect: 0,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getFilteredCards() {
  const selectedCategory = categoryFilterEl.value;
  if (selectedCategory === "All") {
    return state.cards;
  }
  return state.cards.filter((card) => card.category === selectedCategory);
}

function updateStats() {
  const total = state.cards.length;
  const mastered = state.cards.filter((card) => card.mastered).length;
  const accuracy =
    state.quizAttempts === 0
      ? 0
      : Math.round((state.quizCorrect / state.quizAttempts) * 100);

  masteredCountEl.textContent = String(mastered);
  totalCountEl.textContent = String(total);
  accuracyRateEl.textContent = `${accuracy}%`;

  if (total > 0 && mastered === total) {
    statusBannerEl.textContent = "Awesome! You have mastered every flashcard in your deck.";
  } else if (accuracy >= 75 && state.quizAttempts >= 3) {
    statusBannerEl.textContent = "Strong quiz accuracy! Keep reviewing tricky terms.";
  } else {
    statusBannerEl.textContent = "Practice in Study Mode or test yourself in Quiz Mode.";
  }
}

function renderStudyCard() {
  const pool = getFilteredCards();
  answerVisible = false;
  cardAnswerBoxEl.classList.add("hidden");
  flipBtn.textContent = "Show Definition";

  if (pool.length === 0) {
    cardCategoryEl.textContent = categoryFilterEl.value;
    cardMasteredBadgeEl.textContent = "";
    cardTermEl.textContent = "No cards in this category yet";
    cardExampleEl.textContent = "Add a custom card below or switch categories.";
    cardDefinitionEl.textContent = "";
    markMasteredBtn.disabled = true;
    nextCardBtn.disabled = true;
    return;
  }

  markMasteredBtn.disabled = false;
  nextCardBtn.disabled = false;
  studyIndex = studyIndex % pool.length;
  const card = pool[studyIndex];

  cardCategoryEl.textContent = card.category;
  cardMasteredBadgeEl.textContent = card.mastered ? "Mastered" : "Learning";
  cardMasteredBadgeEl.classList.toggle("is-mastered", card.mastered);
  cardTermEl.textContent = card.term;
  cardExampleEl.textContent = card.example ? `"${card.example}"` : "";
  cardDefinitionEl.textContent = card.definition;
  markMasteredBtn.textContent = card.mastered ? "Unmark Mastered" : "Mark as Mastered";
}

function setupQuizQuestion() {
  const pool = getFilteredCards();
  quizFeedbackEl.textContent = "";
  quizAnswered = false;
  quizOptionsEl.innerHTML = "";

  if (state.cards.length < 2 || pool.length === 0) {
    quizCategoryEl.textContent = "Quiz";
    quizTermEl.textContent = "Add at least 2 cards to start a quiz.";
    nextQuizBtn.disabled = true;
    return;
  }

  nextQuizBtn.disabled = false;
  currentQuizCard = pool[Math.floor(Math.random() * pool.length)];

  const distractors = state.cards
    .filter((c) => c.id !== currentQuizCard.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const choices = [currentQuizCard, ...distractors].sort(() => Math.random() - 0.5);

  quizCategoryEl.textContent = currentQuizCard.category;
  quizTermEl.textContent = currentQuizCard.term;

  choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = choice.definition;
    btn.addEventListener("click", () => handleQuizAnswer(btn, choice.id === currentQuizCard.id));
    quizOptionsEl.appendChild(btn);
  });
}

function handleQuizAnswer(clickedBtn, isCorrect) {
  if (quizAnswered) return;
  quizAnswered = true;
  state.quizAttempts += 1;

  const allButtons = quizOptionsEl.querySelectorAll(".option-btn");
  allButtons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === currentQuizCard.definition) {
      btn.classList.add("correct");
    }
  });

  if (isCorrect) {
    state.quizCorrect += 1;
    quizFeedbackEl.textContent = "Correct! Great job.";
    quizFeedbackEl.style.color = "var(--success)";
  } else {
    clickedBtn.classList.add("wrong");
    quizFeedbackEl.textContent = `Not quite. Correct meaning: ${currentQuizCard.definition}`;
    quizFeedbackEl.style.color = "var(--danger)";
  }

  saveState();
  updateStats();
}

function switchMode(mode) {
  const isStudy = mode === "study";
  studySection.classList.toggle("hidden", !isStudy);
  quizSection.classList.toggle("hidden", isStudy);

  studyModeBtn.classList.toggle("primary", isStudy);
  studyModeBtn.classList.toggle("secondary", !isStudy);
  quizModeBtn.classList.toggle("primary", !isStudy);
  quizModeBtn.classList.toggle("secondary", isStudy);

  if (isStudy) {
    renderStudyCard();
  } else {
    setupQuizQuestion();
  }
}

// Event listeners
studyModeBtn.addEventListener("click", () => switchMode("study"));
quizModeBtn.addEventListener("click", () => switchMode("quiz"));

categoryFilterEl.addEventListener("change", () => {
  studyIndex = 0;
  renderStudyCard();
  if (!quizSection.classList.contains("hidden")) {
    setupQuizQuestion();
  }
});

flipBtn.addEventListener("click", () => {
  answerVisible = !answerVisible;
  cardAnswerBoxEl.classList.toggle("hidden", !answerVisible);
  flipBtn.textContent = answerVisible ? "Hide Definition" : "Show Definition";
});

markMasteredBtn.addEventListener("click", () => {
  const pool = getFilteredCards();
  if (pool.length === 0) return;
  const current = pool[studyIndex % pool.length];
  current.mastered = !current.mastered;
  saveState();
  updateStats();
  renderStudyCard();
});

nextCardBtn.addEventListener("click", () => {
  const pool = getFilteredCards();
  if (pool.length === 0) return;
  studyIndex = (studyIndex + 1) % pool.length;
  renderStudyCard();
});

nextQuizBtn.addEventListener("click", setupQuizQuestion);

addCardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const term = termInput.value.trim();
  const definition = definitionInput.value.trim();
  const example = exampleInput.value.trim();

  if (term.length < 2) {
    formErrorEl.textContent = "Please enter an English term (at least 2 characters).";
    return;
  }

  if (definition.length < 5) {
    formErrorEl.textContent = "Please enter a clear definition (at least 5 characters).";
    return;
  }

  formErrorEl.textContent = "";
  state.cards.unshift({
    id: String(Date.now()),
    term,
    definition,
    example,
    category: categorySelect.value,
    mastered: false,
  });

  saveState();
  addCardForm.reset();
  studyIndex = 0;
  updateStats();
  renderStudyCard();
});

// Initialize app
updateStats();
renderStudyCard();