const CACHE_NAME = "reward-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/calendar.html",
  "/goal.html",
  "/onboarding.html",
  "/more.html",
  "/store-setting.html",
  "/store.html",
  "/css/global.css",
  "/css/goal.css",
  "/css/calendar.css",
  "/css/more.css",
  "/css/store-setting.css",
  "/css/store.css",
  "/css/index.css",
  "/css/onboarding.css",
  "/js/index.js",
  "/js/calendar.js",
  "/js/goal.js",
  "/js/more.js",
  "/js/store-setting.js",
  "/js/store.js",
  "/js/onboarding.js",
  "/js/db.js",
  "/assets/icons/calendar.svg",
  "/assets/icons/close.svg",
  "/assets/icons/delete.svg",
  "/assets/icons/edit.svg",
  "/assets/icons/gift.svg",
  "/assets/icons/history.svg",
  "/assets/icons/home.svg",
  "/assets/icons/more.svg",
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
  // chrome-extension 스키마의 요청은 캐시하지 않음
  if (event.request.url.startsWith("chrome-extension://")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에서 찾으면 캐시된 응답 반환
      if (response) {
        return response;
      }

      // 캐시에 없으면 네트워크 요청
      return fetch(event.request)
        .then((response) => {
          // 유효한 응답이 아니면 그대로 반환
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // 응답을 복제하여 캐시에 저장
          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache).catch((error) => {
                console.error("캐시 저장 실패:", error);
              });
            })
            .catch((error) => {
              console.error("캐시 열기 실패:", error);
            });

          return response;
        })
        .catch((error) => {
          console.error("네트워크 요청 실패:", error);
          // 오프라인 페이지나 대체 콘텐츠를 반환할 수 있음
          // 예: return caches.match('/offline.html');
        });
    })
  );
});
