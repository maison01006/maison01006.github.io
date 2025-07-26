import { initDB, addItem, STORES, updateItem, getItemsByTitle } from "./db.js";

// DOM 요소
const steps = document.querySelectorAll(".step");
const stepDots = document.querySelectorAll(".step-dot");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const startButton = document.getElementById("startButton");

// 날짜 선택기 요소들
const yearSelect = document.getElementById("yearSelect");
const monthSelect = document.getElementById("monthSelect");
const daySelect = document.getElementById("daySelect");

// 현재 스텝
let currentStep = 1;
const totalSteps = steps.length;

// 날짜 선택기 초기화
function initializeDateSelectors() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // 연도 옵션 생성 (현재 연도부터 10년 후까지)
  for (let year = currentYear; year <= currentYear + 10; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year + "년";
    yearSelect.appendChild(option);
  }

  // 월 옵션 생성
  for (let month = 1; month <= 12; month++) {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month + "월";
    monthSelect.appendChild(option);
  }

  // 일 옵션 생성 (기본적으로 31일까지)
  updateDayOptions(currentYear, currentMonth);

  // 오늘 날짜로 초기 설정
  yearSelect.value = currentYear;
  monthSelect.value = currentMonth;
  daySelect.value = currentDay;

  // 월 변경 시 일 옵션 업데이트
  monthSelect.addEventListener("change", () => {
    const selectedYear = parseInt(yearSelect.value);
    const selectedMonth = parseInt(monthSelect.value);
    updateDayOptions(selectedYear, selectedMonth);
  });

  // 연도 변경 시 일 옵션 업데이트 (윤년 고려)
  yearSelect.addEventListener("change", () => {
    const selectedYear = parseInt(yearSelect.value);
    const selectedMonth = parseInt(monthSelect.value);
    updateDayOptions(selectedYear, selectedMonth);
  });
}

// 일 옵션 업데이트 (윤년, 월별 일수 고려)
function updateDayOptions(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = new Date().getDate();

  // 기존 옵션 제거
  daySelect.innerHTML = "";

  // 일 옵션 생성
  for (let day = 1; day <= daysInMonth; day++) {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day + "일";
    daySelect.appendChild(option);
  }

  // 현재 월이면 현재 일까지만 선택 가능하도록 설정
  const today = new Date();
  if (year === today.getFullYear() && month === today.getMonth() + 1) {
    daySelect.value = Math.min(currentDay, daysInMonth);
  } else {
    daySelect.value = 1;
  }
}

// 선택된 날짜를 ISO 형식으로 반환
function getSelectedDate() {
  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);
  const day = parseInt(daySelect.value);

  // 월과 일을 2자리로 포맷팅
  const formattedMonth = month.toString().padStart(2, "0");
  const formattedDay = day.toString().padStart(2, "0");

  return `${year}-${formattedMonth}-${formattedDay}`;
}

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
  const requiredSelects =
    currentStepElement.querySelectorAll("select[required]");

  // input 검증
  for (const input of requiredInputs) {
    if (!input.value.trim()) {
      input.focus();
      return false;
    }
  }

  // select 검증 (날짜 선택기)
  for (const select of requiredSelects) {
    if (!select.value) {
      select.focus();
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
  const selectedEndDate = getSelectedDate();

  // 목표 저장
  const goal = document.getElementById("userGoal").value.trim();

  await addItem(STORES.GOALS, {
    title: goal,
    date: today,
    startDate: today,
    endDate: selectedEndDate,
  });

  // 보상 저장
  const rewardName = document.getElementById("rewardName").value.trim();
  const rewardCost = parseInt(document.getElementById("rewardCost").value);
  await addItem(STORES.REWARDS, {
    title: rewardName,
    cost: rewardCost,
    date: today,
  });

  // 할 일 저장
  const todo1 = document.getElementById("todo1").value.trim();
  await addItem(STORES.TODOS, {
    title: todo1,
    date: today,
    completed: false,
    goalId: "1",
  });
}

// 초기화
async function init() {
  await initDB();
  initializeDateSelectors(); // 날짜 선택기 초기화
  goToStep(1);
}

init();
