// 앱 껍데기를 캐시해서 오프라인에서도 열리게 해요. 데이터는 Firestore가 따로 오프라인 캐시해요.
const CACHE = "camstudy-v1";
const SHELL = ["./", "index.html", "firebase-config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Firestore/Auth 통신은 건드리지 않아요.
  if (url.hostname.endsWith("googleapis.com") && !url.hostname.startsWith("fonts.")) return;
  const sameOrigin = url.origin === location.origin;
  const cacheable = sameOrigin || url.hostname === "www.gstatic.com" || url.hostname.startsWith("fonts.");
  if (!cacheable) return;
  // 네트워크 우선, 실패하면 캐시 (새 버전이 바로 반영되도록)
  e.respondWith(
    fetch(req).then((res) => {
      if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: sameOrigin }).then((r) => r || caches.match("index.html")))
  );
});
