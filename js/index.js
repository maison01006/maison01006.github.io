import storage from "./storage.js";
import { formatDate, getKoreanDateString } from "./utils.js";

// 할일 관련 함수들
async function addTodo() {
  const todoInput = document.getElementById("todoInput");
  const text = todoInput.value.trim();

  console.log(text);

  if (!text) return;

  const todo = {
    text,
    date: getKoreanDateString(),
    completed: false,
  };

  await storage.addTodo(todo);
  todoInput.value = "";
  loadTodos();
}

// 할 일 삭제 함수
async function deleteTodo(id) {
  try {
    await storage.deleteTodo(id);
    loadTodos();
  } catch (error) {
    console.error("할 일 삭제 중 오류 발생:", error);
    alert("할 일 삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
}

// 보상 관련 함수들
function updateRewardDisplay() {
  // 보상 표시 로직 구현
  // 예: 최근 보상 내역 표시, 보상 상자 표시 여부 결정 등
  console.log("보상 표시 업데이트");
  loadRewardHistory();
}

// 보상 히스토리 로드 및 표시
async function loadRewardHistory() {
  const rewardHistoryList = document.getElementById("rewardHistoryList");

  try {
    // 획득한 보상 목록 가져오기
    const earnedRewards = await storage.getEarnedRewards();
    console.log("획득한 보상:", earnedRewards);

    // 최근 5개의 보상만 선택 (최신순 정렬)
    const recentRewards = earnedRewards
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    rewardHistoryList.innerHTML = "";

    if (recentRewards.length === 0) {
      rewardHistoryList.innerHTML =
        '<div class="empty-message">아직 받은 보상이 없습니다.</div>';
      return;
    }

    recentRewards.forEach((reward) => {
      const historyItem = document.createElement("div");
      historyItem.className = "list-item";

      // 날짜 문자열을 Date 객체로 변환
      const rewardDate = new Date(reward.date);

      historyItem.innerHTML = `
        <div class="reward-info">
          <div class="reward-title">${reward.rewardName}</div>
          <div class="reward-date">${formatDate(rewardDate)}</div>
        </div>
      `;
      rewardHistoryList.appendChild(historyItem);
    });
  } catch (error) {
    console.error("보상 히스토리 로드 중 오류 발생:", error);
    rewardHistoryList.innerHTML =
      '<div class="empty-message">보상 내역을 불러오는 중 오류가 발생했습니다.</div>';
  }
}

// 통계 관련 함수들
async function updateStats() {
  try {
    // 연속 완료 일수 계산
    const streakCount = await calculateStreak();
    document.getElementById("streakCount").textContent = `${streakCount}일`;

    // 꽝 확률 계산
    const failProbability = await calculateFailProbability();
    document.getElementById(
      "failProbability"
    ).textContent = `${failProbability}%`;

    // 총 달성한 todo 수 계산
    const totalCompleted = await calculateTotalCompleted();
    document.getElementById(
      "totalCompleted"
    ).textContent = `${totalCompleted}개`;

    // 최근 7일 완료 일수 계산 및 사각형 표시
    await calculateWeeklyCompletion();
  } catch (error) {
    console.error("통계 업데이트 중 오류 발생:", error);
  }
}

// 연속 완료 일수 계산
async function calculateStreak() {
  const earnedRewards = await storage.getEarnedRewards();
  if (earnedRewards.length === 0) return 0;

  // 날짜순으로 정렬
  const sortedRewards = earnedRewards.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // 오늘 보상을 받았는지 확인
  const todayStr = getKoreanDateString();
  const hasTodayReward = sortedRewards.some(
    (reward) => reward.date === todayStr
  );

  if (!hasTodayReward) {
    // 어제 날짜로 설정
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // 연속된 날짜 확인
  for (let i = 0; i < sortedRewards.length; i++) {
    const rewardDate = new Date(sortedRewards[i].date);
    rewardDate.setHours(0, 0, 0, 0);

    if (i === 0 && !hasTodayReward) {
      // 첫 번째 보상이 어제가 아니면 연속 완료가 아님
      if (rewardDate.getTime() !== currentDate.getTime()) {
        return 0;
      }
    }

    if (i > 0) {
      const prevDate = new Date(sortedRewards[i - 1].date);
      prevDate.setHours(0, 0, 0, 0);

      // 이전 날짜와 현재 날짜의 차이가 1일이 아니면 연속 완료가 아님
      const diffDays = Math.floor(
        (prevDate - rewardDate) / (1000 * 60 * 60 * 24)
      );
      if (diffDays !== 1) {
        break;
      }
    }

    streak++;
  }

  return streak;
}

// 꽝 확률 계산
async function calculateFailProbability() {
  const rewards = await storage.getRewards();
  const failReward = rewards.find((reward) => reward.name === "꽝");
  return failReward ? failReward.probability : 0;
}

// 주간 완료 현황 계산 및 표시
async function calculateWeeklyCompletion() {
  const weeklyCompletion = document.getElementById("weeklyCompletion");
  if (!weeklyCompletion) return;

  try {
    // 최근 7일 날짜 배열 생성
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(getKoreanDateString(date));
    }

    // 각 날짜별 완료 상태 확인
    const completionStatus = await Promise.all(
      dates.map(async (date) => {
        const done = await storage.getRewardHistory(date);
        // 모든 할 일이 완료되었는지 확인
        return done.length > 0;
      })
    );

    // 완료 현황 표시
    weeklyCompletion.innerHTML = "";
    completionStatus.forEach((completed, index) => {
      const box = document.createElement("div");
      box.className = `completion-box ${completed ? "completed" : ""}`;

      // 툴팁 추가
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const formattedDate = `${date.getMonth() + 1}월 ${date.getDate()}일`;
      box.title = `${formattedDate}: ${completed ? "완료" : "미완료"}`;

      weeklyCompletion.appendChild(box);
    });
  } catch (error) {
    console.error("주간 완료 현황 계산 중 오류 발생:", error);
    weeklyCompletion.innerHTML =
      '<div class="error-message">데이터를 불러오는 중 오류가 발생했습니다.</div>';
  }
}

// 총 달성한 todo 수 계산
async function calculateTotalCompleted() {
  const todos = await storage.getAll("todos");
  return todos.filter((todo) => todo.completed).length;
}

// 할일 목록 로드 및 상태 업데이트
async function loadTodos() {
  const todoList = document.getElementById("todoList");
  const statusBadge = document.getElementById("statusBadge");
  const todayStr = getKoreanDateString();
  const todos = await storage.getTodos(todayStr);

  todoList.innerHTML = "";

  if (todos.length === 0) {
    todoList.innerHTML =
      '<li class="empty-message">등록된 할 일이 없습니다.</li>';
    statusBadge.textContent = "0/0 완료";
    statusBadge.className = "status-badge";
    return;
  }

  let completedCount = 0;
  todos.forEach((todo) => {
    if (todo.completed) completedCount++;
    const li = document.createElement("li");
    li.className = "todo-item";
    li.innerHTML = `
      <div class="todo-checkbox ${
        todo.completed ? "checked" : ""
      }" data-index="${todo.id}"></div>
      <div class="todo-content ${
        todo.completed ? "checked" : ""
      }" data-index="${todo.id}">${todo.text}</div>
      <div class="kebab-menu" data-index="${todo.id}">
        <img src="../assets/icons/more.svg" alt="더보기" />
        <div class="kebab-menu-content">
          <div class="kebab-menu-item edit">
            <img src="../assets/icons/edit.svg" alt="수정" width="16" height="16" />
            수정
          </div>
          <div class="kebab-menu-item delete">
            <img src="../assets/icons/delete.svg" alt="삭제" width="16" height="16" />
            삭제
          </div>
        </div>
      </div>
    `;

    todoList.appendChild(li);
  });

  // 체크박스 이벤트 리스너
  document.querySelectorAll(".todo-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("click", async () => {
      const index = parseInt(checkbox.dataset.index);
      const todo = todos.find((t) => t.id === index);
      if (todo) {
        todo.completed = !todo.completed;
        await storage.updateTodo(todo.id, todo);
        loadTodos();
      }
    });
  });

  // todo 텍스트 수정 관련 이벤트 리스너
  document.querySelectorAll(".todo-content").forEach((content) => {
    content.addEventListener("blur", async () => {
      if (!content.isContentEditable) return;

      content.contentEditable = false;
      content.classList.remove("editing");
      const index = parseInt(content.dataset.index);
      const todo = todos.find((t) => t.id === index);
      const newText = content.textContent.trim();

      if (todo && newText !== "" && newText !== todo.text) {
        todo.text = newText;
        await storage.updateTodo(todo.id, todo);
        loadTodos();
      } else if (newText === "") {
        loadTodos(); // 빈 텍스트인 경우 원래 텍스트로 복원
      }
    });

    content.addEventListener("keydown", (e) => {
      if (!content.isContentEditable) return;

      if (e.key === "Enter") {
        e.preventDefault();
        content.blur();
      }
    });
  });

  // 케밥 메뉴 이벤트 리스너
  const kebabMenus = document.querySelectorAll(".kebab-menu");
  kebabMenus.forEach((kebabMenu) => {
    kebabMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const allMenus = document.querySelectorAll(".kebab-menu");
      allMenus.forEach((menu) => {
        if (menu !== kebabMenu) menu.classList.remove("active");
      });
      kebabMenu.classList.toggle("active");
    });

    // 수정 및 삭제 버튼 이벤트 리스너
    const editButton = kebabMenu.querySelector(".edit");
    const deleteButton = kebabMenu.querySelector(".delete");
    const index = parseInt(kebabMenu.dataset.index);
    const todo = todos.find((t) => t.id === index);

    editButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const content = document.querySelector(
        `.todo-content[data-index="${index}"]`
      );
      content.contentEditable = true;
      content.classList.add("editing");
      content.focus();
      // 커서를 텍스트 끝으로 이동
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(content);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      // 케밥 메뉴 닫기
      kebabMenu.classList.remove("active");
    });

    deleteButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      await storage.deleteTodo(todo.id);
      loadTodos();
    });
  });

  // 문서 클릭 시 케밥 메뉴 닫기
  document.addEventListener("click", () => {
    document.querySelectorAll(".kebab-menu").forEach((menu) => {
      menu.classList.remove("active");
    });
  });

  // 완료 상태 업데이트
  statusBadge.textContent = `${completedCount}/${todos.length} 완료`;

  // 완료 상태에 따라 배지 스타일 변경
  if (completedCount === todos.length) {
    statusBadge.className = "status-badge success";
  } else if (completedCount > 0) {
    statusBadge.className = "status-badge progress";
  } else {
    statusBadge.className = "status-badge";
  }

  // 모든 할일이 완료되었는지 확인
  const rewardBox = document.getElementById("rewardBox");

  // 오늘 이미 보상을 획득했는지 확인
  const earnedRewards = await storage.getRewardHistory(todayStr);
  const todayEarnedRewards = earnedRewards.filter(
    (reward) => reward.date === todayStr
  );
  // 모든 할일이 완료되었고, 오늘 보상을 획득하지 않았을 때만 보상 상자 표시
  if (
    completedCount === todos.length &&
    todos.length > 0 &&
    todayEarnedRewards.length === 0
  ) {
    rewardBox.style.display = "block";
  } else {
    rewardBox.style.display = "none";
  }
}

