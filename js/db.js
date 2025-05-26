const DB_NAME = "todoRewardDB";
const DB_VERSION = 1;

export const STORES = {
  TODOS: "todos",
  REWARDS: "rewards",
  USAGE: "usage",
  PROGRESS: "progress",
  GOALS: "goals",
  SETTINGS: "settings",
};

let db = null;

// 데이터베이스 초기화 함수
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 할 일 스토어
      const todosStore = db.createObjectStore(STORES.TODOS, {
        keyPath: "goalId",
        autoIncrement: false,
      });
      todosStore.createIndex("date", "date", { unique: false });
      todosStore.createIndex("completed", "completed", { unique: false });

      // 목표 스토어
      const goalsStore = db.createObjectStore(STORES.GOALS, {
        keyPath: "id",
        autoIncrement: true,
      });
      goalsStore.createIndex("date", "date", { unique: false });
      goalsStore.createIndex("completed", "completed", { unique: false });

      // 보상 스토어
      const rewardsStore = db.createObjectStore(STORES.REWARDS, {
        keyPath: "goalId",
        autoIncrement: false,
      });
      rewardsStore.createIndex("date", "date", { unique: false });
      rewardsStore.createIndex("cost", "cost", { unique: false });

      // 보상 사용 기록 스토어
      const usageStore = db.createObjectStore(STORES.USAGE, {
        keyPath: "goalId",
        autoIncrement: false,
      });
      usageStore.createIndex("date", "date", { unique: false });
      usageStore.createIndex("rewardId", "rewardId", { unique: false });

      // 진행 상황 스토어 (자주 획득 기록)
      const progressStore = db.createObjectStore(STORES.PROGRESS, {
        keyPath: "goalId",
        autoIncrement: false,
      });
      progressStore.createIndex("date", "date", { unique: false });
      const settingsStore = db.createObjectStore(STORES.SETTINGS, {
        keyPath: "id",
        autoIncrement: true,
      });
      settingsStore.createIndex("title", "title", { unique: true }); // 날짜별로 유니크하게 설정

      // 초기 설정값 추가
      settingsStore.put({ title: "notifications", enabled: false });
      settingsStore.put({ title: "isOnboarding", enabled: false });
      settingsStore.put({ title: "isFirstLogin", enabled: true });
      settingsStore.put({ title: "isInstall", enabled: false });
    };
  });
}

export async function getDB() {
  return db;
}

// CRUD 작업을 위한 기본 함수들
export async function addItem(storeName, item) {
  return new Promise((resolve, reject) => {
    console.log(storeName, item);
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getItem(storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateItem(storeName, item) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteItem(storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 날짜별 조회를 위한 함수
export async function getItemsByDate(storeName, date) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index("date");
    const request = index.getAll(date);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 날짜별 조회를 위한 함수
export async function getItemsByTitle(storeName, title) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index("title");
    const request = index.get(title);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getItemsByAll(storeName) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(`${storeName} 데이터:`, request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`${storeName} 데이터 조회 실패:`, request.error);
        reject(request.error);
      };
    } catch (error) {
      console.error(`${storeName} 트랜잭션 생성 실패:`, error);
      reject(error);
    }
  });
}

// 오늘의 자주 획득 여부 확인
export async function checkTodayProgress(goalId) {
  const today = new Date().toISOString().split("T")[0];
  const progress = await getItemsByDate(STORES.PROGRESS, today);
  return progress.some((p) => p.goalId === goalId);
}

// 보상 구매 시 자주 차감
export async function purchaseReward(rewardId) {
  const reward = await getItem(STORES.REWARDS, rewardId);
  if (!reward) throw new Error("보상을 찾을 수 없습니다.");

  const today = new Date().toISOString().split("T")[0];
  const progress = await getItemsByDate(STORES.PROGRESS, today);

  if (progress.length === 0) throw new Error("오늘 획득한 자주가 없습니다.");

  // 해당 목표의 자주 확인
  const goalProgress = progress.find((p) => p.goalId === reward.goalId);
  if (!goalProgress) throw new Error("해당 목표의 자주가 없습니다.");
  if (goalProgress.amount < reward.cost) throw new Error("자주가 부족합니다.");

  // 자주 차감
  goalProgress.amount -= reward.cost;
  await updateItem(STORES.PROGRESS, goalProgress);

  // 사용 기록 추가
  await addItem(STORES.USAGE, {
    rewardId,
    date: today,
    cost: reward.cost,
    goalId: reward.goalId,
  });

  return true;
}
