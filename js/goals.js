import {
  addItem,
  getItemsByDate,
  getItemsByAll,
  updateItem,
  STORES,
  deleteItem,
  initDB,
} from "./db.js";

// goals.js에서 사용할 함수들을 별도로 정의 (index.js와 동일한 로직)
async function updateTodayProgress() {
  // goals.js에서는 간단한 구현만 제공
  // 실제 구현은 index.js에서 처리됨
}

async function updateProgress() {
  // goals.js에서는 간단한 구현만 제공
  // 실제 구현은 index.js에서 처리됨
}

async function createCalendarGrid() {
  // goals.js에서는 간단한 구현만 제공
  // 실제 구현은 index.js에서 처리됨
}

async function areAllTodosCompleted(today, goalId) {
  const todos = await getItemsByDate(STORES.TODOS, today);
  const goalTodos = todos.filter((todo) => todo.goalId === String(goalId));
  return goalTodos.length > 0 && goalTodos.every((todo) => todo.completed);
}

// 축하 모달 함수 (index.js에서 복사)
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

// 목표별 자주(코인) 발급 로직 (index.js 참고)
async function handleGoalCompleted(goalTitle = null, goalId = null) {
  const today = getToday();
  // 목표별로 오늘 이미 코인을 획득했는지 확인
  let hasProgress = false;
  if (goalId) {
    const progresses = await getItemsByDate(STORES.PROGRESS, today);
    hasProgress = progresses.some((p) => String(p.goalId) === String(goalId));
  } else {
    // 전체 완료일 때 (예비)
    hasProgress = false;
  }
  if (!hasProgress) {
    // 코인 획득 (목표별로 goalId 저장)
    await addItem(STORES.PROGRESS, {
      date: today,
      amount: 1,
      goalId: goalId ? String(goalId) : undefined,
    });
    await updateTodayProgress();
    await updateProgress();
    // 축하 모달 표시
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

let currentFilter = "all";

// index.js와 동일한 시간 포맷 함수
const getToday = () => {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  return koreaTime.toISOString().split("T")[0];
};

// 태그 클릭 이벤트 바인딩
function setupFilterTags() {
  const tags = [
    { id: "tag-all", filter: "all" },
    { id: "tag-doing", filter: "doing" },
    { id: "tag-fail", filter: "fail" },
    { id: "tag-success", filter: "success" },
  ];
  tags.forEach(({ id, filter }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.onclick = () => {
        currentFilter = filter;
        document
          .querySelectorAll(".goal-filter-tag")
          .forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
        renderGoalCards();
      };
    }
  });
}

// 목표 카드 목록 렌더링
async function renderGoalCards(selectedGoalId = null) {
  const today = getToday();
  let goals = await getItemsByAll(STORES.GOALS);
  // 필터링
  if (currentFilter === "doing") {
    goals = goals.filter((g) => {
      return g.endDate >= today;
    });
  } else if (currentFilter === "fail") {
    goals = goals.filter((g) => {
      return g.endDate < today && g.status === "fail";
    });
  } else if (currentFilter === "success") {
    goals = goals.filter((g) => {
      return g.endDate < today && g.status === "success";
    });
  }
  // endDate 오름차순 정렬
  goals = goals.sort((a, b) => {
    return new Date(a.endDate) - new Date(b.endDate);
  });
  const todos = await getItemsByDate(STORES.TODOS, today);

  const goalCards = document.getElementById("goalCards");
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

    const card = document.createElement("div");
    card.className = "goal-card";
    card.dataset.goalId = goal.id;

    // 디데이 계산
    const dday = calculateDday(goal.endDate);

    // 카드 내용
    card.innerHTML = `
      <div class="goal-card-content">
        <div class="goal-header">
          <div class="goal-title-container">
            ${dday ? `<div class="goal-dday">${dday}</div>` : ""}
            <h3 class="goal-title" contenteditable="false">${goal.title}</h3>
          </div>
          <div class="goal-actions">
            <button class="kebab-button">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
        <div class="add-todo-item">
          <input type="text" class="todo-input" placeholder="할 일 추가하기">
          <button class="add-todo-button">+</button>
        </div>
        <div class="goal-todos"></div>
      </div>
    `;

    // 케밥 메뉴 클릭 이벤트 (수정/삭제)
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
        closeModal();

        // 수정 모달 생성
        const editModal = document.createElement("div");
        editModal.className = "modal-overlay";
        editModal.innerHTML = `
          <div class="modal show">
            <div class="modal-content">
              <div class="modal-header">
                <h2>목표 수정</h2>
                <button class="close-button">&times;</button>
              </div>
              <form id="editGoalForm">
                <div class="form-group">
                  <label for="editGoalTitle">목표 제목</label>
                  <input type="text" id="editGoalTitle" value="${goal.title}" required>
                </div>
                <div class="form-group">
                  <label>목표 종료일</label>
                  <div class="date-selector">
                    <div class="date-group">
                      <label for="editYearSelect">년</label>
                      <select id="editYearSelect" required></select>
                    </div>
                    <div class="date-group">
                      <label for="editMonthSelect">월</label>
                      <select id="editMonthSelect" required></select>
                    </div>
                    <div class="date-group">
                      <label for="editDaySelect">일</label>
                      <select id="editDaySelect" required></select>
                    </div>
                  </div>
                </div>
                <div class="step-buttons">
                  <button type="submit" class="submit-button">수정</button>
                  <button type="button" class="cancel-button">취소</button>
                </div>
              </form>
            </div>
          </div>
        `;

        document.body.appendChild(editModal);

        // 날짜 선택기 초기화
        const editYearSelect = editModal.querySelector("#editYearSelect");
        const editMonthSelect = editModal.querySelector("#editMonthSelect");
        const editDaySelect = editModal.querySelector("#editDaySelect");

        // 현재 목표의 종료일 파싱
        const currentEndDate = new Date(goal.endDate);
        const currentYear = currentEndDate.getFullYear();
        const currentMonth = currentEndDate.getMonth() + 1;
        const currentDay = currentEndDate.getDate();

        // 연도 옵션 생성 (현재 연도부터 10년 후까지)
        for (
          let year = new Date().getFullYear();
          year <= new Date().getFullYear() + 10;
          year++
        ) {
          const option = document.createElement("option");
          option.value = year;
          option.textContent = year + "년";
          if (year === currentYear) option.selected = true;
          editYearSelect.appendChild(option);
        }

        // 월 옵션 생성
        for (let month = 1; month <= 12; month++) {
          const option = document.createElement("option");
          option.value = month;
          option.textContent = month + "월";
          if (month === currentMonth) option.selected = true;
          editMonthSelect.appendChild(option);
        }

        // 일 옵션 생성
        function updateEditDayOptions(year, month) {
          const daysInMonth = new Date(year, month, 0).getDate();
          editDaySelect.innerHTML = "";
          for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement("option");
            option.value = day;
            option.textContent = day + "일";
            if (day === currentDay) option.selected = true;
            editDaySelect.appendChild(option);
          }
        }
        updateEditDayOptions(currentYear, currentMonth);

        // 월/연도 변경 시 일 옵션 업데이트
        editMonthSelect.addEventListener("change", () => {
          updateEditDayOptions(
            parseInt(editYearSelect.value),
            parseInt(editMonthSelect.value)
          );
        });
        editYearSelect.addEventListener("change", () => {
          updateEditDayOptions(
            parseInt(editYearSelect.value),
            parseInt(editMonthSelect.value)
          );
        });

        // 선택된 날짜를 ISO 형식으로 반환
        function getEditSelectedDate() {
          const year = parseInt(editYearSelect.value);
          const month = parseInt(editMonthSelect.value);
          const day = parseInt(editDaySelect.value);
          const formattedMonth = month.toString().padStart(2, "0");
          const formattedDay = day.toString().padStart(2, "0");
          return `${year}-${formattedMonth}-${formattedDay}`;
        }

        // 폼 제출 이벤트
        const editForm = editModal.querySelector("#editGoalForm");
        editForm.addEventListener("submit", async (e) => {
          e.preventDefault();

          const newTitle = editModal
            .querySelector("#editGoalTitle")
            .value.trim();
          const newEndDate = getEditSelectedDate();

          if (!newTitle) {
            window.toast.show("목표 제목을 입력해주세요.", "error");
            return;
          }

          try {
            goal.title = newTitle;
            goal.endDate = newEndDate;
            await updateItem(STORES.GOALS, goal);
            window.toast.show("목표가 수정되었습니다.", "success");
            editModal.remove();
            await renderGoalCards();
          } catch (error) {
            window.toast.show("목표 수정에 실패했습니다.", "error");
          }
        });

        // 취소 버튼 이벤트
        const cancelButton = editModal.querySelector(".cancel-button");
        cancelButton.addEventListener("click", () => {
          editModal.remove();
        });

        // 닫기 버튼 이벤트
        const closeEditButton = editModal.querySelector(".close-button");
        closeEditButton.addEventListener("click", () => {
          editModal.remove();
        });

        // 모달 외부 클릭 시 닫기
        editModal.addEventListener("click", (e) => {
          if (e.target === editModal) {
            editModal.remove();
          }
        });
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

    // todo 목록 + 더보기/접기 버튼 렌더링
    const todosDiv = card.querySelector(".goal-todos");
    let showAll = false;
    function renderTodosList() {
      todosDiv.innerHTML = "";
      const displayTodos = showAll ? goalTodos : goalTodos.slice(0, 2);
      displayTodos.forEach((todo) => {
        const todoDiv = document.createElement("div");
        todoDiv.className = "todo-item" + (todo.completed ? " completed" : "");
        todoDiv.innerHTML = `
          <input type="checkbox" ${todo.completed ? "checked" : ""} />
          <span class="todo-text">${todo.title}</span>
          <button class="delete-todo-button" title="삭제">✕</button>
        `;
        // 체크 이벤트
        const checkbox = todoDiv.querySelector("input[type=checkbox]");
        checkbox.addEventListener("change", async () => {
          todo.completed = checkbox.checked;
          await updateItem(STORES.TODOS, todo);
          await renderGoalCards();
          await updateTodayProgress();
          await updateProgress();
          await createCalendarGrid();

          // 목표 완료 체크
          const isAllCompleted = await areAllTodosCompleted(
            getToday(),
            goal.id
          );
          if (isAllCompleted) {
            await handleGoalCompleted(goal.title, goal.id);
          }
        });
        // 삭제 이벤트
        const deleteBtn = todoDiv.querySelector(".delete-todo-button");
        deleteBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await deleteItem(STORES.TODOS, todo.id);
          await renderGoalCards();
          await updateTodayProgress();
          await updateProgress();
          await createCalendarGrid();
        });
        todosDiv.appendChild(todoDiv);
      });
      // 더보기/접기 버튼
      let moreBtn = card.querySelector(".view-more-button");
      if (moreBtn) moreBtn.remove();
      if (goalTodos.length > 2) {
        moreBtn = document.createElement("button");
        moreBtn.className = "view-more-button";
        moreBtn.textContent = showAll
          ? "접기"
          : `더보기 (${goalTodos.length - 2}개 더)`;
        moreBtn.onclick = () => {
          showAll = !showAll;
          renderTodosList();
        };
        todosDiv.appendChild(moreBtn);
      }
    }
    renderTodosList();

    // 할 일 추가
    const todoInput = card.querySelector(".todo-input");
    const addTodoButton = card.querySelector(".add-todo-button");
    addTodoButton.addEventListener("click", async () => {
      const title = todoInput.value.trim();
      if (!title) return;
      await addItem(STORES.TODOS, {
        title,
        goalId: String(goal.id),
        date: getToday(),
        completed: false,
      });
      todoInput.value = "";
      await renderGoalCards();
      await updateTodayProgress();
      await updateProgress();
      await createCalendarGrid();
    });
    todoInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        addTodoButton.click();
      }
    });

    goalCards.appendChild(card);
  }
}

