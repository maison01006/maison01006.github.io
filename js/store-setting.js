import {
  STORES,
  initDB,
  addItem,
  getDB,
  getItem,
  updateItem,
  deleteItem,
} from "./db.js";

// DOM 요소
const rewardForm = document.getElementById("rewardForm");
const rewardFormElement = document.getElementById("rewardFormElement");
const addRewardBtn = document.getElementById("addRewardBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const cancelBtn = document.getElementById("cancelBtn");
const rewardList = document.getElementById("rewardList");
const deleteModal = document.getElementById("deleteModal");
const confirmDelete = document.getElementById("confirmDelete");
const cancelDelete = document.getElementById("cancelDelete");

// 폼 필드
const rewardIdInput = document.getElementById("rewardId");
const rewardNameInput = document.getElementById("rewardName");
const rewardCostInput = document.getElementById("rewardCost");
const rewardIconInput = document.getElementById("rewardIcon");
const rewardColorInput = document.getElementById("rewardColor");
const iconPreview = document.getElementById("iconPreview");

let currentGoalId = null;
let db = null;

// URL에서 목표 ID 가져오기
function getGoalIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("goalId");
}

// 폼 표시/숨김
function showForm(isEdit = false) {
  rewardForm.style.display = "block";
  document.getElementById("formTitle").textContent = isEdit
    ? "리워드 수정"
    : "새 리워드 추가";
  if (!isEdit) {
    rewardFormElement.reset();
    currentGoalId = null;
  }
}

function hideForm() {
  rewardForm.style.display = "none";
  rewardFormElement.reset();
  currentGoalId = null;
}

// 아이콘 미리보기 업데이트
function updateIconPreview() {
  const iconClass = rewardIconInput.value.trim() || "fa-gift";
  iconPreview.innerHTML = `<i class="fas ${iconClass}"></i>`;
}

// 리워드 항목 생성
function createRewardItem(reward) {
  const item = document.createElement("div");
  item.className = "reward-item";
  item.innerHTML = `
        <div class="reward-info">
            <div class="reward-icon" style="background-color: ${
              reward.color || "#4A90E2"
            }">
                <i class="fas ${reward.icon || "fa-gift"}"></i>
            </div>
            <div class="reward-details">
                <span class="reward-name">${reward.title}</span>
                <span class="reward-cost">${reward.cost} 자주</span>
            </div>
        </div>
        <div class="reward-actions">
            <button class="btn-icon edit-btn" title="수정">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete-btn" title="삭제">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

  // 수정 버튼 이벤트
  item.querySelector(".edit-btn").addEventListener("click", () => {
    editReward(reward);
  });

  // 삭제 버튼 이벤트
  item.querySelector(".delete-btn").addEventListener("click", () => {
    showDeleteModal(reward.goalId);
  });

  return item;
}

// 리워드 수정
async function editReward(reward) {
  currentGoalId = reward.id;
  rewardNameInput.value = reward.title;
  rewardCostInput.value = reward.cost;
  rewardIconInput.value = reward.icon || '';
  rewardColorInput.value = reward.color || '#4A90E2';
  updateIconPreview();
  showForm(true);
}

// 삭제 모달 표시
function showDeleteModal(rewardId) {
  currentGoalId = rewardId;
  deleteModal.classList.add("active");
}

// 리워드 목록 새로고침
async function refreshRewardList(goalId) {
  try {
    const transaction = db.transaction([STORES.REWARDS], "readonly");
    const store = transaction.objectStore(STORES.REWARDS);
    const index = store.index("goalId");
    const request = index.getAll(parseInt(goalId));

    request.onsuccess = () => {
      rewardList.innerHTML = "";
      const rewards = request.result;

      console.log('리워드 목록:', rewards);
      console.log('현재 목표 ID:', goalId);

      if (rewards.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "등록된 리워드가 없습니다.";
        rewardList.appendChild(emptyMessage);
        return;
      }

      rewards.forEach((reward) => {
        rewardList.appendChild(createRewardItem(reward));
      });
    };
  } catch (error) {
    console.error("리워드 목록 로드 실패:", error);
    alert("리워드 목록을 불러오는데 실패했습니다.");
  }
}

// 폼 제출 처리
async function handleFormSubmit(event) {
  event.preventDefault();

  const reward = {
    title: rewardNameInput.value.trim(),
    cost: parseInt(rewardCostInput.value),
    goalId: parseInt(getGoalIdFromUrl()),
    icon: rewardIconInput.value.trim() || 'fa-gift',
    color: rewardColorInput.value || '#4A90E2'
  };

  try {
    if (currentGoalId) {
      reward.id = parseInt(currentGoalId);
      await updateItem(STORES.REWARDS, reward);
    } else {
      await addItem(STORES.REWARDS, reward);
    }

    hideForm();
    refreshRewardList(getGoalIdFromUrl());
  } catch (error) {
    console.error("리워드 저장 실패:", error);
    alert("리워드 저장에 실패했습니다.");
  }
}

// 삭제 처리
async function handleDelete() {
  if (!currentGoalId) return;

  try {
    await deleteItem(STORES.REWARDS, currentGoalId);
    deleteModal.classList.remove("active");
    refreshRewardList();
  } catch (error) {
    console.error("리워드 삭제 실패:", error);
    alert("리워드 삭제에 실패했습니다.");
  }
}

// 이벤트 리스너
addRewardBtn.addEventListener("click", () => showForm());
closeFormBtn.addEventListener("click", hideForm);
cancelBtn.addEventListener("click", hideForm);
rewardFormElement.addEventListener("submit", handleFormSubmit);
rewardIconInput.addEventListener("input", updateIconPreview);
confirmDelete.addEventListener("click", handleDelete);
cancelDelete.addEventListener("click", () => {
  deleteModal.classList.remove("active");
  currentGoalId = null;
});

// 초기화
async function initialize() {
  try {
    await initDB();
    db = await getDB();

    // URL에서 목표 ID 가져오기
    currentGoalId = getGoalIdFromUrl();

    // 목표 ID가 없으면 이전 페이지로 이동
    if (!currentGoalId) {
      alert("잘못된 접근입니다.");
      window.location.href = "store.html";
      return;
    }

    refreshRewardList(currentGoalId);
    hideForm();
  } catch (error) {
    console.error("초기화 실패:", error);
    alert("페이지 초기화에 실패했습니다.");
  }
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", initialize);
