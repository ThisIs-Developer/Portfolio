const messages = ["Projects"];
const preloader = document.getElementById("preloader");
const content = document.getElementById("content");

let currentMessage = 0;

function showNextMessage() {
  if (currentMessage < messages.length) {
    const messageElement = document.createElement("div");
    messageElement.className = "message";
    messageElement.textContent = messages[currentMessage];

    if (currentMessage === 0) {
      messageElement.classList.add("fade-in");
    }

    preloader.innerHTML = "";
    preloader.appendChild(messageElement);

    let displayTime = 150;
    if (currentMessage === 0) {
      displayTime = 800;
    }

    currentMessage++;
    setTimeout(showNextMessage, displayTime);
  } else {
    content.classList.add("show-content");
    content.style.borderBottomLeftRadius = "0";
    content.style.borderBottomRightRadius = "0";

    setTimeout(() => {
      preloader.classList.add("slide-out");
      setTimeout(() => {
        preloader.style.display = "none";
      }, 400);
    }, 400);
  }
}

window.onload = () => setTimeout(showNextMessage, 700);

function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}
