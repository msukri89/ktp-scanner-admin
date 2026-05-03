const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const shutter = document.getElementById('shutter');
const scriptURL = 'https://script.google.com/macros/s/AKfycbwKebiI0jRkDAJwY1IaYuxyfOrBdnHGJs4TAGcIHgvB844HxHzsio2GhwEJ32AOe_0ERQ/exec';

// 1. Aktifkan Kamera
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { video.srcObject = stream; });

// 2. Ambil Foto & Jalankan Tesseract
shutter.onclick = async () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Tampilkan loading sederhana
    document.getElementById('nama').value = "Sedang memindai...";

    // Jalankan Tesseract pada canvas
    const { data: { text } } = await Tesseract.recognize(canvas, 'ind');
    
    // Logika Parsing Sederhana (Ini perlu diperdalam dengan Regex nanti)
    console.log(text);
    document.getElementById('nama').value = "Scan Selesai. Silakan verifikasi.";
};

// 3. Kirim Data ke GAS
document.getElementById('btn-submit').onclick = async () => {
    const payload = {
        nik: document.getElementById('nik').value,
        nama: document.getElementById('nama').value,
        alamat_detail: document.getElementById('alamat').value,
        desa: document.getElementById('desa').value,
        kecamatan: "-", // Nanti diambil dari DB wilayah
        kota: "-",
        provinsi: "-",
        status: navigator.onLine ? "Online" : "Queue"
    };

    if (!navigator.onLine) {
        // Logika simpan ke IndexedDB jika offline
        alert("Offline! Data disimpan di antrean.");
        return;
    }

    try {
        await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors', // Penting untuk GAS
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert("Data berhasil dikirim!");
    } catch (e) {
        console.error("Gagal kirim", e);
    }
};
