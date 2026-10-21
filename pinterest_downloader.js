// Pinterest Auto-Scroll & High-Resolution Image Downloader
// Jalankan kode ini di Console DevTools (F12) pada tab Pinterest Anda.

(async function() {
    if (window._worksheetDownloaderRunning) {
        console.warn("Downloader sudah berjalan! Ketik stopWorksheetDownloader() untuk menghentikannya.");
        return;
    }
    window._worksheetDownloaderRunning = true;

    // Buat widget status di pojok kanan atas layar
    const overlay = document.createElement('div');
    overlay.id = 'worksheet-downloader-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '999999',
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        color: '#fff',
        padding: '14px 18px',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        fontFamily: 'Segoe UI, -apple-system, sans-serif',
        fontSize: '13px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '240px',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)'
    });

    overlay.innerHTML = `
        <div style="font-weight: 600; font-size: 14px; color: #e60023; display: flex; align-items: center; gap: 6px;">
            <span>📌</span> Worksheet Downloader
        </div>
        <div id="wd-status" style="color: #e4e4e7;">Mengumpulkan gambar...</div>
        <div style="font-size: 12px; color: #a1a1aa;">
            Terdownload: <b id="wd-count" style="color: #4ade80;">0</b> | Antrian: <b id="wd-queue" style="color: #38bdf8;">0</b>
        </div>
        <button id="wd-stop-btn" style="
            background: #e11d48;
            color: white;
            border: none;
            padding: 7px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            margin-top: 4px;
        ">⏹️ Hentikan Downloader</button>
    `;
    document.body.appendChild(overlay);

    const statusEl = document.getElementById('wd-status');
    const countEl = document.getElementById('wd-count');
    const queueEl = document.getElementById('wd-queue');
    const stopBtn = document.getElementById('wd-stop-btn');

    let isRunning = true;
    let downloadedCount = 0;
    const seenUrls = new Set();
    const downloadQueue = [];
    let isProcessingQueue = false;

    window.stopWorksheetDownloader = function() {
        isRunning = false;
        window._worksheetDownloaderRunning = false;
        statusEl.innerText = "Selesai / Dihentikan.";
        statusEl.style.color = "#f87171";
        stopBtn.remove();
        console.log(`[Worksheet Downloader] Selesai. Total gambar didownload: ${downloadedCount}`);
    };

    stopBtn.onclick = window.stopWorksheetDownloader;

    // Helper format ekstensi
    function getExtension(url) {
        const clean = url.split('?')[0];
        const match = clean.match(/\.(jpg|jpeg|png|webp)/i);
        return match ? match[1] : 'jpg';
    }

    // Resolusi gambar tertinggi (originals / 736x)
    async function resolveHighResUrl(url) {
        if (!url || !url.includes('pinimg.com')) return null;
        if (url.includes('/avatars/') || url.includes('/user/') || url.includes('75x75_RS')) return null;

        const orig = url.replace(/\/(?:236x|474x|564x|736x)\//, '/originals/');
        try {
            const head = await fetch(orig, { method: 'HEAD' });
            if (head.ok) return orig;
        } catch(e) {}

        return url.replace(/\/(?:236x|474x|564x)\//, '/736x/');
    }

    // Worker pengunduh antrian secara bertahap
    async function processQueue() {
        if (isProcessingQueue) return;
        isProcessingQueue = true;

        while (isRunning && downloadQueue.length > 0) {
            const item = downloadQueue.shift();
            queueEl.innerText = downloadQueue.length;
            statusEl.innerText = `Mendownload gambar #${downloadedCount + 1}...`;

            try {
                const res = await fetch(item.url);
                if (res.ok) {
                    const blob = await res.blob();
                    const ext = getExtension(item.url);
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const padded = String(downloadedCount + 1).padStart(4, '0');
                    a.href = blobUrl;
                    a.download = `worksheet_anak_coding_${padded}.${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

                    downloadedCount++;
                    countEl.innerText = downloadedCount;
                }
            } catch (err) {
                console.warn("[Worksheet Downloader] Gagal download:", item.url, err);
            }

            // Jeda 800ms antar file agar browser tidak lag
            await new Promise(r => setTimeout(r, 800));
        }

        isProcessingQueue = false;
        if (isRunning) {
            statusEl.innerText = "Menunggu gambar baru...";
        }
    }

    // Loop scan & smooth scroll
    async function scanAndScrollLoop() {
        while (isRunning) {
            const imgs = Array.from(document.querySelectorAll('img'));
            for (const img of imgs) {
                const src = img.currentSrc || img.src;
                if (!src || !src.includes('pinimg.com')) continue;
                if (src.includes('/avatars/') || src.includes('/user/') || src.includes('75x75_RS')) continue;

                const hashMatch = src.match(/([a-f0-9]{32}|[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{32})/i);
                const uniqueKey = hashMatch ? hashMatch[1] : src.split('?')[0];

                if (!seenUrls.has(uniqueKey)) {
                    seenUrls.add(uniqueKey);
                    resolveHighResUrl(src).then(highRes => {
                        if (highRes && isRunning) {
                            downloadQueue.push({ url: highRes, id: uniqueKey });
                            queueEl.innerText = downloadQueue.length;
                            processQueue();
                        }
                    });
                }
            }

            // Scroll ke bawah sedikit
            window.scrollBy({ top: 750, behavior: 'smooth' });

            // Tunggu 2.5 detik untuk rendering pin baru
            await new Promise(r => setTimeout(r, 2500));
        }
    }

    scanAndScrollLoop();
    console.log("🚀 Pinterest Worksheet Downloader aktif! Klik 'Hentikan Downloader' di pojok kanan atau ketik stopWorksheetDownloader() untuk berhenti.");
})();
