// JavaScript code for opening and closing tabs
var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents");

function opentab(tabname) {
    for (tablink of tablinks) {
        tablink.classList.remove("active-link")
    }
    for (tabcontent of tabcontents) {
        tabcontent.classList.remove("active-tab")
    }
    event.currentTarget.classList.add("active-link")
    document.getElementById(tabname).classList.add("active-tab");
}

// JavaScript code for opening and closing side menu
var sidememu = document.getElementById("sidememu")
function openmemu() {
    sidememu.style.right = "0";
}
function closememu() {
    sidememu.style.right = "-200px";
}

// JavaScript code for form submission and handling messages
const scriptURL = 'https://script.google.com/macros/s/AKfycbzegdtneDTh4Kfu1iqYQ7AcBu6Q8hlbBnQerZ1H5LFYoGfnuk1KkFu4LRnERdto9oLF/exec'
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
