const CACHE_NAME = "reward-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/html/index.html",
  "/html/rewardBox.html",
  "/html/settings.html",
  "/html/onboarding.html",
  "/css/global_style.css",
  "/css/index.css",
  "/css/reward-box.css",
  "/css/reward-settings.css",
  "/css/onboarding.css",
  "/js/index.js",
  "/js/storage.js",
  "/js/utils.js",
  "/js/todo.js",
  "/js/reward.js",
  "/js/service-worker.js",
  "/assets/icons/home.svg",
  "/assets/icons/gift.svg",
  "/assets/icons/settings.svg",
  "/assets/icons/calendar.svg",
  "/assets/icons/close.svg",
  "/assets/icons/edit.svg",
  "/assets/icons/more.svg",
  "/assets/icons/delete.svg",
  "/assets/icons/history.svg",
  "/assets/icons/app-logo.svg",
  "/assets/icons/todo.svg",
  "/assets/icons/reward.svg",
  "/assets/icons/use-reward.svg",
  "/assets/icons/icon128.png",
  "/assets/icons/icon192.png",
  "/assets/icons/icon512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에서 찾으면 캐시된 응답 반환
      if (response) {
        return response;
      }

      // 캐시에 없으면 네트워크 요청
      return fetch(event.request).then((response) => {
        // 유효한 응답이 아니면 그대로 반환
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // 응답을 복제하여 캐시에 저장
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
