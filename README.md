# Portfolio [![Actions Status](https://github.com/cfgnunes/numerical-methods-python/workflows/build/badge.svg)](https://github.com/ThisIs-Developer/Portfolio)
## Showstopper🌐
🚀 Explore the **Simplicity of HTML, CSS, and a Touch of JS** in Building Your Unique Showcase. Let's Elevate **Your Portfolio Game** Together! 💼❤️ #InteractiveLearning #CodeYourDreams #ShareTheLove 💬👇
### Owner
- [@ThisIs-Developer](https://github.com/ThisIs-Developer)
### Website is Live: [baivabsarkar.me](https://baivabsarkar.netlify.app)
## Key Feature
### Submit a Form to Google Sheets

#### This Portfolio Contact form can stores the submitted form data in Google Sheets using plain 'ol JavaScript (ES6), [Google Apps Script](https://www.google.com/script/start/).

Discover the Process: Learn from @jamiewilson [Form-to-Google-Sheets Repository](https://github.com/jamiewilson/form-to-google-sheets/tree/master) 📝🔗 #OpenSource"

### Google Apps Script
```js
var sheetName = 'Sheet1'
var scriptProp = PropertiesService.getScriptProperties()

function intialSetup () {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  scriptProp.setProperty('key', activeSpreadsheet.getId())
}

function doPost (e) {
  var lock = LockService.getScriptLock()
  lock.tryLock(10000)

  try {
    var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'))
    var sheet = doc.getSheetByName(sheetName)

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    var nextRow = sheet.getLastRow() + 1

    var newRow = headers.map(function(header) {
      return header === 'timestamp' ? new Date() : e.parameter[header]
    })

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow])

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  finally {
    lock.releaseLock()
  }
}
```
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
