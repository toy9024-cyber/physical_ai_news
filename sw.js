// 피지컬 AI 뉴스 Service Worker
const CACHE_NAME = "physical-ai-news-v1";
const STATIC_ASSETS = [
  "/physical_ai_news/",
  "/physical_ai_news/index.html",
  "/physical_ai_news/manifest.json"
];

// 설치: 정적 파일 캐시
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화: 오래된 캐시 삭제
self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 요청 처리: 네트워크 우선, 실패 시 캐시
self.addEventListener("fetch", function(e) {
  // 뉴스 API 요청은 캐시 안 함 (항상 최신 데이터)
  if (e.request.url.indexOf("script.google.com") !== -1) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // 성공한 응답은 캐시에 저장
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        // 오프라인이면 캐시에서 반환
        return caches.match(e.request).then(function(cached) {
          if (cached) return cached;
          // 캐시도 없으면 오프라인 안내
          if (e.request.destination === "document") {
            return caches.match("/physical_ai_news/index.html");
          }
        });
      })
  );
});
