import { getDB, initDB, getItemsByDate } from "./db.js";

let db = null;

// 알림 설정 저장
const saveNotificationSetting = async (enabled) => {
  const tx = db.transaction("settings", "readwrite");
  const store = tx.objectStore("settings");
  await store.put({ id: "notifications", enabled });
};

// 알림 설정 불러오기
const loadNotificationSetting = async () => {
  const tx = db.transaction("settings", "readonly");
  const store = tx.objectStore("settings");
  const setting = await store.get("notifications");

  console.log(store);
  console.log(setting);

  return setting?.enabled ?? false;
};

// 데이터 내보내기 (JSON)
const exportToJson = async () => {
  const data = {
    settings: await getAllSettings(),
    // 여기에 다른 데이터도 추가할 수 있습니다
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jaju-export-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// PDF 내보내기
const exportToPdf = async () => {
  // PDF 생성 로직은 여기에 구현
  alert("PDF 내보내기 기능은 아직 구현되지 않았습니다.");
};

// 모든 설정 가져오기
const getAllSettings = async () => {
  const tx = db.transaction("settings", "readonly");
  const store = tx.objectStore("settings");
  const settings = await store.getAll();
  return settings.reduce((acc, setting) => {
    acc[setting.id] = setting;
    return acc;
  }, {});
};

// 알림 토글 이벤트 처리
const handleNotificationToggle = async (event) => {
  const enabled = event.target.checked;
  await saveNotificationSetting(enabled);

  if (enabled) {
    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      event.target.checked = false;
      await saveNotificationSetting(false);
      alert("알림 권한이 필요합니다.");
    }
  }
};

// 초기화
const init = async () => {
  try {
    await initDB();
    db = await getDB();
    // 알림 설정 불러오기
    const notificationToggle = document.getElementById("notificationToggle");
    notificationToggle.checked = await loadNotificationSetting();
    notificationToggle.addEventListener("change", handleNotificationToggle);

    // 내보내기 버튼 이벤트
    document
      .getElementById("exportJson")
      .addEventListener("click", exportToJson);
    document.getElementById("exportPdf").addEventListener("click", exportToPdf);
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    alert("앱 초기화 중 오류가 발생했습니다.");
  }
};

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", init);
