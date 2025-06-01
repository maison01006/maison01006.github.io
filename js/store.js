import {
  STORES,
  initDB,
  updateItem,
  addItem,
  getItemsByDate,
  getDB,
  deleteItem,
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

// 리워드 수정 함수
async function editReward(reward) {
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>리워드 수정</h2>
      <div class="form-group">
        <label for="rewardName">보상 이름</label>
        <input type="text" id="rewardName" value="${reward.title}" class="form-control">
      </div>
      <div class="form-group">
        <label for="rewardCost">자주 비용</label>
        <input type="number" id="rewardCost" value="${reward.cost}" class="form-control">
      </div>
      <div class="modal-actions">
        <button id="cancelEdit" class="btn-secondary">취소</button>
        <button id="saveEdit" class="btn-primary">저장</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => {
    modal.remove();
  };

  const cancelButton = modal.querySelector("#cancelEdit");
  const saveButton = modal.querySelector("#saveEdit");
  const nameInput = modal.querySelector("#rewardName");
  const costInput = modal.querySelector("#rewardCost");

  cancelButton.addEventListener("click", closeModal);

  saveButton.addEventListener("click", async () => {
    const newTitle = nameInput.value.trim();
    const newCost = parseInt(costInput.value);

    if (!newTitle) {
      window.toast.show("보상 이름을 입력해주세요.", "error");
      return;
    }

    if (isNaN(newCost) || newCost <= 0) {
      window.toast.show("유효한 자주 비용을 입력해주세요.", "error");
      return;
    }

    try {
      const updatedReward = {
        ...reward,
        title: newTitle,
        cost: newCost,
      };

      await updateItem(STORES.REWARDS, updatedReward);
      await renderRewards();
      window.toast.show("보상이 수정되었습니다.", "success");
      closeModal();
    } catch (error) {
      window.toast.show("보상 수정에 실패했습니다.", "error");
    }
  });
}

function createRewardCard(reward) {
  const card = document.createElement("div");
  card.className = "reward-card";
  card.innerHTML = `
    <div class="reward-header">
      <h3 class="reward-name">${reward.title}</h3>
      <button class="kebab-button">
        <i class="fas fa-ellipsis-v"></i>
      </button>
    </div>
    <p class="reward-cost">${reward.cost} 자주</p>
    <button class="claim-button">
      사용하기
    </button>
  `;

  // 케밥 메뉴 클릭 이벤트
  const kebabButton = card.querySelector(".kebab-button");
  kebabButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const modal = document.createElement("div");
    modal.className = "action-modal";
    modal.innerHTML = `
      <div class="action-modal-content">
        <button class="edit-reward-button">
          <i class="fas fa-edit"></i>
          <span>수정</span>
        </button>
        <button class="delete-reward-button">
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
    const editButton = modal.querySelector(".edit-reward-button");
    editButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      closeModal();
      await editReward(reward);
    });

    // 삭제 버튼 클릭 이벤트
    const deleteButton = modal.querySelector(".delete-reward-button");
    deleteButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm("이 보상을 삭제하시겠습니까?")) {
        try {
          await deleteItem(STORES.REWARDS, reward.id);
          await renderRewards();
          window.toast.show("보상이 삭제되었습니다.", "success");
        } catch (error) {
          window.toast.show("보상 삭제에 실패했습니다.", "error");
        }
      }
      closeModal();
    });

    document.body.appendChild(modal);
  });

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

    // 보상 추가 버튼 클릭 이벤트
    const addRewardButton = document.getElementById("addRewardButton");
    addRewardButton.addEventListener("click", () => {
      if (currentGoalId) {
        window.location.href = `store-setting.html?goalId=${currentGoalId}`;
      } else {
        window.toast.show("목표를 먼저 선택해주세요.", "error");
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
      window.currentGoalId = goals[0].id;
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
