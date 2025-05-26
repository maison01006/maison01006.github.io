import {
  getItem,
  initDB,
  getItemsByDate,
  addItem,
  updateItem,
  STORES,
} from "./db.js";

// DOM 요소
const goalTitle = document.querySelector(".goal-title");
const goalDescription = document.querySelector(".goal-description");
const currentJaju = document.querySelector(".current-jaju");
const requiredJaju = document.querySelector(".required-jaju");
const progressDots = document.querySelector(".progress-dots");
const todoList = document.getElementById("todoList");
const addTodoButton = document.querySelector(".add-todo-button");
const addTodoModal = document.getElementById("addTodoModal");
const addTodoForm = document.getElementById("addTodoForm");
const rewardTitle = document.querySelector(".reward-title");
const rewardDescription = document.querySelector(".reward-description");
const rewardButton = document.querySelector(".reward-button");
const emotionButtons = document.querySelectorAll(".emotion-button");
const reflectionTextarea = document.querySelector(".reflection-input textarea");
const characterCount = document.querySelector(".character-count");
const saveReflectionButton = document.querySelector(".save-reflection-button");

// URL에서 목표 ID 가져오기
const goalId = new URLSearchParams(window.location.search).get("id");

// 오늘 날짜 가져오기
const getToday = () => new Date().toISOString().split("T")[0];

// 진행 상황 점 생성
function createProgressDots(earned, total) {
  progressDots.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const dot = document.createElement("div");
    dot.className = `progress-dot ${i < earned ? "earned" : ""}`;
    progressDots.appendChild(dot);
  }
}

// 할 일 항목 생성
function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = `todo-item ${todo.completed ? "completed" : ""}`;
  li.dataset.id = todo.id;

  li.innerHTML = `
    <div class="todo-checkbox ${todo.completed ? "checked" : ""}"></div>
    <span class="todo-text">${todo.title}</span>
    <div class="todo-actions">
      <button class="todo-action-button edit">
        <span class="icon">✏️</span>
      </button>
      <button class="todo-action-button delete">
        <span class="icon">🗑️</span>
      </button>
    </div>
  `;

  // 체크박스 클릭 이벤트
  const checkbox = li.querySelector(".todo-checkbox");
  checkbox.addEventListener("click", async () => {
    todo.completed = !todo.completed;
    await updateItem(STORES.TODOS, todo);
    await updateUI();
  });

  // 수정 버튼 클릭 이벤트
  const editButton = li.querySelector(".edit");
  editButton.addEventListener("click", () => {
    // TODO: 수정 모달 구현
  });

  // 삭제 버튼 클릭 이벤트
  const deleteButton = li.querySelector(".delete");
  deleteButton.addEventListener("click", async () => {
    if (confirm("이 할 일을 삭제하시겠습니까?")) {
      await updateItem(STORES.TODOS, { ...todo, deleted: true });
      await updateUI();
    }
  });

  return li;
}

// UI 업데이트
async function updateUI() {
  const today = getToday();
  const goal = await getItem(STORES.GOALS, goalId);
  const todos = await getItemsByDate(STORES.TODOS, today);
  const progress = await getItemsByDate(STORES.PROGRESS, today);
  const reward = await getItem(STORES.REWARDS, goal.rewardId);

  // 목표 정보 업데이트
  goalTitle.textContent = goal.title;
  goalDescription.textContent = goal.description;

  // 자주 진행 상황 업데이트
  const earnedJaju = progress.length > 0 ? progress[0].amount : 0;
  currentJaju.textContent = earnedJaju;
  requiredJaju.textContent = reward.cost;
  createProgressDots(earnedJaju, reward.cost);

  // 보상 정보 업데이트
  rewardTitle.textContent = reward.title;
  rewardDescription.textContent = reward.description;
  rewardButton.querySelector(".jaju-cost").textContent = `${reward.cost} 🪙`;
  rewardButton.disabled = earnedJaju < reward.cost;

  // 할 일 목록 업데이트
  todoList.innerHTML = "";
  const goalTodos = todos.filter(
    (todo) => todo.goalId === goalId && !todo.deleted
  );
  goalTodos.forEach((todo) => {
    todoList.appendChild(createTodoItem(todo));
  });
}

// 할 일 추가 모달
addTodoButton.addEventListener("click", () => {
  addTodoModal.classList.add("show");
});

addTodoModal.querySelector(".cancel-button").addEventListener("click", () => {
  addTodoModal.classList.remove("show");
  addTodoForm.reset();
});

addTodoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = addTodoForm.querySelector("input");
  const title = input.value.trim();

  if (title) {
    const todo = {
      title,
      goalId,
      date: getToday(),
      completed: false,
      deleted: false,
    };

    await addItem(STORES.TODOS, todo);
    addTodoModal.classList.remove("show");
    addTodoForm.reset();
    await updateUI();
  }
});

// 감정 선택
emotionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    emotionButtons.forEach((btn) => btn.classList.remove("selected"));
    button.classList.add("selected");
  });
});

// 글자 수 카운트
reflectionTextarea.addEventListener("input", () => {
  const count = reflectionTextarea.value.length;
  characterCount.textContent = `${count}/200`;
});

// 회고 저장
saveReflectionButton.addEventListener("click", async () => {
  const selectedEmotion = document.querySelector(".emotion-button.selected");
  if (!selectedEmotion) {
    alert("오늘의 감정을 선택해주세요.");
    return;
  }

  const reflection = {
    goalId,
    date: getToday(),
    emotion: selectedEmotion.dataset.emotion,
    text: reflectionTextarea.value.trim(),
  };

  await addItem(STORES.REFLECTIONS, reflection);
  alert("회고가 저장되었습니다.");
});

// 초기화
async function init() {
  await initDB();
  await updateUI();
}

init();
