const fs = require('fs');
const CryptoJS = require('crypto-js');

// 1. 원본 PDF 파일 읽어오기
const pdfBuffer = fs.readFileSync('sample.pdf');
// 파일을 글자(Base64) 형태로 변환
const base64Data = pdfBuffer.toString('base64');

// 2. 우리만의 비밀번호 설정 (절대 유출되면 안 됨!)
const secretKey = 'my-super-secret-key';

// 3. AES 알고리즘으로 강력하게 암호화!
const ciphertext = CryptoJS.AES.encrypt(base64Data, secretKey).toString();

// 4. 암호화된 결과를 새로운 파일로 저장
fs.writeFileSync('sample.locked', ciphertext);
console.log('🔒 암호화 완료! [sample.locked] 파일이 생성되었습니다.');