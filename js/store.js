import {
  STORES,
  initDB,
  updateItem,
  addItem,
  getItemsByDate,
  getDB,
  deleteItem,
  getItemsByAll,
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
async function getRewards() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.REWARDS], "readonly");
    const store = transaction.objectStore(STORES.REWARDS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 리워드 사용 기록 추가
async function addRewardHistory(reward) {
  const today = new Date().toISOString().split("T")[0];
  await addItem(STORES.USAGE, {
    rewardId: reward.id,
    date: today,
    cost: reward.cost,
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

// 리워드 목록 렌더링
async function renderRewards() {
  const rewardList = document.getElementById("rewardList");
  rewardList.innerHTML = ""; // 기존 리워드 제거

  const rewards = await getRewards();
  if (rewards.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "해당 목표의 보상이 없습니다.";
    rewardList.appendChild(emptyMessage);
    return;
  }

  rewards.forEach((reward) => {
    const card = createRewardCard(reward);
    card.setAttribute("data-reward-id", reward.id);
    rewardList.appendChild(card);
  });
}

// 자주 총 개수 렌더링 함수
async function renderTotalJaju() {
  const today = new Date().toISOString().split("T")[0];
  // 전체 progress에서 amount 합산
  const progresses = await getItemsByAll(STORES.PROGRESS);
  const totalJaju = progresses.reduce((sum, p) => sum + (p.amount || 0), 0);
  let jajuBalance = document.getElementById("jajuBalance");
  if (!jajuBalance) {
    jajuBalance = document.createElement("div");
    jajuBalance.id = "jajuBalance";
    jajuBalance.className = "jaju-balance";
    const storeHeader = document.querySelector(".store-header");
    storeHeader.appendChild(jajuBalance);
  }
  jajuBalance.innerHTML = `<span class="balance-amount">🪙 ${totalJaju}</span>`;
}

// 모달 관련 함수들
function showClaimModal(reward) {
  const modal = document.getElementById("claimModal");
  const message = document.getElementById("modalMessage");
  message.textContent = `${reward.title}을(를) 사용하시겠습니까?`;

  modal.classList.add("active");

  const confirmButton = document.getElementById("confirmClaim");
  const cancelButton = document.getElementById("cancelClaim");

  // 기존 이벤트 리스너 제거 (중복 방지)
  confirmButton.replaceWith(confirmButton.cloneNode(true));
  cancelButton.replaceWith(cancelButton.cloneNode(true));
  const newConfirmButton = document.getElementById("confirmClaim");
  const newCancelButton = document.getElementById("cancelClaim");

  const handleConfirm = async () => {
    try {
      await claimReward(reward);
      modal.classList.remove("active");
      newConfirmButton.removeEventListener("click", handleConfirm);
      newCancelButton.removeEventListener("click", handleCancel);

      window.location.replace(
        `use-store.html?rewardTitle=${encodeURIComponent(reward.title)}`
      );
    } catch (error) {
      console.error("리워드 사용 실패:", error);
      alert(error.message || "리워드 사용에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleCancel = () => {
    modal.classList.remove("active");
    newConfirmButton.removeEventListener("click", handleConfirm);
    newCancelButton.removeEventListener("click", handleCancel);
  };

  newConfirmButton.addEventListener("click", handleConfirm);
  newCancelButton.addEventListener("click", handleCancel);
}

async function claimReward(reward) {
  const today = new Date().toISOString().split("T")[0];
  const progress = await getItemsByDate(STORES.PROGRESS, today);

  // 전체 자주 합산
  const totalJaju = progress.reduce((sum, p) => sum + (p.amount || 0), 0);
  if (totalJaju < reward.cost) {
    throw new Error("자주가 부족합니다.");
  }

  // 자주 차감 (여러 progress에서 차감)
  let remainingCost = reward.cost;
  for (const p of progress) {
    if (remainingCost === 0) break;
    const deduct = Math.min(p.amount, remainingCost);
    p.amount -= deduct;
    remainingCost -= deduct;
    await updateItem(STORES.PROGRESS, p);
  }

  // 사용 기록 추가
  await addRewardHistory(reward);

  // 축하 애니메이션
  const card = document.querySelector(`[data-reward-id="${reward.id}"]`);
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
      showRewardModal();
    });

    // 자주 총 개수 렌더링
    await renderTotalJaju();

    // 첫 번째 목표의 id만 currentGoalId로 세팅
    const goals = await getGoals();
    if (goals.length > 0) {
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

// 보상 추가 모달 생성 및 표시
function showRewardModal() {
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
    <div class="modal-content" style="background: var(--card-background); border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 400px; width: 90%;">
      <h2 style="margin-bottom: 1.5rem;">리워드 추가</h2>
      <form id="rewardFormElement">
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label for="rewardName" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">리워드 이름</label>
          <input type="text" id="rewardName" required placeholder="예: 아이스크림" style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem; background: #f2f2f2;" />
        </div>
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label for="rewardCost" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">필요 자주</label>
          <input type="number" id="rewardCost" required min="1" placeholder="예: 10" style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem; background: #f2f2f2;" />
        </div>
        <div class="form-actions" style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: center;">
          <button type="button" id="cancelBtn" class="btn-secondary" style="width: 100%; background: #e0e0e0; color: var(--text-color); border-radius: 6px; padding: 0.8rem 1.5rem; font-weight: 600;">취소</button>
          <button type="submit" class="btn-primary" style="width: 100%; background: var(--primary-color); color: white; border-radius: 6px; padding: 0.8rem 1.5rem; font-weight: 600;">저장</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const form = modal.querySelector("#rewardFormElement");
  const cancelBtn = modal.querySelector("#cancelBtn");

  cancelBtn.addEventListener("click", () => {
    modal.remove();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = form.querySelector("#rewardName").value.trim();
    const cost = parseInt(form.querySelector("#rewardCost").value);
    if (!title) {
      window.toast.show("리워드 이름을 입력하세요.", "error");
      return;
    }
    if (isNaN(cost) || cost <= 0) {
      window.toast.show("유효한 자주 비용을 입력하세요.", "error");
      return;
    }
    try {
      await addItem(STORES.REWARDS, { title, cost });
      window.toast.show("리워드가 추가되었습니다.", "success");
      modal.remove();
      await renderRewards();
    } catch (error) {
      window.toast.show("리워드 저장에 실패했습니다.", "error");
    }
  });
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", initialize);

// 보상 사용, 추가, 삭제, 구매 등 이후에도 자주 총 개수 갱신
// renderRewards, claimReward, addRewardHistory 등에서 await renderTotalJaju() 호출 추가
const _origRenderRewards = renderRewards;
renderRewards = async function () {
  await _origRenderRewards.apply(this, arguments);
  await renderTotalJaju();
};
