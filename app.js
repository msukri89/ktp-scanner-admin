const video = document.getElementById('video');
const canvas = document.getElementById('captureCanvas');
const photoPreview = document.getElementById('photoPreview');
const context = canvas.getContext('2d');

// Jalankan Kamera
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { video.srcObject = stream; });

async function takePhoto() {
    const btn = document.getElementById('btnCapture');
    btn.innerText = "Memproses...";
    btn.disabled = true;

    // 1. Ambil Gambar dari Video (Freeze)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. Tampilkan Foto Diam & Sembunyikan Kamera Live
    photoPreview.src = canvas.toDataURL('image/png');
    photoPreview.style.display = 'block';
    video.style.display = 'none';

    // 3. Proses OCR Tesseract
    Tesseract.recognize(canvas, 'ind')
    .then(({ data: { text } }) => {
        // Isi NIK (Cari 16 digit angka)
        const nikMatch = text.match(/\d{16}/);
        if (nikMatch) document.getElementById('nik').value = nikMatch[0];

        // Isi Nama (Cari baris setelah kata NAMA)
        const lines = text.split('\n');
        for (let line of lines) {
            if (line.toUpperCase().includes("NAMA")) {
                document.getElementById('nama').value = line.replace(/Nama|:|nama/gi, "").trim();
                break;
            }
        }
        
        btn.innerText = "SCAN ULANG";
        btn.disabled = false;
        btn.onclick = resetCamera; 
    });
}

function resetCamera() {
    photoPreview.style.display = 'none';
    video.style.display = 'block';
    const btn = document.getElementById('btnCapture');
    btn.innerText = "AMBIL FOTO & PINDAI";
    btn.onclick = takePhoto;
}
