# Portfolio [![Actions Status](https://github.com/cfgnunes/numerical-methods-python/workflows/build/badge.svg)](https://github.com/ThisIs-Developer/Portfolio)
🚀 Explore the **Simplicity of HTML, CSS, and a Touch of JS** in Building Your Unique Showcase. Let's Elevate **Your Portfolio Game** Together! 💼❤️
### Website is Live: [baivabsarkar.me](https://baivabsarkar.netlify.app)
## Key Feature
### Submit a Form to Google Sheets

**This Portfolio Contact form can stores the submitted form data in Google Sheets using plain 'ol JavaScript (ES6), [Google Apps Script](https://www.google.com/script/start/).**

Discover the Process: Learn from [@jamiewilson](https://github.com/jamiewilson) [Form-to-Google-Sheets Repository](https://github.com/jamiewilson/form-to-google-sheets/tree/master) 📝🔗 #OpenSource"
### Input the <SCRIPT> in `index.html`:
```js
<script>
        const scriptURL = 'https://script.google.com/macros/s/AKfycbzwGkCv4dbdFpYjSYbThchpqYSgudoYmK_KtdmS6RkK-vyFqgPCKwxicx0xdmTErDjM/exec'
        const form = document.forms['submit-to-google-sheet']
        const msg = document.getElementById("msg")
        const waitMsg = document.getElementById("wait-msg")
        form.addEventListener('submit', e => {
            e.preventDefault();
            waitMsg.innerHTML = "Please wait...";
            fetch(scriptURL, { method: 'POST', body: new FormData(form) })
                .then(response => {
                    waitMsg.innerHTML = "";
                    msg.innerHTML = "Message sent successfully";
                    setTimeout(function () {
                        msg.innerHTML = "";
                    }, 5000);
                    form.reset();
                })
                .catch(error => {
                    waitMsg.innerHTML = "";
                    console.error('Error!', error.message);
                });
        });
</script>
```
## Layout of Contact form
![Screenshot 2023-08-08 135921](https://github.com/ThisIs-Developer/Portfolio/assets/109382325/146c609a-9141-46b4-8f12-9591d80f9add)
## After clicking the "Submit" buttom.
### "Please wait..."
![Screenshot (47)](https://github.com/ThisIs-Developer/Portfolio/assets/109382325/c9c2f094-cd90-4a15-a38c-a398d7a2aa76)

## After sending Message.
### "Message sent successfully"
![Screenshot (495)](https://github.com/ThisIs-Developer/Portfolio/assets/109382325/1a4f6710-d88e-4f76-8ef2-2fb391479683)

![screencapture-baivabsarkar-me-2023-08-08-13_48_17](https://github.com/ThisIs-Developer/Portfolio/assets/109382325/e7cb5fd5-5be0-4ded-966a-4eea793623f4)

