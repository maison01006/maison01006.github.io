class Storage {
  constructor() {
    this.dbName = "RewardAppDB";
    this.dbVersion = 2;
    this.db = null;
    this.initialized = false;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("데이터베이스 열기 실패");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Todo 저장소
        if (!db.objectStoreNames.contains("todos")) {
          const todoStore = db.createObjectStore("todos", {
            keyPath: "id",
            autoIncrement: true,
          });
          todoStore.createIndex("date", "date", { unique: false });
        }

        // 보상 저장소
        if (!db.objectStoreNames.contains("rewards")) {
          const rewardStore = db.createObjectStore("rewards", {
            keyPath: "id",
            autoIncrement: true,
          });
          rewardStore.createIndex("name", "name", { unique: true });
        }

        // 보상 사용 기록 저장소
        if (!db.objectStoreNames.contains("rewardHistory")) {
          const historyStore = db.createObjectStore("rewardHistory", {
            keyPath: "id",
            autoIncrement: true,
          });
          historyStore.createIndex("date", "date", { unique: false });
        }

        // 획득한 보상 저장소
        if (!db.objectStoreNames.contains("earnedRewards")) {
          const earnedRewardsStore = db.createObjectStore("earnedRewards", {
            keyPath: "id",
            autoIncrement: true,
          });
          earnedRewardsStore.createIndex("date", "date", { unique: false });
        }

        // 앱 설정 저장소
        if (!db.objectStoreNames.contains("appSettings")) {
          const settingsStore = db.createObjectStore("appSettings", {
            keyPath: "key",
          });
        }
      };
    });
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  // 온보딩 상태 저장
  async setItem(key, value) {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction("appSettings", "readwrite");
      const store = transaction.objectStore("appSettings");
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 온보딩 상태 불러오기
  async getItem(key) {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction("appSettings", "readonly");
      const store = transaction.objectStore("appSettings");
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getTodos(date) {
    await this.ensureInitialized();
    return this.getAll("todos", "date", date);
  }

  async getRewardHistory(date) {
    await this.ensureInitialized();
    return this.getAll("rewardHistory", "date", date);
  }

  async getEarnedRewards() {
    await this.ensureInitialized();
    return this.getAll("earnedRewards");
  }

  async getRewards() {
    await this.ensureInitialized();
    return this.getAll("rewards");
  }

  async addTodo(todo) {
    await this.ensureInitialized();
    return this.add("todos", todo);
  }

  async updateTodo(id, todo) {
    await this.ensureInitialized();
    return this.update("todos", id, todo);
  }

  async deleteTodo(id) {
    await this.ensureInitialized();
    return this.delete("todos", id);
  }

  async addRewardHistory(history) {
    await this.ensureInitialized();
    return this.add("rewardHistory", history);
  }

  async addEarnedReward(reward) {
    await this.ensureInitialized();
    return this.add("earnedRewards", reward);
  }

  async addReward(reward) {
    await this.ensureInitialized();
    return this.add("rewards", reward);
  }

  async updateReward(id, reward) {
    await this.ensureInitialized();
    return this.update("rewards", id, reward);
  }

  async deleteReward(id) {
    await this.ensureInitialized();
    return this.delete("rewards", id);
  }

  async updateEarnedReward(id, reward) {
    await this.ensureInitialized();
    return this.update("earnedRewards", id, reward);
  }

  async add(storeName, item) {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, indexName = null, value = null) {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      let request;

      if (indexName && value) {
        const index = store.index(indexName);
        request = index.getAll(value);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, id, item) {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put({ ...item, id });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const storage = new Storage();
export default storage;
