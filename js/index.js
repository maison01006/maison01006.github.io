import {
  addItem,
  initDB,
  getItemsByDate,
  getItemsByTitle,
  getItemsByAll,
  checkTodayProgress,
  updateItem,
  STORES,
  getDB,
  deleteItem,
  deleteGoalAndRelatedData,
} from "./db.js";

let db = null;
// DOM 요소
const coinCount = document.getElementById("coinCount");
const goalCards = document.getElementById("goalCards");
const todayCoinCount = document.getElementById("todayCoinCount");
const addGoalButton = document.getElementById("addGoalButton");

// 모달 관련 요소
const modal = document.getElementById("createGoalModal");
const closeButton = modal.querySelector(".close-button");
const createGoalForm = document.getElementById("createGoalForm");

// 모달 열기
addGoalButton.addEventListener("click", () => {
  console.log("모달 열기");
  modal.classList.add("show");
});

// 모달 닫기
closeButton.addEventListener("click", () => {
  modal.classList.remove("show");
  createGoalForm.reset();
});

// 모달 외부 클릭 시 닫기
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
    createGoalForm.reset();
  }
});

// 폼 제출 처리
createGoalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const goalData = {
    title: document.getElementById("goalTitle").value,
    description: document.getElementById("goalDescription").value,
    date: getToday(),
  };

  try {
    // 목표 저장
    await addItem(STORES.GOALS, goalData);

    // 모달 닫기 및 폼 초기화
    modal.classList.remove("show");
    createGoalForm.reset();

    // 목표 카드 목록 새로고침
    await renderGoalCards();

    window.toast.show("목표가 생성되었습니다!", "success");
  } catch (error) {
    window.toast.show("목표 생성에 실패했습니다.", "error");
  }
});

// 오늘 날짜 가져오기
const getToday = () => {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  return koreaTime.toISOString().split("T")[0];
};

// 코인 애니메이션 생성
function createCoinAnimation(x, y) {
  const coin = document.createElement("div");
  coin.className = "coin-animation";
  coin.textContent = "🪙";
  coin.style.left = `${x}px`;
  coin.style.top = `${y}px`;
  document.body.appendChild(coin);

  // 애니메이션 종료 후 요소 제거
  coin.addEventListener("animationend", () => {
    coin.remove();
  });
}

