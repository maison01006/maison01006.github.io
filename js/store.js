import {
  STORES,
  initDB,
  updateItem,
  addItem,
  getItemsByDate,
  getDB,
} from "./db.js";
import { BottomTabNav, Toast, PageWrapper } from "./components.js";

let db = null;
let currentGoalId = null;

// 목표 목록 가져오기
async function getGoals() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.GOALS], "readonly");
    const store = transaction.objectStore(STORES.GOALS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 리워드 목록 가져오기
async function getRewards(goalId = null) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.REWARDS], "readonly");
    const store = transaction.objectStore(STORES.REWARDS);
    const request = store.getAll();

    request.onsuccess = () => {
      let rewards = request.result;

      if (goalId) {
        rewards = rewards.filter(
          (reward) => String(reward.goalId) === String(goalId)
        );
      }

      resolve(rewards);
    };

    request.onerror = () => reject(request.error);
  });
}

// 리워드 사용 기록 추가
async function addRewardHistory(reward) {
  const today = new Date().toISOString().split("T")[0];
  await addItem(STORES.USAGE, {
    rewardId: reward.goalId,
    date: today,
    cost: reward.cost,
    goalId: reward.goalId,
  });
}

function createRewardCard(reward) {
  const card = document.createElement("div");
  card.className = "reward-card";
  card.innerHTML = `
        <h3 class="reward-name">${reward.title}</h3>
        <p class="reward-cost">${reward.cost} 자주</p>
        <button class="claim-button">
            사용하기
        </button>
    `;

  const claimButton = card.querySelector(".claim-button");
  claimButton.addEventListener("click", () => showClaimModal(reward));
  return card;
}

// 목표 탭 생성
function createGoalTab(goal) {
  const tab = document.createElement("div");
  tab.className = "goal-tab";
  tab.textContent = goal.title;
  tab.dataset.goalId = goal.id;

  tab.addEventListener("click", async () => {
    // 활성화된 탭 스타일 변경
    document
      .querySelectorAll(".goal-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // 해당 목표의 리워드만 표시
    currentGoalId = goal.id;
    window.currentGoalId = goal.id; // 전역 변수에도 저장
    await renderRewards();
  });

  return tab;
}

// 리워드 목록 렌더링
async function renderRewards() {
  const rewardList = document.getElementById("rewardList");
  rewardList.innerHTML = ""; // 기존 리워드 제거

  const rewards = await getRewards(currentGoalId);
  if (rewards.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "해당 목표의 보상이 없습니다.";
    rewardList.appendChild(emptyMessage);
    return;
  }

  rewards.forEach((reward) => {
    const card = createRewardCard(reward);
    card.setAttribute("data-reward-id", reward.goalId);
    rewardList.appendChild(card);
  });
}

// 모달 관련 함수들
function showClaimModal(reward) {
  const modal = document.getElementById("claimModal");
  const message = document.getElementById("modalMessage");
  message.textContent = `${reward.title}을(를) 사용하시겠습니까?`;

  modal.classList.add("active");

  const confirmButton = document.getElementById("confirmClaim");
  const cancelButton = document.getElementById("cancelClaim");

  const handleConfirm = async () => {
    try {
      await claimReward(reward);
      modal.classList.remove("active");
      confirmButton.removeEventListener("click", handleConfirm);
      cancelButton.removeEventListener("click", handleCancel);
    } catch (error) {
      console.error("리워드 사용 실패:", error);
      alert(error.message || "리워드 사용에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleCancel = () => {
    modal.classList.remove("active");
    confirmButton.removeEventListener("click", handleConfirm);
    cancelButton.removeEventListener("click", handleCancel);
  };

  confirmButton.addEventListener("click", handleConfirm);
  cancelButton.addEventListener("click", handleCancel);
}

async function claimReward(reward) {
  const today = new Date().toISOString().split("T")[0];
  const progress = await getItemsByDate(STORES.PROGRESS, today);

  // 해당 목표의 자주 확인
  const goalProgress = progress.find((p) => p.goalId === reward.goalId);
  if (!goalProgress) {
    throw new Error("해당 목표의 자주가 없습니다.");
  }
  if (goalProgress.amount < reward.cost) {
    throw new Error("자주가 부족합니다.");
  }

  // 자주 차감
  goalProgress.amount -= reward.cost;
  await updateItem(STORES.PROGRESS, goalProgress);

  // 사용 기록 추가
  await addRewardHistory(reward);

  // 축하 애니메이션
  const card = document.querySelector(`[data-reward-id="${reward.goalId}"]`);
  if (card) {
    card.classList.add("celebrate");
    setTimeout(() => card.classList.remove("celebrate"), 500);
  }
}

// 초기화
async function initialize() {
  try {
    await initDB();
    db = await getDB();

    // 페이지 래퍼 적용
    const pageWrapper = new PageWrapper();
    pageWrapper.mount(document.body);

    // 하단 탭 네비게이션 적용
    const bottomNav = new BottomTabNav("store");
    bottomNav.mount(document.body);

    // Toast 인스턴스 생성
    window.toast = new Toast();

    // 설정 버튼에 현재 선택된 목표 ID 추가
    const settingBtn = document.getElementById("settingBtn");
    settingBtn.addEventListener("click", (e) => {
      if (currentGoalId) {
        e.preventDefault();
        window.location.href = `store-setting.html?goalId=${currentGoalId}`;
      }
    });

    // 목표 탭 생성
    const goals = await getGoals();
    const goalTabs = document.getElementById("goalTabs");
    goals.forEach((goal) => {
      const tab = createGoalTab(goal);
      goalTabs.appendChild(tab);
    });

    // 첫 번째 탭 활성화
    if (goals.length > 0) {
      const firstTab = goalTabs.querySelector(".goal-tab");
      firstTab.classList.add("active");
      currentGoalId = goals[0].id;
      window.currentGoalId = goals[0].id; // 전역 변수에도 저장
    }

    // 리워드 목록 렌더링
    await renderRewards();
  } catch (error) {
    console.error("초기화 실패:", error);
    alert("스토어를 불러오는데 실패했습니다. 페이지를 새로고침해주세요.");
  }
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", initialize);
