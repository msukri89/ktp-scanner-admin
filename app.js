const video = document.getElementById('video');
const canvas = document.getElementById('captureCanvas');
const photoPreview = document.getElementById('photoPreview');
const btn = document.getElementById('btnCapture');

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { video.srcObject = stream; });

async function takePhoto() {
    btn.innerText = "Memproses di Server Google...";
    btn.disabled = true;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    photoPreview.src = canvas.toDataURL('image/jpeg');
    photoPreview.style.display = 'block';
    video.style.display = 'none';

    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    // PENTING: Gunakan URL Deployment TERBARU
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxCfbVY0hKIegCpICkUEMFCArl4mv9jmUeiXApiwxXIZFaDL0quJztdp_dkdqzKQlIblQ/exec';

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({ image: base64Image })
        });
        const result = await response.json();

        if (result.status === "success") {
            documents.getElementById('nik').value = result.nik;
            documents.getElementById('nama').value = result.nama;
            btn.innerText = "SCAN ULANG";
        } else {
            alert("Gagal: " + result.message);
            btn.innerText = "COBA LAGI";
        }
    } catch (err) {
        alert("Masalah Koneksi/URL");
    } finally {
        btn.disabled = false;
        btn.onclick = resetCamera;
    }
}

function resetCamera() {
    video.style.display = 'block';
    photoPreview.style.display = 'none';
    btn.innerText = "AMBIL FOTO & PINDAI";
    btn.onclick = takePhoto;
}
