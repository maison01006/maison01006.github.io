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

// 폼 제출 처리
async function handleFormSubmit(event) {
  event.preventDefault();

  const reward = {
    title: rewardNameInput.value.trim(),
    cost: parseInt(rewardCostInput.value),
    goalId: parseInt(getGoalIdFromUrl()),
  };

  try {
    await addItem(STORES.REWARDS, reward);
  } catch (error) {
    console.error("리워드 저장 실패:", error);
    alert("리워드 저장에 실패했습니다.");
  }
}

// 이벤트 리스너
rewardFormElement.addEventListener("submit", handleFormSubmit);

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
  } catch (error) {
    console.error("초기화 실패:", error);
    alert("페이지 초기화에 실패했습니다.");
  }
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", initialize);
