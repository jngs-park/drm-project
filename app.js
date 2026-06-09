pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.getElementById('submit-btn').addEventListener('click', async () => {
    // 1. 입력한 아이디와 비밀번호 가져오기
    const id = document.getElementById('id-input').value;
    const password = document.getElementById('password-input').value;

    try {
        const response = await fetch('/api/getDocument', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, password: password }) // 둘 다 보냄
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message);
            return;
        }

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('viewer-container').style.display = 'block';
        
        // 2. 문서 렌더링 함수에 문서 데이터와 '유저 정보'를 같이 넘겨줌
        renderPDF(result.pdfData, result.userInfo);

    } catch (error) {
        console.error('통신 에러:', error);
    }
});

// userInfo 파라미터가 추가됨
async function renderPDF(base64Data, userInfo) {
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytesArray = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytesArray[i] = binaryString.charCodeAt(i);
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytesArray });
    const pdf = await loadingTask.promise;
    
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.getElementById('pdf-canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    // 3. 워터마크 그릴 때 유저 정보 전달
    drawWatermark(canvas, context, userInfo);
}

// userInfo를 받아서 동적으로 글씨를 씀
function drawWatermark(canvas, ctx, userInfo) {
    const today = new Date().toLocaleString();
    
    // 🚨 고정된 '홍길동' 대신 변수 적용!
    const watermarkText = `열람자: ${userInfo.name} / IP: ${userInfo.ip}`;
    const warningText = `무단 복제 및 배포 엄금 (${today})`;

    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4);

    ctx.fillText(watermarkText, 0, -30);
    ctx.fillText(warningText, 0, 30);

    ctx.rotate(Math.PI / 4);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
}

document.addEventListener('contextmenu', e => { e.preventDefault(); alert('보안 문서입니다.'); });
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault(); alert('보안 문서입니다. 인쇄가 차단되었습니다.');
    }
});