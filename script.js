const images = ["data/AzuriiUndertale.png",
"data/AzuriiMinecraft.png", 
"data/AzuriiMario.png", 
];
const card1 = document.getElementById("card1");
const card2 = document.getElementById("card2");
const card3 = document.getElementById("card3");
let interval = null;

function getScrollTop() { 
  return window.scrollY ||
       (document.documentElement && 
          document.documentElement.scrollTop) ||
       document.body.scrollTop; 
}

function rgb(r, g, b){
  return "rgb("+r+","+g+","+b+")";
}

function getPos(target, value = "height") {
  if (value == "height") {
    console.log(target.offsetTop)
    return target.offsetTop;
  } else {
    return target.offsetLeft;
  }
}

/*function backgroundChange() {
  let green = 12 + getScrollTop() / 30
  let blue = 52 + getScrollTop() / 10
  if (green > 60) {
    green = 60
  }
  if (blue > 250) {
    blue = 250
  }
  document.body.style.backgroundColor = rgb(3, green, blue);
  setTimeout(() => {backgroundChange(); }, 100);
}*/

document.querySelector("div").onmouseover = event => {
  let iteration = 0;

  clearInterval(interval);

  interval = setInterval(() => {
    event.target.innerText = event.target.innerText
      .split("")
      .map((letter, index) => {
        if (index < iteration) {
          return event.target.dataset.value[index];
        }

        return "_"
      })
      .join("");

    if (iteration >= event.target.dataset.value.length) {
      clearInterval(interval);
    }

    iteration += 1 / 2;
  }, 20);

  switch (event.target.dataset.value) {
    case 'THE GREAT AZURII':
      event.target.setAttribute("data-value", "THE ONE THE ONLY");
      break;
    case 'THE ONE THE ONLY':
      event.target.setAttribute("data-value", "THE GREAT AZURII");
      break;
    case 'OLD GAME!':
      event.target.setAttribute("data-value", "BODYSCAPE");
      break;
    case 'BODYSCAPE':
      event.target.setAttribute("data-value", "OLD GAME!");
    break;
    case 'OBVIOUSLY ENOUGH':
      event.target.setAttribute("data-value", "JUST MY HOBBIES.");
      break;
    case 'JUST MY HOBBIES.':
      event.target.setAttribute("data-value", "OBVIOUSLY ENOUGH");
      break;
    default:
      event.target.setAttribute("data-value", "ERROR ERROR ERROR ERROR");
  }
}

document.addEventListener('DOMContentLoaded', _ => {
  const randImageIndex = ~~(Math.random() * images.length);
  document.getElementById('randImg').src = images[randImageIndex];
});

card1.addEventListener('click', function handleClick() {
  let height = getPos(document.getElementById("drawingTitle"));
  console.log(height);
  window.scrollTo(0, height - 100);
});

card2.addEventListener('click', function handleClick() {
  let height = getPos(document.getElementById("editingTitle"));
  console.log(height);
  window.scrollTo(0, height - 100);
});

card3.addEventListener('click', function handleClick() {
  let height = getPos(document.getElementById("developingTitle"));
  console.log(height);
  window.scrollTo(0, height - 100);
});