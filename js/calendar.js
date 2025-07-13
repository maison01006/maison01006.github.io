import { STORES, initDB, getItemsByDate, getDB } from "./db.js";

// DOM 요소
const calendarGrid = document.getElementById("calendarGrid");
const dayDetail = document.getElementById("dayDetail");
const detailDate = document.getElementById("detail-date");

let currentDate = new Date();
let db = null;

// DB 초기화
async function initializeDB() {
  await initDB();
  db = await getDB();
}

// 날짜 유틸리티 함수
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getMonthDates(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const dates = [];

  // 이전 달의 날짜들
  const firstDayOfMonth = start.getDay();
  if (firstDayOfMonth > 0) {
    const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevDate = new Date(prevMonthEnd);
      prevDate.setDate(prevMonthEnd.getDate() - i);
      dates.push({ date: formatDate(prevDate), isCurrentMonth: false });
    }
  }

  // 현재 달의 날짜들
  for (let i = 1; i <= end.getDate(); i++) {
    const current = new Date(date.getFullYear(), date.getMonth(), i);
    dates.push({ date: formatDate(current), isCurrentMonth: true });
  }

  // 다음 달의 날짜들
  const remainingDays = 42 - dates.length;
  if (remainingDays > 0) {
    const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(nextMonthStart);
      nextDate.setDate(nextMonthStart.getDate() + i - 1);
      dates.push({ date: formatDate(nextDate), isCurrentMonth: false });
    }
  }

  // 첫 행과 마지막 행이 모두 이전/다음 달인 경우 해당 행 제거
  const rows = [];
  for (let i = 0; i < dates.length; i += 7) {
    const row = dates.slice(i, i + 7);
    const isFirstRow = i === 0;
    const isLastRow = i + 7 >= dates.length;

    const isAllOtherMonth = row.every((item) => !item.isCurrentMonth);

    if (!(isFirstRow || isLastRow) || !isAllOtherMonth) {
      rows.push(...row);
    }
  }

  return rows;
}

// 캘린더 그리드 생성
async function createCalendarGrid() {
  const dates = getMonthDates(currentDate);
  calendarGrid.innerHTML = "";

  for (const dateInfo of dates) {
    const dayData = await getDayData(dateInfo);
    const dayElement = createDayElement(dateInfo, dayData);
    calendarGrid.appendChild(dayElement);
  }
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

// 날짜 셀 생성
function createDayElement(dateInfo, data) {
  const date = dateInfo.date || dateInfo;
  const isCurrentMonth =
    dateInfo.isCurrentMonth !== undefined ? dateInfo.isCurrentMonth : true;

  const day = document.createElement("div");
  day.className = `calendar-day${!isCurrentMonth ? " other-month" : ""}`;

  const dateObj = new Date(date);

  // 완료된 목표 수 계산
  const completedGoals = new Set();
  if (data.todos && data.todos.length > 0) {
    data.todos.forEach((todo) => {
      if (todo.completed) {
        completedGoals.add(todo.goalId);
      }
    });
  }

  day.innerHTML = `
    <div class="day-header">
      <span class="day-number">${dateObj.getDate()}</span>
      ${
        isCurrentMonth
          ? `
        <div class="day-status">
          ${
            completedGoals.size > 0
              ? `<span class="status-icon status-todo completed">${completedGoals.size}</span>`
              : ""
          }
          ${
            data.usage.length > 0
              ? '<span class="status-icon status-reward"><i class="fas fa-star"></i></span>'
              : ""
          }
        </div>
      `
          : ""
      }
    </div>
  `;

  if (isCurrentMonth) {
    day.addEventListener("click", () => showDayDetail(dateObj, data));
  }

  return day;
}

// 일별 상세 정보 표시
async function showDayDetail(date, data) {
  const detailDate = document.getElementById("detail-date");
  const detailTodo = document.getElementById("detail-todo");
  const detailReward = document.getElementById("detail-reward");

  detailDate.textContent = formatDate(date);

  // TODO 표시
  if (data.todos && data.todos.length > 0) {
    detailTodo.innerHTML = data.todos
      .map(
        (todo) => `
      <div class="todo-item ${todo.completed ? "completed" : ""}">
        <span>${todo.completed ? "✅ " : ""}${todo.title}</span>
      </div>
    `
      )
      .join("");
  } else {
    detailTodo.innerHTML =
      '<div class="empty-message">기록된 TODO가 없습니다.</div>';
  }

  // 보상 사용 표시
  if (data.usage && data.usage.length > 0) {
    // 보상 정보 가져오기
    const rewards = await Promise.all(
      data.usage.map(async (usage) => {
        const transaction = db.transaction([STORES.REWARDS], "readonly");
        const store = transaction.objectStore(STORES.REWARDS);
        const reward = await new Promise((resolve, reject) => {
          const request = store.get(usage.rewardId);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        return reward;
      })
    );

    detailReward.innerHTML = rewards
      .filter((reward) => reward) // null 체크
      .map(
        (reward) => `
        <div class="reward-item">
          <span>${reward.title}</span>
        </div>
      `
      )
      .join("");
  } else {
    detailReward.innerHTML =
      '<div class="empty-message">사용된 보상이 없습니다.</div>';
  }

  dayDetail.classList.add("active");
}

// 날짜 네비게이션 업데이트
function updateDateNavigation() {
  const yearElement = document.getElementById("currentYear");
  const monthElement = document.getElementById("currentMonth");

  yearElement.textContent = currentDate.getFullYear();
  monthElement.textContent = currentDate.getMonth() + 1;

  // 캘린더 그리드 업데이트
  refreshCalendar();
}

// 캘린더 새로고침
async function refreshCalendar() {
  if (!db) {
    await initializeDB();
  }
  await createCalendarGrid();
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", async () => {
  await initializeDB();
  updateDateNavigation();

  // 현재 날짜의 상세 정보 표시
  const today = new Date();
  const todayData = await getDayData(formatDate(today));
  showDayDetail(today, todayData);
});

// 이전 달로 이동
document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateDateNavigation();
});

// 다음 달로 이동
document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateDateNavigation();
});
