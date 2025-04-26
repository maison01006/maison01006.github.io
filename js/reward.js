import storage from "./storage.js";

class RewardManager {
  constructor() {
    this.rewards = [];
    this.failStack = 0;
    this.baseProbability = 10; // 기본 확률 50%
    this.init();
  }

  async init() {
    await this.loadRewards();
    this.setRewardBtn = document.getElementById("setReward");
    this.getRewardBtn = document.getElementById("getReward");
    this.probabilityDisplay = document.getElementById("rewardProbability");

    if (this.setRewardBtn) {
      this.setRewardBtn.addEventListener("click", () =>
        this.navigateToRewardSetting()
      );
    }
    if (this.getRewardBtn) {
      this.getRewardBtn.addEventListener("click", () => this.getReward());
    }

    this.updateProbabilityDisplay();
  }

  async loadRewards() {
    this.rewards = await storage.getRewards();
    if (this.rewards.length === 0) {
      // 기본 보상 설정
      this.rewards = [{ name: "꽝", probability: 10 }];
      for (const reward of this.rewards) {
        await storage.addReward(reward);
      }
    }
  }

  navigateToRewardSetting() {
    window.location.href = "reward.html";
  }

  async getReward() {
    const probability = this.calculateProbability();
    const random = Math.random() * 100;

    if (random < probability) {
      // 보상 획득
      const reward = this.selectReward();
      await this.addRewardHistory(reward);
      this.failStack = 0;
      window.location.href = `rewardResult.html?reward=${encodeURIComponent(
        reward.name
      )}`;
    } else {
      // 꽝
      this.failStack++;
      window.location.href = `rewardResult.html?reward=꽝`;
    }
  }

  calculateProbability() {
    let probability = this.baseProbability;

    // 꽝 스택에 따른 확률 감소
    probability -= this.failStack * 10;

    // 최소 확률 10% 보장
    return Math.max(10, probability);
  }

  selectReward() {
    const availableRewards = this.rewards.filter((r) => r.name !== "꽝");
    const random = Math.random() * 100;
    let sum = 0;

    for (const reward of availableRewards) {
      sum += reward.probability;
      if (random < sum) {
        return reward;
      }
    }

    return availableRewards[0];
  }

  async addRewardHistory(reward) {
    const history = {
      reward: reward.name,
      date: new Date().toISOString().split("T")[0],
    };
    await storage.addRewardHistory(history);
  }

  updateProbabilityDisplay() {
    if (this.probabilityDisplay) {
      const probability = this.calculateProbability();
      this.probabilityDisplay.textContent = `${probability}%`;
    }
  }

  async updateRewardProbabilities(newRewards) {
    this.rewards = newRewards;
    for (const reward of this.rewards) {
      await storage.updateReward(reward.id, reward);
    }
    this.updateProbabilityDisplay();
  }

  getFailStack() {
    return this.failStack;
  }

  resetFailStack() {
    this.failStack = 0;
    this.updateProbabilityDisplay();
  }
}

const rewardManager = new RewardManager();
export default rewardManager;
