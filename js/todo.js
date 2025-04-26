import storage from "./storage.js";
import { getKoreanDateString } from "./utils.js";

class TodoManager {
  constructor() {
    // 현재 페이지가 calendar.html인 경우 초기화를 건너뜁니다.
    if (window.location.pathname.includes("calendar.html")) {
      return;
    }

    this.todoInput = document.getElementById("todoInput");
    this.addTodoBtn = document.getElementById("addTodoBtn");
    this.todoList = document.getElementById("todoList");
    this.getRewardBtn = document.getElementById("getRewardButton");
    this.today = getKoreanDateString(new Date());

    this.init();
  }

  async init() {
    // 필요한 요소들이 없는 경우 초기화를 건너뜁니다.
    if (
      !this.todoInput ||
      !this.addTodoBtn ||
      !this.todoList ||
      !this.getRewardBtn
    ) {
      return;
    }

    await this.loadTodos();
  }

  async addTodo() {
    const text = this.todoInput.value.trim();
    if (!text) return;

    const todo = {
      text,
      completed: false,
      date: this.today,
    };

    await storage.addTodo(todo);
    this.todoInput.value = "";
    await this.loadTodos();
    this.updateRewardButton();
  }

  async loadTodos() {
    const today = this.today;
    const todos = await storage.getTodos(today);

    this.todoList.innerHTML = "";
    todos.forEach((todo) => {
      const li = this.createTodoElement(todo);
      this.todoList.appendChild(li);
    });

    this.updateRewardButton();
  }

  createTodoElement(todo) {
    const li = document.createElement("li");
    li.innerHTML = `
            <input type="checkbox" ${todo.completed ? "checked" : ""}>
            <span class="todo-text ${todo.completed ? "completed" : ""}">${
      todo.text
    }</span>
            <button class="delete-btn">삭제</button>
        `;

    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", () =>
      this.toggleTodo(todo.id, checkbox.checked)
    );

    const deleteBtn = li.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => this.deleteTodo(todo.id));

    return li;
  }

  async toggleTodo(id, completed) {
    const today = this.today;
    const todos = await storage.getTodos(today);
    const todo = todos.find((t) => t.id === id);

    if (todo) {
      todo.completed = completed;
      await storage.updateTodo(id, todo);
      await this.loadTodos();
    }
  }

  async deleteTodo(id) {
    await storage.deleteTodo(id);
    await this.loadTodos();
  }

  async updateRewardButton() {
    if (!this.getRewardBtn) return;

    const today = this.today;
    const todos = await storage.getTodos(today);

    const allCompleted =
      todos.length > 0 && todos.every((todo) => todo.completed);
    this.getRewardBtn.disabled = !allCompleted;

    console.log(allCompleted);
  }

  async getCompletedTodos() {
    const today = this.today;
    const todos = await storage.getTodos(today);
    return todos.filter((todo) => todo.completed);
  }
}

const todoManager = new TodoManager();
export default todoManager;