// 디데이 계산 함수 (index.js와 동일한 로직)
function calculateDday(endDate) {
  if (!endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `D-${diffDays}`;
  } else if (diffDays === 0) {
    return "D-Day";
  } else {
    return `D+${Math.abs(diffDays)}`;
  }
}

// 목표 삭제 및 관련 데이터 삭제 함수
async function deleteGoalAndRelatedData(goalId) {
  const today = getToday();
  // 목표 삭제
  await deleteItem(STORES.GOALS, goalId);

  // 목표와 관련된 모든 할 일 삭제
  const todos = await getItemsByDate(STORES.TODOS, today);
  const goalTodos = todos.filter(
    (todo) => String(todo.goalId) === String(goalId)
  );
  for (const todo of goalTodos) {
    await deleteItem(STORES.TODOS, todo.id);
  }

  // 목표와 관련된 모든 보상 삭제
  const progresses = await getItemsByDate(STORES.PROGRESS, today);
  const goalProgresses = progresses.filter(
    (p) => String(p.goalId) === String(goalId)
  );
  for (const progress of goalProgresses) {
    await deleteItem(STORES.PROGRESS, progress.id);
  }

  // 목표와 관련된 모든 기록 삭제 (예비)
  // 실제 기록 데이터가 있다면 이 부분을 구현해야 함
}

