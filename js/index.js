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
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return koreaTime.toISOString().split('T')[0];
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

// 축하 모달 표시 함수
function showCongratsModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "congrats-modal";
  modal.innerHTML = `
    <h2>🎉 축하합니다! 🎉</h2>
    <p>모든 할 일을 완료하여 자주 1개를 획득했습니다!</p>
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
  const goalTodos = todos.filter((todo) => todo.goalId === goalId);
  return goalTodos.length > 0 && goalTodos.every((todo) => todo.completed);
}

// 코인 획득 처리 함수
async function handleCoinEarned(goalId) {
  const today = new Date().toISOString().split("T")[0];
  // 오늘 이미 코인을 획득했는지 확인
  const hasProgress = await checkTodayProgress(goalId);
  if (!hasProgress) {
    // 코인 획득
    await addItem(STORES.PROGRESS, {
      date: today,
      amount: 1,
      goalId: goalId,
    });

    // UI 업데이트
    await updateCoinCount();

    // 축하 모달과 폭죽 효과 표시
    showCongratsModal();
  }
}

// 진행률 업데이트
async function updateProgress() {
  const todos = await getItemsByDate(STORES.TODOS, getToday());
  const goals = await getItemsByAll(STORES.GOALS);
  await updateCoinCount();
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

// 코인 수 업데이트
async function updateCoinCount() {
  const today = new Date().toISOString().split("T")[0];
  const progress = await getItemsByDate(STORES.PROGRESS, today);
  const goals = await getItemsByAll(STORES.GOALS);
  const totalCoins = progress.reduce((sum, p) => sum + p.amount, 0);
  todayCoinCount.textContent = `${totalCoins} / ${goals.length}`;
}

// 목표 카드 목록 렌더링
async function renderGoalCards() {
  const today = new Date().toISOString().split("T")[0];
  const goals = await getItemsByAll(STORES.GOALS);
  const todos = await getItemsByDate(STORES.TODOS, today);
  const rewards = await getItemsByDate(STORES.REWARDS, today);
  const progress = await getItemsByDate(STORES.PROGRESS, today);

  goalCards.innerHTML = "";

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
            <span class="goal-coin-count">
              <span class="coin-icon">🪙</span>
              <span class="coin-amount">${totalCoins}</span>
            </span>
          </div>
          <p class="goal-progress">${
            goalTodos.filter((todo) => todo.completed).length
          }/${goalTodos.length} 완료</p>
        </div>
        <div class="add-todo-item">
          <input type="text" class="todo-input" placeholder="할 일 추가하기">
          <button class="add-todo-button">+</button>
        </div>
        <div class="goal-todos">
          ${goalTodos
            .slice(0, 2)
            .map(
              (todo) => `
            <div class="todo-item" data-todo-id="${todo.id}">
              <div class="todo-checkbox ${
                todo.completed ? "checked" : ""
              }"></div>
              <span class="todo-text ${todo.completed ? "completed" : ""}">${
                todo.title
              }</span>
            </div>
          `
            )
            .join("")}
          ${
            goalTodos.length > 2
              ? `
            <div class="view-more-container">
              <button class="view-more-button" data-goal-id="${goal.id}">더보기</button>
            </div>
          `
              : ""
          }
        </div>
      </div>
      <div class="goal-actions">
        <button class="edit-goal-button" title="목표 수정">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-goal-button" title="목표 삭제">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // 스와이프 기능 구현
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;

    // card.addEventListener("touchstart", (e) => {
    //   startX = e.touches[0].clientX;
    //   isSwiping = true;
    //   card.classList.add("swiping");
    // });

    // card.addEventListener("touchmove", (e) => {
    //   if (!isSwiping) return;
    //   currentX = e.touches[0].clientX;
    //   const diff = currentX - startX;

    //   if (diff < 0) {
    //     // 왼쪽으로만 스와이프 가능
    //     const content = card.querySelector(".goal-card-content");
    //     content.style.transform = `translateX(${diff}px)`;
    //   }
    // });

    // card.addEventListener("touchend", () => {
    //   isSwiping = false;
    //   card.classList.remove("swiping");

    //   const content = card.querySelector(".goal-card-content");
    //   const diff = currentX - startX;

    //   if (diff < -50) {
    //     // 50px 이상 스와이프하면 버튼 표시
    //     card.classList.add("swiped");
    //     content.style.transform = "translateX(-100px)";
    //   } else {
    //     // 원위치로 복귀
    //     card.classList.remove("swiped");
    //     content.style.transform = "translateX(0)";
    //   }
    // });

    // 목표 수정 버튼 클릭 이벤트
    const editButton = card.querySelector(".edit-goal-button");
    const titleElement = card.querySelector(".goal-title");

    editButton.addEventListener("click", async () => {
      const isEditing = titleElement.contentEditable === "true";

      if (isEditing) {
        titleElement.contentEditable = "false";
        editButton.innerHTML = '<i class="fas fa-edit"></i>';

        try {
          goal.title = titleElement.textContent.trim();
          await updateItem(STORES.GOALS, goal);
          window.toast.show("목표가 수정되었습니다.", "success");

          // 수정 완료 후 카드 원위치
          card.classList.remove("swiped");
          card.querySelector(".goal-card-content").style.transform =
            "translateX(0)";
        } catch (error) {
          window.toast.show("목표 수정에 실패했습니다.", "error");
          titleElement.textContent = goal.title;
        }
      } else {
        titleElement.contentEditable = "true";
        titleElement.focus();
        editButton.innerHTML = '<i class="fas fa-check"></i>';
      }
    });

    // 목표 삭제 버튼 클릭 이벤트
    const deleteButton = card.querySelector(".delete-goal-button");
    deleteButton.addEventListener("click", async () => {
      if (
        confirm(
          "이 목표를 삭제하시겠습니까? 관련된 모든 할 일도 함께 삭제됩니다."
        )
      ) {
        try {
          const relatedTodos = todos.filter((todo) => todo.goalId === goal.id);
          for (const todo of relatedTodos) {
            await deleteItem(STORES.TODOS, todo.id);
          }

          await deleteItem(STORES.GOALS, goal.id);
          await renderGoalCards();
          await updateTodayProgress();
          window.toast.show("목표가 삭제되었습니다.", "success");
        } catch (error) {
          window.toast.show("목표 삭제에 실패했습니다.", "error");
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
            </div>
          `
            )
            .join("");

          // 더보기 버튼 앞에 추가 할 일들 삽입
          goalTodosContainer.insertAdjacentHTML("beforebegin", additionalTodos);
          viewMoreButton.textContent = "접기";

          // 새로 추가된 할 일들에 대한 클릭 이벤트 추가
          const newTodoItems = card.querySelectorAll(
            ".todo-item[data-todo-id]"
          );
          newTodoItems.forEach((todoItem) => {
            if (!todoItem.hasEventListener) {
              todoItem.hasEventListener = true;
              todoItem.addEventListener("click", async () => {
                const todoId = todoItem.dataset.todoId;
                const todo = todos.find((t) => t.id === parseInt(todoId));
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
                  console.log(todo);
                  await updateItem(STORES.TODOS, todo);
                  await updateTodayProgress();
                  const progressText = card.querySelector(".goal-progress");
                  const completedCount = goalTodos.filter((t) => t.completed).length;
                  progressText.textContent = `${completedCount}/${goalTodos.length} 완료`;
                } catch (error) {
                  window.toast.show("할 일 상태 업데이트에 실패했습니다.", "error");
                }

                const isAllCompleted = await areAllTodosCompleted(today, goal.id);
                if (isAllCompleted) {
                  await handleCoinEarned(goal.id);
                }
                await createCalendarGrid();
              });
            }
          });
        }
      });
    }

    // 초기 할 일 항목 클릭 이벤트 처리
    const initialTodoItems = card.querySelectorAll(".todo-item[data-todo-id]");
    initialTodoItems.forEach((todoItem) => {
      if (!todoItem.hasEventListener) {
        todoItem.hasEventListener = true;
        todoItem.addEventListener("click", async () => {
          const todoId = todoItem.dataset.todoId;
          console.log(todoId);
          console.log(todos);
          const todo = todos.find((t) => t.id === parseInt(todoId));
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

          const isAllCompleted = await areAllTodosCompleted(today, goal.id);
          if (isAllCompleted) {
            await handleCoinEarned(goal.id);
          }
          await createCalendarGrid();
        });
      }
    });

    // 할 일 추가 기능
    const todoInput = card.querySelector(".todo-input");
    const addTodoButton = card.querySelector(".add-todo-button");

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
        await addItem(STORES.TODOS, todo);
        todoInput.value = "";
        await renderGoalCards(); // 카드 목록 새로고침
      } catch (error) {
        console.error("할 일 추가 실패:", error);
        window.toast.show("할 일 추가에 실패했습니다.", "error");
      }
    };

    addTodoButton.addEventListener("click", addTodo);
    todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addTodo();
      }
    });

    goalCards.appendChild(card);
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

// 캘린더 그리드 생성
async function createCalendarGrid() {
  const calendarGrid = document.getElementById("calendarGrid");
  const dates = getWeekDates(new Date());
  calendarGrid.innerHTML = "";

  for (const dateInfo of dates) {
    const dayData = await getDayData(dateInfo);
    const dayElement = createDayElement(dateInfo, dayData);
    calendarGrid.appendChild(dayElement);
  }
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

// PWA 설치 모달 표시
function showInstallPwaModal() {
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
function getWeekDates(date) {
  const dates = [];
  const koreaDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  for (let i = 6; i >= 0; i--) {
    const current = new Date(koreaDate);
    current.setDate(koreaDate.getDate() - i);
    dates.push(formatDate(current));
  }
  return dates;
}

// 날짜 포맷
function formatDate(date) {
  const koreaTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return koreaTime.toISOString().split('T')[0];
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

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", init);
