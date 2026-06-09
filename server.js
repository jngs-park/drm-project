const express = require('express');
const path = require('path');
const fs = require('fs');
const CryptoJS = require('crypto-js');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// 👤 가짜 데이터베이스 추가! (실제로는 MySQL 같은 DB를 씁니다)
const users = {
    'user1': { password: '123', name: '김철수' },
    'user2': { password: '456', name: '이영희' },
    'admin': { password: 'admin', name: '관리자' }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🚨 업그레이드된 검문소 (아이디와 비밀번호를 모두 검사)
app.post('/api/getDocument', (req, res) => {
    const userId = req.body.id;
    const userPassword = req.body.password;

    // 1. 유저 확인 로직
    const user = users[userId];
    if (!user || user.password !== userPassword) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 틀렸습니다!' });
    }

    try {
        const secretKey = 'my-super-secret-key'; 
        const encryptedData = fs.readFileSync('sample.locked', 'utf8');
        
        const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        const decryptedBase64 = bytes.toString(CryptoJS.enc.Utf8);

        // 접속 IP 가져오기 (내 컴퓨터에서 테스트 중이라 '::1' 같은 형태로 나올 수 있음)
        const userIp = req.ip || req.connection.remoteAddress;

        // 2. 문서 데이터와 함께 '로그인한 유저의 정보(이름, IP)'도 프론트엔드로 보내줌!
        res.json({ 
            success: true, 
            pdfData: decryptedBase64,
            userInfo: { name: user.name, ip: userIp } 
        });
    } catch (error) {
        res.status(500).json({ message: '서버에서 문서를 여는 데 실패했습니다.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 보안 서버가 켜졌습니다! http://localhost:${PORT}`);
});