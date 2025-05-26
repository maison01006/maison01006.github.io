// Toast Message Component
export class Toast {
  constructor() {
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
  }

  show(message, type = "default", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // 아이콘 설정
    const icon = document.createElement("span");
    icon.className = "toast-icon";
    switch (type) {
      case "success":
        icon.textContent = "✓";
        break;
      case "error":
        icon.textContent = "✕";
        break;
      case "warning":
        icon.textContent = "!";
        break;
      case "info":
        icon.textContent = "i";
        break;
      default:
        icon.textContent = "•";
    }

    // 메시지 설정
    const text = document.createElement("span");
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    this.container.appendChild(toast);

    // 애니메이션을 위한 setTimeout
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // 자동 제거
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        this.container.removeChild(toast);
      }, 300);
    }, duration);
  }
}

// Header Navigation Component
export class HeaderNav {
  constructor(title, showBackButton = true) {
    this.header = document.createElement("header");
    this.header.className = "header-nav";

    if (showBackButton) {
      const backButton = document.createElement("button");
      backButton.className = "back-button";
      backButton.innerHTML = "←";
      backButton.onclick = () => history.back();
      this.header.appendChild(backButton);
    }

    if (title) {
      const titleElement = document.createElement("h1");
      titleElement.className = "header-title";
      titleElement.textContent = title;
      this.header.appendChild(titleElement);
    }
  }

  mount(container) {
    container.insertBefore(this.header, container.firstChild);
  }
}

// Bottom Tab Navigation Component
export class BottomTabNav {
  constructor(activeTab) {
    this.nav = document.createElement("nav");
    this.nav.className = "bottom-tab-nav";

    const tabs = [
      { id: "home", icon: "🏠", label: "홈", path: "index.html" },
      { id: "store", icon: "🎁", label: "스토어", path: "store.html" },
      { id: "calendar", icon: "📅", label: "캘린더", path: "calendar.html" },
      { id: "more", icon: "⚙️", label: "더보기", path: "more.html" },
    ];

    tabs.forEach((tab) => {
      const link = document.createElement("a");
      link.href = tab.path;
      link.className = `tab-item ${tab.id === activeTab ? "active" : ""}`;

      const icon = document.createElement("span");
      icon.className = "tab-icon";
      icon.textContent = tab.icon;

      const label = document.createElement("span");
      label.textContent = tab.label;

      link.appendChild(icon);
      link.appendChild(label);
      this.nav.appendChild(link);
    });
  }

  mount(container) {
    container.appendChild(this.nav);
  }
}

// 페이지 컨텐츠를 위한 래퍼 컴포넌트
export class PageWrapper {
  constructor() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "main-content";
  }

  mount(container) {
    // 기존 컨텐츠를 래퍼로 이동
    while (container.firstChild) {
      this.wrapper.appendChild(container.firstChild);
    }
    container.appendChild(this.wrapper);
  }
}
