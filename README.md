# Portfolio 
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

🚀 Explore the **Simplicity of HTML, CSS, and a Touch of JS** in Building Your Unique Showcase. Let's Elevate **Your Portfolio Game** Together! 💼❤
### Website is Live: [baivabsarkar.pages.dev](https://baivabsarkar.pages.dev)
## Key Feature
### Welcome Message Pre-Loader
https://github.com/user-attachments/assets/4909eb6c-d449-418a-b934-72f1ce3b2a08

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
![WelcomePreloader-gif](https://github.com/user-attachments/assets/b3b0982a-66c8-4078-b1e7-9708258b51e3)

### Landing Page
![Capture 1](https://github.com/user-attachments/assets/6d116436-f3b2-4cab-b04b-e078f08b1268)


### Projects Page
![Capture 2](https://github.com/user-attachments/assets/0854c622-736f-4854-a514-948d0523fd39)

[license-shield]: https://img.shields.io/badge/License-MIT-red.svg
[license-url]: https://github.com/ThisIs-Developer/Action-Plan/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat&logo=linkedin&colorB=blue
[linkedin-url]: https://www.linkedin.com/in/baivabsarkar/
