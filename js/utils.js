// 날짜 포맷팅
export function formatDate(date) {
  // 문자열인 경우 Date 객체로 변환
  if (typeof date === "string") {
    date = new Date(date);
  }

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return date.toLocaleDateString("ko-KR", options);
}

// 시간 포맷팅
export function formatTime(date) {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 날짜 문자열로 변환 (YYYY-MM-DD)
export function formatDateString(date) {
  return date.toISOString().split("T")[0];
}

// 오늘 날짜 확인
export function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// 어제 날짜 가져오기
export function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

// 날짜 범위 내의 모든 날짜 가져오기
export function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// 랜덤 숫자 생성 (min ~ max)
export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 확률 기반 랜덤 선택
export function getRandomByProbability(items) {
  const total = items.reduce((sum, item) => sum + item.probability, 0);
  const random = Math.random() * total;
  let sum = 0;

  for (const item of items) {
    sum += item.probability;
    if (random < sum) {
      return item;
    }
  }

  return items[items.length - 1];
}

// 로컬 스토리지에 데이터 저장
export function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("로컬 스토리지 저장 실패:", error);
    return false;
  }
}

// 로컬 스토리지에서 데이터 로드
export function loadFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("로컬 스토리지 로드 실패:", error);
    return null;
  }
}

// 로컬 스토리지에서 데이터 삭제
export function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("로컬 스토리지 삭제 실패:", error);
    return false;
  }
}

// 디바운스 함수
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 쿠키 설정
export function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

// 쿠키 가져오기
export function getCookie(name) {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return "";
}

// 쿠키 삭제
export function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// 한국 시간으로 날짜 문자열 생성 함수
export function getKoreanDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
