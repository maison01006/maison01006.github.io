import storage from "./storage.js";
import { formatDate, getKoreanDateString, isToday } from "./utils.js";

class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.init();
  }

  async init() {
    this.renderCalendar();
    this.setupEventListeners();
    await this.loadSelectedDateData();
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // 달력 헤더 업데이트
    document.querySelector(".calendar-header h2").textContent = `${year}년 ${
      month + 1
    }월`;

    // 요일 헤더 렌더링
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekdaysContainer = document.querySelector(".calendar-weekdays");
    weekdaysContainer.innerHTML = weekdays
      .map((day) => `<div class="weekday">${day}</div>`)
      .join("");

    // 날짜 그리드 렌더링
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysContainer = document.querySelector(".calendar-days");
    daysContainer.innerHTML = "";

    // 첫 번째 날의 요일만큼 빈 칸 추가
    for (let i = 0; i < firstDay.getDay(); i++) {
      daysContainer.appendChild(document.createElement("div"));
    }

    // 날짜 채우기
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";
      dayElement.textContent = day;

      if (isToday(date)) {
        dayElement.classList.add("today");
      }

      if (this.isSameDate(date, this.selectedDate)) {
        dayElement.classList.add("selected");
      }

      dayElement.addEventListener("click", () => this.selectDate(date));
      daysContainer.appendChild(dayElement);
    }
  }

  setupEventListeners() {
    // 이전/다음 달 버튼
    document.getElementById("prevMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });
  }

  async loadSelectedDateData() {
    const dateStr = getKoreanDateString(this.selectedDate);

    // 선택된 날짜 표시 업데이트
    document.getElementById("selectedDate").textContent = formatDate(
      this.selectedDate
    );

    // dayContent 요소 가져오기
    const dayContent = document.getElementById("dayContent");

    // 할 일 목록과 보상 목록을 표시할 요소 생성
    dayContent.innerHTML = `
      <div class="todo-list"></div>
      <div class="reward-list"></div>
    `;

    // 할 일 목록 로드
    const todos = await storage.getTodos(dateStr);
    this.renderTodos(todos);

    // 보상 목록 로드
    const rewards = await storage.getRewardHistory(dateStr);
    this.renderRewards(rewards);
  }

  renderTodos(todos) {
    const todoList = document.querySelector(".todo-list");
    todoList.innerHTML = todos
      .map(
        (todo) => `
          <div class="todo-item ${todo.completed ? "completed" : ""}">
            <input type="checkbox" ${todo.completed ? "checked" : ""} disabled>
            <span>${todo.text}</span>
          </div>
        `
      )
      .join("");
  }

  renderRewards(rewards) {
    const rewardList = document.querySelector(".reward-list");
    rewardList.innerHTML = rewards
      .map(
        (reward) => `
          <div class="reward-item">
            <img src="${reward.image}" alt="${reward.name}">
            <span>${reward.name}</span>
          </div>
        `
      )
      .join("");
  }

  selectDate(date) {
    this.selectedDate = date;
    this.renderCalendar();
    this.loadSelectedDateData();
  }

  isSameDate(date1, date2) {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }
}

// 달력 매니저 초기화
const calendarManager = new CalendarManager();
