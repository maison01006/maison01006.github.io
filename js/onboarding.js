import { initDB, addItem, STORES, updateItem, getItemsByTitle } from "./db.js";

// DOM 요소
const steps = document.querySelectorAll(".step");
const stepDots = document.querySelectorAll(".step-dot");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const startButton = document.getElementById("startButton");

// 현재 스텝
let currentStep = 1;
const totalSteps = steps.length;

// 스텝 이동 함수
function goToStep(stepNumber) {
  // 현재 스텝 비활성화
  steps[currentStep - 1].classList.remove("active");
  stepDots[currentStep - 1].classList.remove("active");

  // 새 스텝 활성화
  currentStep = stepNumber;
  steps[currentStep - 1].classList.add("active");
  stepDots[currentStep - 1].classList.add("active");

  // 버튼 상태 업데이트
  prevButton.disabled = currentStep === 1;
  nextButton.style.display = currentStep === totalSteps ? "none" : "block";
  startButton.style.display = currentStep === totalSteps ? "block" : "none";
}

// 이전 버튼 클릭
prevButton.addEventListener("click", () => {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  }
});

// 다음 버튼 클릭
nextButton.addEventListener("click", () => {
  if (currentStep < totalSteps) {
    // 현재 스텝의 입력값 검증
    if (validateCurrentStep()) {
      goToStep(currentStep + 1);
    }
  }
});

// 현재 스텝의 입력값 검증
function validateCurrentStep() {
  const currentStepElement = steps[currentStep - 1];
  const requiredInputs = currentStepElement.querySelectorAll("input[required]");

  for (const input of requiredInputs) {
    if (!input.value.trim()) {
      input.focus();
      return false;
    }
  }

  return true;
}

// 시작하기 버튼 클릭
startButton.addEventListener("click", async () => {
  if (validateCurrentStep()) {
    await saveOnboardingData();
    const onboarding = await getItemsByTitle(STORES.SETTINGS, "isOnboarding");
    onboarding.enabled = true;
    await updateItem(STORES.SETTINGS, onboarding);
    window.location.href = "index.html";
  }
});

// 온보딩 데이터 저장
async function saveOnboardingData() {
  const today = new Date().toISOString().split("T")[0];

  // 목표 저장
  const goal = document.getElementById("userGoal").value.trim();

  await addItem(STORES.GOALS, {
    title: goal,
    date: today,
  });

  // 보상 저장
  const rewardName = document.getElementById("rewardName").value.trim();
  const rewardCost = parseInt(document.getElementById("rewardCost").value);
  await addItem(STORES.REWARDS, {
    title: rewardName,
    cost: rewardCost,
    date: today,
    goalId: 1,
  });

  // 할 일 저장
  const todo1 = document.getElementById("todo1").value.trim();
  await addItem(STORES.TODOS, {
    title: todo1,
    date: today,
    completed: false,
    goalId: 1,
  });
}

// 초기화
async function init() {
  await initDB();
  goToStep(1);
}

init();