// 보상 받기 버튼 이벤트 리스너
function setupRewardButton() {
  const getRewardButton = document.getElementById("getRewardButton");
  if (getRewardButton) {
    getRewardButton.addEventListener("click", async () => {
      try {
        // 보상 목록 가져오기
        const rewards = await storage.getRewards();

        if (rewards.length === 0) {
          alert("등록된 보상이 없습니다. 설정에서 보상을 등록해주세요.");
          return;
        }

        // 확률에 따라 보상 선택
        const random = Math.random() * 100;
        let cumulativeProbability = 0;
        let selectedReward = null;

        console.log("보상 선택 시작 - 랜덤 값:", random);
        console.log("보상 목록:", rewards);

        // 보상 목록을 확률 순으로 정렬 (낮은 확률부터)
        const sortedRewards = [...rewards].sort(
          (a, b) => a.probability - b.probability
        );
        console.log("정렬된 보상 목록:", sortedRewards);

        for (const reward of sortedRewards) {
          cumulativeProbability += reward.probability;
          console.log(
            `보상: ${reward.name}, 확률: ${reward.probability}, 누적 확률: ${cumulativeProbability}`
          );

          if (random <= cumulativeProbability) {
            selectedReward = reward;
            console.log(`선택된 보상: ${reward.name}`);
            break;
          }
        }

        // 선택된 보상이 없으면 마지막 보상 사용
        if (!selectedReward) {
          selectedReward = rewards[rewards.length - 1];
          console.log(
            `선택된 보상이 없어 마지막 보상 사용: ${selectedReward.name}`
          );
        }

        // 보상 기록 추가
        await storage.addRewardHistory({
          rewardName: selectedReward.name,
          date: getKoreanDateString(),
          timestamp: new Date().toISOString(),
        });

        // 결과 페이지로 이동
        window.location.href = `rewardResult.html?reward=${encodeURIComponent(
          selectedReward.name
        )}`;
      } catch (error) {
        console.error("보상 선택 중 오류 발생:", error);
        alert("보상 선택 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    });
  }
}

// 페이지 로드 시 실행될 초기화 코드
document.addEventListener("DOMContentLoaded", async () => {
  loadTodos();
  updateRewardDisplay();
  updateStats(); // 통계 업데이트 추가
  setupRewardButton();

  // 할 일 추가 버튼 이벤트 리스너 추가
  const addTodoBtn = document.getElementById("addTodoBtn");
  if (addTodoBtn) {
    addTodoBtn.addEventListener("click", addTodo);
  }

  // 할 일 입력 필드에서 Enter 키 이벤트 처리
  const todoInput = document.getElementById("todoInput");
  if (todoInput) {
    todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addTodo();
      }
    });
  }
});

// 서비스 워커 등록
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/js/service-worker.js")
      .then(function (registration) {
        console.log("ServiceWorker 등록 성공:", registration.scope);
      })
      .catch(function (error) {
        console.log("ServiceWorker 등록 실패:", error);
      });
  });
}