window.addEventListener("DOMContentLoaded", async () => {
  await initDB();
  setupFilterTags();
  await renderGoalCards();

  // 목표 추가 모달 관련 기능
  const addGoalButton = document.getElementById("addGoalButton");
  const modal = document.getElementById("createGoalModal");
  const closeButton = modal.querySelector(".close-button");
  const createGoalForm = document.getElementById("createGoalForm");
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");
  const daySelect = document.getElementById("daySelect");

  // 날짜 선택기 초기화
  function initializeDateSelectors() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    yearSelect.innerHTML = "";
    monthSelect.innerHTML = "";
    daySelect.innerHTML = "";
    for (let year = currentYear; year <= currentYear + 10; year++) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year + "년";
      yearSelect.appendChild(option);
    }
    for (let month = 1; month <= 12; month++) {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = month + "월";
      monthSelect.appendChild(option);
    }
    updateDayOptions(currentYear, currentMonth);
    yearSelect.value = currentYear;
    monthSelect.value = currentMonth;
    daySelect.value = currentDay;
    monthSelect.addEventListener("change", () => {
      updateDayOptions(parseInt(yearSelect.value), parseInt(monthSelect.value));
    });
    yearSelect.addEventListener("change", () => {
      updateDayOptions(parseInt(yearSelect.value), parseInt(monthSelect.value));
    });
  }
  function updateDayOptions(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    daySelect.innerHTML = "";
    for (let day = 1; day <= daysInMonth; day++) {
      const option = document.createElement("option");
      option.value = day;
      option.textContent = day + "일";
      daySelect.appendChild(option);
    }
  }
  function getSelectedDate() {
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    const day = parseInt(daySelect.value);
    const formattedMonth = month.toString().padStart(2, "0");
    const formattedDay = day.toString().padStart(2, "0");
    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  addGoalButton.addEventListener("click", () => {
    initializeDateSelectors();
    modal.classList.add("show");
  });
  closeButton.addEventListener("click", () => {
    modal.classList.remove("show");
    createGoalForm.reset();
  });
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
      createGoalForm.reset();
    }
  });
  createGoalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const goalData = {
      title: document.getElementById("goalTitle").value,
      endDate: getSelectedDate(),
      date: getToday(),
      startDate: getToday(),
    };
    await addItem(STORES.GOALS, goalData);
    modal.classList.remove("show");
    createGoalForm.reset();
    await renderGoalCards();
    window.toast.show("목표가 생성되었습니다!", "success");
  });
});
