# Portfolio [![Actions Status](https://github.com/cfgnunes/numerical-methods-python/workflows/build/badge.svg)](https://github.com/iam-baivab/Portfolio)
🚀 Explore the **Simplicity of HTML, CSS, and a Touch of JS** in Building Your Unique Showcase. Let's Elevate **Your Portfolio Game** Together! 💼❤
### Website is Live: [baivabsarkar.pages.dev](https://baivabsarkar.pages.dev)
## Key Feature
### Welcome Message Pre-Loader


https://github.com/iam-baivab/Portfolio/assets/169576921/c97f5c52-aa05-46b6-ad40-a4b3b162d367





### Input the <SCRIPT> in `index.html`:
```js
const messages = ["Hello", "Bonjour", "स्वागत हे", "Ciao", "Olá", "おい", "Hallå", "Guten tag", "Hallo"];
const preloader = document.getElementById('preloader');
const content = document.getElementById('content');

let currentMessage = 0;

function showNextMessage() {
    if (currentMessage < messages.length) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = messages[currentMessage];

        if (currentMessage === 0) {
            messageElement.classList.add('fade-in');
        }

        preloader.innerHTML = '';
        preloader.appendChild(messageElement);

        let displayTime = 150;
        if (currentMessage === 0) {
            displayTime = 800;
        }

        currentMessage++;
        setTimeout(showNextMessage, displayTime);
    } else {
        content.classList.add('show-content');
        content.style.borderBottomLeftRadius = '0';
        content.style.borderBottomRightRadius = '0';
        
        setTimeout(() => {
            preloader.classList.add('slide-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 400);
        }, 400);
    }
}
```
## UI 📈
![WelcomePreloader-ezgif com-video-to-gif-converter](https://github.com/iam-baivab/Portfolio/assets/169576921/a93c9f43-cac1-47bf-a749-9fd9f54b121a)
### Landing Page
![screencapture-127-0-0-1-5500-index-html-2024-05-28-22_58_30](https://github.com/iam-baivab/Portfolio/assets/169576921/37046985-bf11-456f-97aa-2d55c9a2dedf)

### Projects Page
![screencapture-127-0-0-1-5500-project-html-2024-05-28-23_11_49](https://github.com/iam-baivab/Portfolio/assets/169576921/1c63c804-6c00-4b90-b62c-43a9baccacad)