// 축하 모달 표시 함수 (메시지 파라미터 추가)
function showCongratsModal(message = null) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "congrats-modal";
  modal.innerHTML = `
    <h2>🎉 고생했어요! 🎉</h2>
    <p>${
      message
        ? message
        : "모든 할 일을 완료했어요.<br>축하합니다!<br>🪙 1 자주를 획득했습니다.<br>내일도 화이팅!"
    }</p>
    <button>확인</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // 확인 버튼 클릭 시 모달 닫기
  modal.querySelector("button").addEventListener("click", () => {
    overlay.remove();
  });
}

// 모든 todo가 완료되었는지 확인하는 함수
async function areAllTodosCompleted(today, goalId) {
  const todos = await getItemsByDate(STORES.TODOS, today);
  const goalTodos = todos.filter((todo) => todo.goalId === String(goalId));
  return goalTodos.length > 0 && goalTodos.every((todo) => todo.completed);
}

// 코인 획득 처리 함수 (목표별로 호출, 하루 1번만 지급, 모달은 항상 띄움)
async function handleGoalCompleted(goalTitle = null, goalId = null) {
  const today = new Date().toISOString().split("T")[0];
  // 목표별로 오늘 이미 코인을 획득했는지 확인
  let hasProgress = false;
  if (goalId) {
    const progresses = await getItemsByDate(STORES.PROGRESS, today);
    hasProgress = progresses.some((p) => String(p.goalId) === String(goalId));
  } else {
    hasProgress = await checkTodayProgress();
  }
  if (!hasProgress) {
    // 코인 획득 (목표별로 goalId 저장)
    await addItem(STORES.PROGRESS, {
      date: today,
      amount: 1,
      goalId: goalId ? String(goalId) : undefined,
    });
    // UI 업데이트
    await updateTodayProgress();
    await updateProgress();
    // 축하 모달과 폭죽 효과 표시
    showCongratsModal(
      goalTitle
        ? `목표 <b>"${goalTitle}"</b>의 모든 할 일을 완료했어요!<br>축하합니다!<br>🪙 1 자주를 획득했습니다.<br>내일도 화이팅!`
        : undefined
    );
  } else {
    // 이미 코인 획득한 경우에도 모달은 뜨게 함
    showCongratsModal(
      goalTitle
        ? `목표 <b>"${goalTitle}"</b>의 모든 할 일을 완료했어요!<br>자주는 이미 획득했어요!<br>내일도 화이팅!`
        : "모든 할 일을 완료했어요!<br>자주는 이미 획득했어요!<br>내일도 화이팅!"
    );
  }
}

// 진행률 업데이트
async function updateProgress() {
  const todos = await getItemsByDate(STORES.TODOS, getToday());
  const goals = await getItemsByAll(STORES.GOALS);
  // 전체 진행률 계산
  const totalTodos = todos.length;
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const totalProgress =
    totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  // 전체 진행률 업데이트
  document.querySelector(".progress-percentage").textContent = `${Math.round(
    totalProgress
  )}%`;
  document.querySelector(
    ".total-progress .progress-fill"
  ).style.width = `${totalProgress}%`;

  // 목표별 진행률 업데이트
  const goalProgressList = document.querySelector(".goal-progress-list");
  goalProgressList.innerHTML = "";

  goals.forEach((goal) => {
    const goalTodos = todos.filter((todo) => todo.goalId === String(goal.id));
    const goalCompletedTodos = goalTodos.filter(
      (todo) => todo.completed
    ).length;
    const goalProgress =
      goalTodos.length > 0 ? (goalCompletedTodos / goalTodos.length) * 100 : 0;

    const goalProgressItem = document.createElement("div");
    goalProgressItem.className = "goal-progress-item";

    goalProgressItem.innerHTML = `
      <div class="goal-progress-header">
        <span class="goal-progress-name">${goal.title}</span>
        <span class="goal-progress-count">${goalCompletedTodos}/${goalTodos.length}</span>
      </div>
      <div class="goal-progress-bar">
        <div class="goal-progress-fill" style="width: ${goalProgress}%"></div>
      </div>
    `;

    goalProgressList.appendChild(goalProgressItem);
  });
}

// 목표 카드 목록 렌더링
async function renderGoalCards(selectedGoalId = null) {
  const today = new Date().toISOString().split("T")[0];
  const goals = await getItemsByAll(STORES.GOALS);
  const todos = await getItemsByDate(STORES.TODOS, today);
  const rewards = await getItemsByDate(STORES.REWARDS, today);
  const progress = await getItemsByDate(STORES.PROGRESS, today);

  const goalCards = document.getElementById("goalCards");
  const goalTags = document.getElementById("goalTags");
  goalCards.innerHTML = "";
  goalTags.innerHTML = "";

  // 태그 렌더링
  goals.forEach((goal, idx) => {
    const tag = document.createElement("button");
    tag.className = "goal-tag" + (selectedGoalId === goal.id ? " active" : "");
    // 5글자 초과 시 ... 처리, 전체 제목은 title 속성으로 제공
    const displayTitle =
      goal.title.length > 5 ? goal.title.slice(0, 5) + "..." : goal.title;
    tag.textContent = displayTitle;
    tag.title = goal.title;
    tag.addEventListener("click", () => {
      // 해당 카드로 스크롤
      const card = goalCards.querySelector(`[data-goal-id='${goal.id}']`);
      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
        // 태그 active 처리
        renderGoalCards(goal.id);
      }
    });
    goalTags.appendChild(tag);
  });

  for (const goal of goals) {
    const goalTodos = todos
      .filter((todo) => todo.goalId === String(goal.id))
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return new Date(a.date) - new Date(b.date);
      });

    const goalProgress = progress.filter((p) => p.goalId === goal.id);
    const totalCoins = goalProgress.reduce((sum, p) => sum + p.amount, 0);

    const card = document.createElement("div");
    card.className = "goal-card";
    card.dataset.goalId = goal.id;

    card.innerHTML = `
      <div class="goal-card-content">
        <div class="goal-header">
          <div class="goal-title-container">
            <h3 class="goal-title" contenteditable="false">${goal.title}</h3>
          </div>
          <div class="goal-actions">
            <button class="kebab-button">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
          <p class="goal-progress">${
            goalTodos.filter((todo) => todo.completed).length
          }/${goalTodos.length} 완료</p>
        <div class="add-todo-item">
          <input type="text" class="todo-input" placeholder="할 일 추가하기">
          <button class="add-todo-button">+</button>
        </div>
        <div class="goal-todos"></div> <!-- todo 목록은 비워둠 -->
      </div>
    `;

    // 케밥 메뉴 클릭 이벤트
    const kebabButton = card.querySelector(".kebab-button");
    kebabButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const modal = document.createElement("div");
      modal.className = "action-modal";
      modal.innerHTML = `
        <div class="action-modal-content">
          <button class="edit-goal-button">
            <i class="fas fa-edit"></i>
            <span>수정</span>
          </button>
          <button class="delete-goal-button">
            <i class="fas fa-trash"></i>
            <span>삭제</span>
          </button>
        </div>
      `;

      // 모달 위치 설정
      const rect = kebabButton.getBoundingClientRect();
      modal.style.top = `${rect.bottom + window.scrollY}px`;
      modal.style.right = `${window.innerWidth - rect.right}px`;

      // 모달 닫기 이벤트
      const closeModal = () => {
        modal.remove();
        document.removeEventListener("click", closeModal);
      };
      document.addEventListener("click", closeModal);

      // 수정 버튼 클릭 이벤트
      const editButton = modal.querySelector(".edit-goal-button");
      editButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        const titleElement = card.querySelector(".goal-title");
        titleElement.contentEditable = "true";
        titleElement.focus();
        closeModal();
      });

      // 삭제 버튼 클릭 이벤트
      const deleteButton = modal.querySelector(".delete-goal-button");
      deleteButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (
          confirm(
            "이 목표를 삭제하시겠습니까? 관련된 모든 할 일, 보상, 기록도 함께 삭제됩니다."
          )
        ) {
          try {
            await deleteGoalAndRelatedData(goal.id);
            await renderGoalCards();
            await updateTodayProgress();
            window.toast.show("목표가 삭제되었습니다.", "success");
          } catch (error) {
            window.toast.show("목표 삭제에 실패했습니다.", "error");
          }
        }
        closeModal();
      });

      document.body.appendChild(modal);
    });

    // 목표 수정 이벤트
    const titleElement = card.querySelector(".goal-title");
    titleElement.addEventListener("blur", async () => {
      if (titleElement.contentEditable === "true") {
        titleElement.contentEditable = "false";
        try {
          goal.title = titleElement.textContent.trim();
          await updateItem(STORES.GOALS, goal);
          window.toast.show("목표가 수정되었습니다.", "success");
        } catch (error) {
          window.toast.show("목표 수정에 실패했습니다.", "error");
          titleElement.textContent = goal.title;
        }
      }
    });

    // 더보기 버튼 클릭 이벤트
    const viewMoreButton = card.querySelector(".view-more-button");
    if (viewMoreButton) {
      viewMoreButton.addEventListener("click", () => {
        const goalTodosContainer = card.querySelector(".view-more-container");
        const isExpanded = viewMoreButton.textContent === "접기";

        if (isExpanded) {
          // 접기: 추가된 할 일들 제거
          const todoItems = card.querySelectorAll(".todo-item[data-todo-id]");
          todoItems.forEach((todo, index) => {
            if (index >= 2) todo.remove();
          });
          viewMoreButton.textContent = "더보기";
          // 카드 높이 원래대로
          card.style.height = "";
        } else {
          // 더보기: 추가 할 일들 표시
          const additionalTodos = goalTodos
            .slice(2)
            .map(
              (todo) => `
            <div class="todo-item" data-todo-id="${todo.id}">
              <div class="todo-checkbox ${
                todo.completed ? "checked" : ""
              }"></div>
              <span class="todo-text ${todo.completed ? "completed" : ""}">${
                todo.title
              }</span>
              <button class="delete-todo-button" title="삭제">✕</button>
            </div>
          `
            )
            .join("");

          // 더보기 버튼 앞에 추가 할 일들 삽입
          goalTodosContainer.insertAdjacentHTML("beforebegin", additionalTodos);
          viewMoreButton.textContent = "접기";
          // 카드 높이 auto로
          card.style.height = "fit-content";
          // 새로 추가된 할 일들에 대한 클릭 이벤트 추가
          bindTodoItemEvents(card, goal.id, todos, goalTodos);
        }
      });
    }

    // 초기 할 일 항목 클릭 이벤트 처리
    const initialTodoItems = card.querySelectorAll(".todo-item[data-todo-id]");
    initialTodoItems.forEach((todoItem) => {
      if (!todoItem.hasEventListener) {
        todoItem.hasEventListener = true;
        todoItem.addEventListener("click", async () => {
          const todoId = parseInt(todoItem.dataset.todoId);
          const todo = todos.find((t) => {
            return t.id === todoId;
          });

          if (!todo) {
            console.error("Todo not found:", todoId);
            return;
          }

          const checkbox = todoItem.querySelector(".todo-checkbox");
          const text = todoItem.querySelector(".todo-text");

          todoItem.classList.remove("completed");
          void todoItem.offsetWidth;
          todoItem.classList.add("completed");

          todo.completed = !todo.completed;
          checkbox.classList.toggle("checked");
          text.classList.toggle("completed");

          try {
            await updateItem(STORES.TODOS, todo);
            await updateTodayProgress();
            const progressText = card.querySelector(".goal-progress");
            const completedCount = goalTodos.filter((t) => t.completed).length;
            progressText.textContent = `${completedCount}/${goalTodos.length} 완료`;
          } catch (error) {
            console.error("Todo update failed:", error);
            window.toast.show("할 일 상태 업데이트에 실패했습니다.", "error");
          }

          console.log("All todos completed for goal:", goal.id);
          const isAllCompleted = await areAllTodosCompleted(today, goal.id);
          if (isAllCompleted) {
            console.log("All todos completed for goal:", goal.id);
            await handleGoalCompleted(goal.title, goal.id);
          }
          await createCalendarGrid();
        });
      }
    });

    // 할 일 추가 기능
    const todoInput = card.querySelector(".todo-input");
    const addTodoButton = card.querySelector(".add-todo-button");

    // 카드별 입력값 복원
    const savedInput = localStorage.getItem(`todoInput_${goal.id}`);
    if (savedInput) todoInput.value = savedInput;

    // 입력값이 바뀔 때마다 저장
    todoInput.addEventListener("input", (e) => {
      localStorage.setItem(`todoInput_${goal.id}`, todoInput.value);
    });

    const addTodo = async () => {
      const title = todoInput.value.trim();
      if (!title) return;

      const todo = {
        title,
        goalId: String(goal.id),
        date: getToday(),
        completed: false,
      };

      try {
        const todoId = await addItem(STORES.TODOS, todo);
        todoInput.value = "";
        localStorage.removeItem(`todoInput_${goal.id}`); // 입력값 초기화
        // 해당 카드의 todo 목록만 갱신
        await updateGoalTodos(card, goal.id);
        await updateTodayProgress();
        await updateProgress();
        await createCalendarGrid();
      } catch (error) {
        window.toast.show("할 일 추가에 실패했습니다.", "error");
      }
    };

    addTodoButton.addEventListener("click", addTodo);
    todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addTodo();
      }
    });

    // [중요] 카드 생성 후 todo 목록 및 이벤트 바인딩 일원화
    await updateGoalTodos(card, goal.id);

    goalCards.appendChild(card);
  }

  // goalCards 가로 스크롤 스타일 적용
  goalCards.style.display = "flex";
  goalCards.style.overflowX = "auto";
  goalCards.style.scrollSnapType = "x mandatory";
  goalCards.style.gap = "16px";
  goalCards.style.padding = "16px 0 16px 8px";

  // 각 카드 스타일
  const cards = goalCards.querySelectorAll(".goal-card");
  cards.forEach((card) => {
    card.style.minWidth = "92%";
    card.style.maxWidth = "92%";
    card.style.flex = "0 0 92%";
    card.style.marginRight = "0";
    card.style.scrollSnapAlign = "center";
    card.style.transition = "box-shadow 0.2s";
  });

  // 스크롤 시 태그 활성화
  goalCards.addEventListener("scroll", () => {
    let minDiff = Infinity;
    let activeGoalId = null;
    const cards = goalCards.querySelectorAll(".goal-card");
    const goalCardsRect = goalCards.getBoundingClientRect();
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const diff = Math.abs(
        rect.left +
          rect.width / 2 -
          (goalCardsRect.left + goalCardsRect.width / 2)
      );
      if (diff < minDiff) {
        minDiff = diff;
        activeGoalId = card.dataset.goalId;
      }
    });
    // 태그 active 처리
    const tags = document.querySelectorAll(".goal-tag");
    tags.forEach((tag) => {
      if (
        tag.title ===
        goals.find((g) => String(g.id) === String(activeGoalId))?.title
      ) {
        tag.classList.add("active");
      } else {
        tag.classList.remove("active");
      }
    });
  });

  // 목표 타이틀 2줄 이상 ... 처리 (CSS 적용)
  const style = document.createElement("style");
  style.innerHTML = `
    .goal-title {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      word-break: break-all;
      max-height: 1.4em;
    }
  `;
  document.head.appendChild(style);

  // 선택된 목표가 있으면 해당 카드로 스크롤
  if (selectedGoalId) {
    const card = goalCards.querySelector(`[data-goal-id='${selectedGoalId}']`);
    if (card)
      card.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
  } else {
    // 기본 첫 번째 카드로 스크롤
    const firstCard = goalCards.querySelector(".goal-card");
    if (firstCard)
      firstCard.scrollIntoView({
        behavior: "auto",
        inline: "center",
        block: "nearest",
      });
  }
}

// 오늘의 진행 상황 업데이트
async function updateTodayProgress() {
  const today = new Date().toISOString().split("T")[0];
  const todos = await getItemsByDate(STORES.TODOS, today);
  const progress = await getItemsByDate(STORES.PROGRESS, today);
  const goals = await getItemsByAll(STORES.GOALS);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;
  const coinCount = progress.length > 0 ? progress[0].amount : 0;

  // 전체 진행률 업데이트
  const totalProgress =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  document.querySelector(".progress-percentage").textContent = `${Math.round(
    totalProgress
  )}%`;
  document.querySelector(
    ".total-progress .progress-fill"
  ).style.width = `${totalProgress}%`;

  // 목표별 진행률 업데이트
  const goalProgressList = document.querySelector(".goal-progress-list");
  goalProgressList.innerHTML = "";

  goals.forEach((goal) => {
    const goalTodos = todos.filter((todo) => todo.goalId === String(goal.id));
    const goalCompletedTodos = goalTodos.filter(
      (todo) => todo.completed
    ).length;
    const goalProgress =
      goalTodos.length > 0 ? (goalCompletedTodos / goalTodos.length) * 100 : 0;

    const goalProgressItem = document.createElement("div");
    goalProgressItem.className = "goal-progress-item";

    goalProgressItem.innerHTML = `
      <div class="goal-progress-header">
        <span class="goal-progress-name">${goal.title}</span>
        <span class="goal-progress-count">${goalCompletedTodos}/${goalTodos.length}</span>
      </div>
      <div class="goal-progress-bar">
        <div class="goal-progress-fill" style="width: ${goalProgress}%"></div>
      </div>
    `;

    goalProgressList.appendChild(goalProgressItem);
  });
}

// 7일 연속 달성 보상 체크 함수
async function check7DaysStreak() {
  const weekDates = getWeekDates();
  const goals = await getItemsByAll(STORES.GOALS);
  if (!goals.length) return false;
  for (const date of weekDates) {
    const todos = await getItemsByDate(STORES.TODOS, date);
    for (const goal of goals) {
      const goalTodos = todos.filter((todo) => todo.goalId === String(goal.id));
      if (!goalTodos.length || !goalTodos.every((todo) => todo.completed)) {
        return false;
      }
    }
  }
  return true;
}

// 7일 연속 달성 보상 이미 받았는지 체크
async function is7DaysBonusReceived() {
  const weekDates = getWeekDates();
  const lastDate = weekDates[weekDates.length - 1];
  const progress = await getItemsByDate(STORES.PROGRESS, lastDate);
  return progress.some((p) => p.type === "7days-bonus");
}

// 7일 연속 달성 보상 지급 함수
async function give7DaysBonus() {
  const weekDates = getWeekDates();
  const lastDate = weekDates[weekDates.length - 1];
  await addItem(STORES.PROGRESS, {
    date: lastDate,
    amount: 1,
    type: "7days-bonus",
  });
  await updateTodayProgress();
  await updateProgress();
  showCongratsModal(
    "7일 연속 모든 목표를 달성했어요!<br>🪙 1 자주 보너스를 획득했습니다!<br>정말 대단해요!"
  );
}

// 캘린더 카드 하단에 7일 달성 보상 버튼 추가
async function render7DaysBonusButton() {
  const calendarGrid = document.getElementById("calendarGrid");
  if (!calendarGrid) return;
  let bonusButton = document.getElementById("bonus7daysButton");
  if (!bonusButton) {
    bonusButton = document.createElement("button");
    bonusButton.id = "bonus7daysButton";
    bonusButton.className = "bonus-7days-button";
    // calendarGrid의 부모(캘린더 전체 하단)에 추가
    if (calendarGrid.parentElement) {
      calendarGrid.parentElement.appendChild(bonusButton);
    } else {
      document.body.appendChild(bonusButton);
    }
  }
  const isStreak = await check7DaysStreak();
  const isReceived = await is7DaysBonusReceived();
  if (isReceived) {
    bonusButton.textContent = "7일 달성 보상 이미 수령함";
    bonusButton.disabled = true;
  } else if (isStreak) {
    bonusButton.textContent = "7일 달성 보상 받기";
    bonusButton.disabled = false;
    bonusButton.onclick = async () => {
      await give7DaysBonus();
      await render7DaysBonusButton();
    };
  } else {
    bonusButton.textContent = "7일 연속 달성 후 보상을 받아보세요";
    bonusButton.disabled = true;
  }
}

// 커스텀 막대그래프 렌더 함수
async function renderCustomBarGraph() {
  const graphDiv = document.getElementById("calendarProgressGraph");
  if (!graphDiv) return;
  const weekDates = getWeekDates();
  const goals = await getItemsByAll(STORES.GOALS);
  let barsHtml =
    '<div style="display:flex;align-items:flex-end;height:48px;width:100%;gap:4px;">';
  for (const date of weekDates) {
    const todos = await getItemsByDate(STORES.TODOS, date);
    let total = 0,
      completed = 0;
    for (const goal of goals) {
      const goalTodos = todos.filter((todo) => todo.goalId === String(goal.id));
      total += goalTodos.length;
      completed += goalTodos.filter((t) => t.completed).length;
    }
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    barsHtml += `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
        <div style="height:${
          percent * 0.4
        }px;width:18px;background:#3b82f6;border-radius:6px 6px 0 0;position:relative;transition:height 0.3s;">
          <span style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:11px;color:#3b82f6;font-weight:bold;">${
            percent + "%"
          }</span>
        </div>
        
        <div style="height:${
          40 - percent * 0.4
        }px;width:18px;background:#e5e7eb;border-radius:6px 6px 0 0;">
        </div>
      </div>
    `;
  }
  barsHtml += "</div>";
  graphDiv.innerHTML = barsHtml;
}

// 캘린더 그리드 생성
async function createCalendarGrid() {
  const calendarGrid = document.getElementById("calendarGrid");
  const dates = getWeekDates();
  calendarGrid.innerHTML = "";

  for (const dateInfo of dates) {
    const dayData = await getDayData(dateInfo);
    const dayElement = createDayElement(dateInfo, dayData);
    calendarGrid.appendChild(dayElement);
  }
  // 7일 달성 보상 버튼 렌더
  await render7DaysBonusButton();
  // 커스텀 막대그래프 렌더
  await renderCustomBarGraph();
}

// 날짜 셀 생성
function createDayElement(dateInfo, data) {
  const date = dateInfo.date || dateInfo;
  const day = document.createElement("div");
  day.className = "calendar-day";
  const dateObj = new Date(date);
  day.innerHTML = `
    <div class="day-header">
      <span class="day-number">${dateObj.getDate()}</span>
    </div>
    <div class="day-status">
      ${
        data.todos.length > 0
          ? data.todos.every((todo) => todo.completed)
            ? '<span class="status-icon status-todo completed"><i class="fas fa-check"></i></span>'
            : '<span class="status-icon status-todo incomplete"><i class="fas fa-clock"></i></span>'
          : '<span class="status-icon status-todo empty"></span>'
      }
    </div>
  `;
  return day;
}

// 초기화 함수
async function init() {
  try {
    // DB 초기화
    await initDB();
    db = await getDB();

    // DB 초기화 후에 다른 작업 실행
    const onboarding = await getItemsByTitle(STORES.SETTINGS, "isOnboarding");
    if (!onboarding.enabled) {
      window.location.href = "/onboarding.html";
      return; // 온보딩 페이지로 이동하면 여기서 종료
    }

    const install = await getItemsByTitle(STORES.SETTINGS, "isInstall");
    if (!install.enabled) {
      showInstallPwaModal();
    }

    // UI 초기화
    await renderGoalCards();
    await updateTodayProgress();
    await updateProgress();
    await createCalendarGrid(); // 캘린더 그리드 초기화 추가
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    window.toast.show("초기화 중 오류가 발생했습니다.", "error");
  }
}

// PWA 설치 관련 변수
let deferredPrompt;
const installPwaModal = document.getElementById("installPwaModal");
const installPwaButton = document.getElementById("installPwaButton");
const closeInstallButton = installPwaModal.querySelector(
  ".close-install-button"
);
const laterButton = installPwaModal.querySelector(".later-button");

// [추가] beforeinstallprompt 이벤트 핸들러 등록
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // 기본 동작 방지
  deferredPrompt = e; // 전역 변수에 저장
  showInstallPwaModal(); // 설치 모달 표시
});

// PWA 설치 모달 표시
function showInstallPwaModal() {
  // PWA 환경(standalone, fullscreen, minimal-ui) 또는 웹뷰(android, ios)에서는 모달을 띄우지 않음
  const displayMode =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true;

  // 웹뷰 감지 (안드로이드/ios)
  const userAgent = window.navigator.userAgent || "";
  const isAndroidWebView =
    /wv|; wv\)/i.test(userAgent) ||
    (userAgent.includes("Android") &&
      userAgent.includes("Version/") &&
      !userAgent.includes("Chrome"));
  const isIOSWebView =
    (/iPhone|iPod|iPad/.test(userAgent) && !/Safari/.test(userAgent)) ||
    (window.navigator.standalone === false &&
      /iPhone|iPod|iPad/.test(userAgent));

  if (displayMode || isAndroidWebView || isIOSWebView) return;

  // iOS 기기 감지
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const installPwaBody = installPwaModal.querySelector(".install-pwa-body");
  const installPwaFooter = installPwaModal.querySelector(".install-pwa-footer");
  if (isIOS) {
    // iOS 안내문구로 내용 교체
    installPwaBody.innerHTML = `
      <p>iOS에서는 앱 설치 버튼이 제공되지 않습니다.<br>
      사파리 브라우저 하단의 <span style='font-weight:bold'>공유</span> 버튼을 누른 후<br>
      <span style='font-weight:bold'>"홈 화면에 추가"</span>를 선택해 설치할 수 있습니다.</p>
      <ul>
        <li>홈 화면에서 바로 실행</li>
        <li>더 빠른 실행 속도</li>
      </ul>
    `;
    // install-pwa-footer 숨김
    if (installPwaFooter) installPwaFooter.style.display = "none";
  } else {
    // 기본 안내문구로 복원
    installPwaBody.innerHTML = `
      <p>자주를 앱으로 설치하면 더 편리하게 이용할 수 있어요!</p>
      <ul>
        <li>홈 화면에서 바로 실행</li>
        <li>더 빠른 실행 속도</li>
      </ul>
    `;
    // install-pwa-footer 보이기
    if (installPwaFooter) installPwaFooter.style.display = "";
  }
  installPwaModal.classList.add("show");
}

// PWA 설치 모달 닫기
function hideInstallPwaModal() {
  installPwaModal.classList.remove("show");
}

// PWA 설치 버튼 클릭 이벤트
installPwaButton.addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      await updateItem(STORES.SETTINGS, { id: "isInstall", enabled: true });
    }
    deferredPrompt = null;
    hideInstallPwaModal();
  }
});

// 닫기 버튼 클릭 이벤트
closeInstallButton.addEventListener("click", hideInstallPwaModal);

// 나중에 하기 버튼 클릭 이벤트
laterButton.addEventListener("click", hideInstallPwaModal);

// 주간 날짜 배열 생성
function getWeekDates() {
  const dates = [];
  // 현재 한국 시간 기준으로 설정
  const now = new Date();
  const koreaDate = new Date(now.getTime());
  console.log(koreaDate);
  // 오늘 날짜부터 6일 전까지의 날짜를 생성
  for (let i = 6; i >= 0; i--) {
    const current = new Date(koreaDate);
    current.setDate(koreaDate.getDate() - i);
    dates.push(formatDate(current));
  }
  return dates;
}

// 날짜 포맷
function formatDate(date) {
  const koreaTime = new Date(date.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  return koreaTime.toISOString().split("T")[0];
}

// 일별 데이터 가져오기
async function getDayData(dateInfo) {
  const date = dateInfo.date || dateInfo;
  const dateStr = typeof date === "string" ? date : formatDate(date);
  const [todos, progress, usage] = await Promise.all([
    getItemsByDate(STORES.TODOS, dateStr),
    getItemsByDate(STORES.PROGRESS, dateStr),
    getItemsByDate(STORES.USAGE, dateStr),
  ]);
  return {
    todos: todos || [],
    progress: progress[0] || null,
    usage: usage || [],
  };
}

// 카드 내 todo 목록만 갱신하는 함수 추가
async function updateGoalTodos(card, goalId) {
  const today = getToday();
  const todos = await getItemsByDate(STORES.TODOS, today);
  const goalTodos = todos
    .filter((todo) => todo.goalId === String(goalId))
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.date) - new Date(b.date);
    });
  const goalTodosDiv = card.querySelector(".goal-todos");
  goalTodosDiv.innerHTML =
    goalTodos
      .slice(0, 2)
      .map(
        (todo) => `
      <div class="todo-item" data-todo-id="${todo.id}">
        <div class="todo-checkbox ${todo.completed ? "checked" : ""}"></div>
        <span class="todo-text ${todo.completed ? "completed" : ""}">${
          todo.title
        }</span>
        <button class="delete-todo-button" title="삭제">✕</button>
      </div>
    `
      )
      .join("") +
    (goalTodos.length > 2
      ? `<div class="view-more-container"><button class="view-more-button" data-goal-id="${goalId}">더보기</button></div>`
      : "");

  // [추가] 새로 그려진 todo-item에 클릭 이벤트 바인딩 (삭제 버튼 포함)
  bindTodoItemEvents(card, goalId, todos, goalTodos);
  bindViewMoreButtonEvents(card, goalId, todos, goalTodos);
}

// [추가] todo-item 이벤트 바인딩 함수 추출
function bindTodoItemEvents(card, goalId, todos, goalTodos) {
  const today = getToday();
  const todoItems = card.querySelectorAll(".todo-item[data-todo-id]");
  todoItems.forEach((todoItem) => {
    // 삭제 버튼 이벤트
    const deleteBtn = todoItem.querySelector(".delete-todo-button");
    if (deleteBtn && !deleteBtn.hasEventListener) {
      deleteBtn.hasEventListener = true;
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault(); // 추가: 부모 클릭 방지
        const todoId = parseInt(todoItem.dataset.todoId);
        if (!isNaN(todoId)) {
          await deleteItem(STORES.TODOS, todoId);
          await updateGoalTodos(card, goalId);
          await updateTodayProgress();
          await updateProgress();
          await createCalendarGrid();
        }
      });
    }
    // 체크 이벤트
    if (!todoItem.hasEventListener) {
      todoItem.hasEventListener = true;
      todoItem.addEventListener("click", async (e) => {
        // X버튼 클릭 시에는 체크 토글 동작하지 않음 (이벤트 버블링 방지)
        if (e.target.closest(".delete-todo-button")) return;
        const todoId = parseInt(todoItem.dataset.todoId);
        const todo = todos.find((t) => t.id === todoId);
        if (!todo) return;
        const checkbox = todoItem.querySelector(".todo-checkbox");
        const text = todoItem.querySelector(".todo-text");
        todoItem.classList.remove("completed");
        void todoItem.offsetWidth;
        todoItem.classList.add("completed");
        todo.completed = !todo.completed;
        checkbox.classList.toggle("checked");
        text.classList.toggle("completed");
        try {
          await updateItem(STORES.TODOS, todo);
          await updateTodayProgress();
          const progressText = card.querySelector(".goal-progress");
          const completedCount = goalTodos.filter((t) => t.completed).length;
          progressText.textContent = `${completedCount}/${goalTodos.length} 완료`;
        } catch (error) {
          window.toast.show("할 일 상태 업데이트에 실패했습니다.", "error");
        }
        const isAllCompleted = await areAllTodosCompleted(today, goalId);
        if (isAllCompleted) {
          await handleGoalCompleted(
            card.querySelector(".goal-title")?.textContent,
            goalId
          );
        }
        await createCalendarGrid();
      });
    }
  });
}

// [추가] 더보기 버튼 이벤트 바인딩 함수 추출
function bindViewMoreButtonEvents(card, goalId, todos, goalTodos) {
  const viewMoreButton = card.querySelector(".view-more-button");
  if (viewMoreButton) {
    // 항상 기존 이벤트 제거 후 재바인딩 (동적 생성 대응)
    viewMoreButton.replaceWith(viewMoreButton.cloneNode(true));
    const newViewMoreButton = card.querySelector(".view-more-button");
    newViewMoreButton.addEventListener("click", () => {
      const goalTodosContainer = card.querySelector(".view-more-container");
      const isExpanded = newViewMoreButton.textContent === "접기";
      if (isExpanded) {
        // 접기: 추가된 할 일들 제거
        const todoItems = card.querySelectorAll(".todo-item[data-todo-id]");
        todoItems.forEach((todo, index) => {
          if (index >= 2) todo.remove();
        });
        newViewMoreButton.textContent = "더보기";
        // 카드 높이 원래대로
        card.style.height = "";
      } else {
        // 더보기: 추가 할 일들 표시
        const additionalTodos = goalTodos
          .slice(2)
          .map(
            (todo) => `
              <div class="todo-item" data-todo-id="${todo.id}">
                <div class="todo-checkbox ${
                  todo.completed ? "checked" : ""
                }"></div>
                <span class="todo-text ${todo.completed ? "completed" : ""}">${
              todo.title
            }</span>
                <button class="delete-todo-button" title="삭제">✕</button>
              </div>
            `
          )
          .join("");
        // 더보기 버튼 앞에 추가 할 일들 삽입
        goalTodosContainer.insertAdjacentHTML("beforebegin", additionalTodos);
        newViewMoreButton.textContent = "접기";
        // 카드 높이 auto로
        card.style.height = "fit-content";
        // 새로 추가된 할 일들에 대한 클릭 이벤트 추가
        bindTodoItemEvents(card, goalId, todos, goalTodos);
      }
    });
  }
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", init);
