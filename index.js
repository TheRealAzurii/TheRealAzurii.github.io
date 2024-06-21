const result = document.getElementById('result')
const calculators = document.getElementsByClassName("calculator");
const inputs = document.getElementsByTagName("input");
const titles = document.getElementsByClassName("title");

const coal_mines_box = document.getElementById('coal_mines')
const iron_mines_box = document.getElementById('iron_mines')
const gold_mines_box = document.getElementById('gold_mines')
const copper_mines_box = document.getElementById('copper_mines')
const diamond_mines_box = document.getElementById('diamond_mines')
const wheat_farms_box = document.getElementById('wheat_farms')
const log_farms_box = document.getElementById('log_farms')
const saw_mills_box = document.getElementById('saw_mills')
const wind_mills_box = document.getElementById('wind_mills')

const iron_ore_box = document.getElementById('iron_ore')
const gold_ore_box = document.getElementById('gold_ore')
const copper_ore_box = document.getElementById('copper_ore')

const beds_box = document.getElementById('beds')
const farms_box = document.getElementById('farms')

const coal_box = document.getElementById('coal')
const iron_bars_box = document.getElementById('iron_bars')
const gold_bars_box = document.getElementById('gold_bars')
const copper_bars_box = document.getElementById('copper_bars')
const diamonds_box = document.getElementById('diamonds')
const wheat_box = document.getElementById('wheat')
const bread_box = document.getElementById('bread')
const log_box = document.getElementById('logs')
const wood_box = document.getElementById('wood')

const coal_porcentage_box = document.getElementById('coal_%')
const iron_porcentage_box = document.getElementById('iron_%')
const gold_porcentage_box = document.getElementById('gold_%')
const copper_porcentage_box = document.getElementById('copper_%')
const diamond_porcentage_box = document.getElementById('diamond_%')
const wheat_porcentage_box = document.getElementById('wheat_%')
const bread_porcentage_box = document.getElementById('bread_%')
const log_porcentage_box = document.getElementById('log_%')
const wood_porcentage_box = document.getElementById('wood_%')

const coal_due_box = document.getElementById('coal_due')
const iron_due_box = document.getElementById('iron_due')
const gold_due_box = document.getElementById('gold_due')
const copper_due_box = document.getElementById('copper_due')
const diamond_due_box = document.getElementById('diamond_due')
const wheat_due_box = document.getElementById('wheat_due')
const bread_due_box = document.getElementById('bread_due')
const log_due_box = document.getElementById('log_due')
const wood_due_box = document.getElementById('wood_due')

var index = 0;
var backgroundToggle = false;
var backgroundTransp = 0.7;

const screenshots = [
    { kingdom: "Valoisie", city: "Montclaire", place: "Montclaire River"},
    { kingdom: "Alderhamn", city: "Alderhamn", place: "Alderhamn Townhall"},
    { kingdom: "Alderhamn", city: "Outside of Alderhamn (city)", place: "Alderhamn's Castle"},
    { kingdom: "Garesedes", city: "Garesedes", place: "Church St. Gabriel"},
    { kingdom: "Garesedes", city: "Garesedes", place: "Marketplace"},
    { kingdom: "Garesedes", city: "Outside of Garesedes (city)", place: "Fields"},
    { kingdom: "Garesedes", city: "St. Josef", place: "St. Josef Cathedral"},
    { kingdom: "Reveria", city: "Castele", place: "City Walls & Gate"},
    { kingdom: "Reveria", city: "Castele", place: "Old Town"},
    { kingdom: "Reveria", city: "Castele", place: "Castele's Lighthouse"},
    { kingdom: "Soviestan", city: "Al-Qurun", place: "Al-Qurun's Bazar"},
    { kingdom: "Valoisie", city: "Valbourg", place: "The Great Library"},
    { kingdom: "Alderhamn", city: "Alderhamn", place: "Harbor"},
];

function inputChanged() {
    const coalMines = parseInt(coal_mines_box.value) * 21;
    const ironMines = parseInt(iron_mines_box.value) * 21;
    const goldMines = parseInt(gold_mines_box.value) * 21;  
    const copperMines = parseInt(copper_mines_box.value) * 21;
    const diamondMines = parseInt(diamond_mines_box.value) * 21;
    const wheatFarms = parseInt(wheat_farms_box.value) * 21;
    const logFarms = parseInt(log_farms_box.value) * 21;
    const sawMillsCapacity = parseInt(saw_mills_box.value) * 32;
    const windMillsCapacity = parseInt(wind_mills_box.value) * 126;

    const beds = parseInt(beds_box.value);
    const farms = parseInt(farms_box.value);

    let ironOre = parseInt(iron_ore_box.value) + ironMines;
    let goldOre = parseInt(gold_ore_box.value) + goldMines;
    let copperOre = parseInt(copper_ore_box.value) + copperMines;

    const coalPorcentage = parseInt(coal_porcentage_box.value);
    const ironPorcentage = parseInt(iron_porcentage_box.value);
    const goldPorcentage = parseInt(gold_porcentage_box.value);
    const copperPorcentage = parseInt(copper_porcentage_box.value);
    const diamondPorcentage = parseInt(diamond_porcentage_box.value);
    const wheatPorcentage = parseInt(wheat_porcentage_box.value);
    const breadPorcentage = parseInt(bread_porcentage_box.value);
    const logPorcentage = parseInt(log_porcentage_box.value);
    const woodPorcentage = parseInt(wood_porcentage_box.value);

    let coalDue = parseInt(coal_due_box.value);    
    let ironDue = parseInt(iron_due_box.value);
    let goldDue = parseInt(gold_due_box.value);
    let copperDue = parseInt(copper_due_box.value);
    let diamondDue = parseInt(diamond_due_box.value);
    let wheatDue = parseInt(wheat_due_box.value);
    let breadDue = parseInt(bread_due_box.value);
    let logDue = parseInt(log_due_box.value);
    let woodDue = parseInt(wood_due_box.value);

    let coal = parseInt(coal_box.value) + coalMines - coalDue;
    let ironBars = parseInt(iron_bars_box.value) - ironDue;
    let goldBars = parseInt(gold_bars_box.value) - goldDue;
    let copperBars = parseInt(copper_bars_box.value) - copperDue;
    let diamonds = parseInt(diamonds_box.value) + diamondMines - diamondDue;
    let wheat = parseInt(wheat_box.value) + wheatFarms - wheatDue;
    let bread = 0;
    let logs = parseInt(log_box.value) + logFarms - logDue;
    let wood = 0;

    coal = Math.ceil(coal - (ironOre + goldOre + copperOre) / 10);

    if (coalMines >= 0) {
        coalDue += Math.ceil(coalMines * (coalPorcentage/100));
        coal -= coalDue;
    } 

    ironBars = ironOre;
    goldBars = goldOre;
    copperBars = copperOre;

    if (ironMines >= 0) {
        ironDue += Math.ceil(ironMines * (ironPorcentage/100));
        ironBars -= ironDue;
    }

    if (goldMines >= 0) {
        goldDue += Math.ceil(goldMines * (goldPorcentage/100));
        goldBars -= goldDue;
    }

    if (copperMines >= 0) {
        copperDue += Math.ceil(copperMines * (copperPorcentage/100));
        copperBars -= copperDue;
    }

    if (diamondMines >= 0) { 
        diamondDue += Math.ceil(diamondMines * (diamondPorcentage/100));
        diamonds -= diamondDue;
    }

    if (wheatFarms >= 0) {    
        wheatDue += Math.ceil(wheatFarms * (wheatPorcentage/100));
        wheat -= wheatDue;
    }

    if (logFarms >= 0) {
        logDue += Math.ceil(logFarms * (logPorcentage/100));
        logs -= logDue;
    }

    if (logs <= sawMillsCapacity) {
        wood += logs * 3;
        logs = 0;
    } else {
        wood += sawMillsCapacity * 3;
        logs -= sawMillsCapacity;
    }

    if (wheat <= windMillsCapacity) {
        bread += Math.ceil(wheat / 3);
        wheat = 0;
    } else {
        bread += Math.ceil(windMillsCapacity / 3);
        wheat -= Math.ceil(windMillsCapacity);
    }

    if (bread >= 0) {
        breadDue = Math.ceil(bread * (breadPorcentage/100) + breadDue);
        bread = bread - breadDue + parseInt(bread_box.value);
    }

    if (wood >= 0) {
        woodDue = Math.ceil(wood * (woodPorcentage/100) + woodDue);
        wood = wood - woodDue + parseInt(wood_box.value);
    }

    bread -= beds;

    copperBars -= farms * 4;
    wood -= farms * 5;

    coal = (coal !== 0 ? (coal > 0 ? "<span class='good'> +" : "<span class='bad'>") + coal + "</span>" : coal);
    ironBars = (ironBars !== 0 ? (ironBars > 0 ? "<span class='good'> +" : "<span class='bad'>") + ironBars + "</span>" : ironBars);
    goldBars = (goldBars !== 0 ? (goldBars > 0 ? "<span class='good'> +" : "<span class='bad'>") + goldBars + "</span>" : goldBars);
    copperBars = (copperBars !== 0 ? (copperBars > 0 ? "<span class='good'> +" : "<span class='bad'>") + copperBars + "</span>" : copperBars);
    diamonds = (diamonds !== 0 ? (diamonds > 0 ? "<span class='good'> +" : "<span class='bad'>") + diamonds + "</span>" : diamonds);
    wheat = (wheat !== 0 ? (wheat > 0 ? "<span class='good'> +" : "<span class='bad'>") + wheat + "</span>" : wheat);
    bread = (bread !== 0 ? (bread > 0 ? "<span class='good'> +" : "<span class='bad'>") + bread + "</span>" : bread);
    logs = (logs !== 0 ? (logs > 0 ? "<span class='good'> +" : "<span class='bad'>") + logs + "</span>" : logs);
    wood = (wood !== 0 ? (wood > 0 ? "<span class='good'> +" : "<span class='bad'>") + wood + "</span>" : wood);

    const params = [
        ['coal_mines', coal_mines_box.value !== "0" ? coal_mines_box.value : ""],
        ['iron_mines', iron_mines_box.value !== "0" ? iron_mines_box.value : ""],
        ['gold_mines', gold_mines_box.value !== "0" ? gold_mines_box.value : ""],
        ['copper_mines', copper_mines_box.value !== "0" ? copper_mines_box.value : ""],
        ['diamond_mines', diamond_mines_box.value !== "0" ? diamond_mines_box.value : ""],
        ['wheat_farms', wheat_farms_box.value !== "0" ? wheat_farms_box.value : ""],
        ['log_farms', log_farms_box.value !== "0" ? log_farms_box.value : ""],
        ['saw_mills', saw_mills_box.value !== "0" ? saw_mills_box.value : ""],
        ['wind_mills', wind_mills_box.value !== "0" ? wind_mills_box.value : ""],
        ['beds', beds_box.value !== "0" ? beds_box.value : ""],
        ['farms', farms_box.value !== "0" ? farms_box.value : ""],
        ['coal_%', coal_porcentage_box.value !== "0" ? coal_porcentage_box.value : ""],
        ['iron_%', iron_porcentage_box.value !== "0" ? iron_porcentage_box.value : ""],
        ['gold_%', gold_porcentage_box.value !== "0" ? gold_porcentage_box.value : ""],
        ['copper_%', copper_porcentage_box.value !== "0" ? copper_porcentage_box.value : ""],
        ['diamond_%', diamond_porcentage_box.value !== "0" ? diamond_porcentage_box.value : ""],
        ['wheat_%', wheat_porcentage_box.value !== "0" ? wheat_porcentage_box.value : ""],
        ['bread_%', bread_porcentage_box.value !== "0" ? bread_porcentage_box.value : ""],
        ['log_%', log_porcentage_box.value !== "0" ? log_porcentage_box.value : ""],
        ['wood_%', wood_porcentage_box.value !== "0" ? wood_porcentage_box.value : ""],
        ['coal_due', coal_due_box.value !== "0" ? coal_due_box.value : ""],
        ['iron_due', iron_due_box.value !== "0" ? iron_due_box.value : ""],
        ['gold_due', gold_due_box.value !== "0" ? gold_due_box.value : ""],
        ['copper_due', copper_due_box.value !== "0" ? copper_due_box.value : ""],
        ['diamond_due', diamond_due_box.value !== "0" ? diamond_due_box.value : ""],
        ['wheat_due', wheat_due_box.value !== "0" ? wheat_due_box.value : ""],
        ['bread_due', bread_due_box.value !== "0" ? bread_due_box.value : ""],
        ['log_due', log_due_box.value !== "0" ? log_due_box.value : ""],
        ['wood_due', wood_due_box.value !== "0" ? wood_due_box.value : ""],
    ];
    const encodedParams = params.filter(([_, value]) => value !== "").map(([key, value]) => `${key}.${value}`).join('&');
    const code = btoa(encodedParams);

    result.innerHTML =
    "Coal: &nbsp;" + coal + "&nbsp; <img src='textures/coal.png' class='image'>" + "<br><br>" +
    "Iron: &nbsp;" + ironBars + "&nbsp; <img src='textures/ironBars.png' class='image'>" + "<br><br>" +
    "Gold: &nbsp;" + goldBars + "&nbsp; <img src='textures/goldBars.png' class='image'>" + "<br><br>" +
    "Copper: &nbsp;" + copperBars + "&nbsp; <img src='textures/copperBars.png' class='image'>" + "<br><br>" +
    "Diamonds: &nbsp;" + diamonds + "&nbsp; <img src='textures/diamonds.png' class='image'>" + "<br><br>" +
    "Wheat: &nbsp;" + wheat + "&nbsp; <img src='textures/wheat.png' class='image'>" + "<br><br>" +
    "Bread: &nbsp;" + bread + "&nbsp; <img src='textures/bread.png' class='image'>" + "<br><br>" +
    "Logs: &nbsp;" + logs + "&nbsp; <img src='textures/logs.png' class='image'>" + "<br><br>" +
    "Planks: &nbsp;" + wood + "&nbsp; <img src='textures/wood.png' class='image'>" + "<br><br><br><br><br>" +

    "Coal Due: &nbsp;" + coalDue + "&nbsp; <img src='textures/coal.png' class='image'>" + "<br><br>" +
    "Iron Due: &nbsp;" + ironDue + "&nbsp; <img src='textures/ironBars.png' class='image'>" + "<br><br>" +
    "Gold Due: &nbsp;" + goldDue + "&nbsp; <img src='textures/goldBars.png' class='image'>" + "<br><br>" +
    "Copper Due: &nbsp;" + copperDue + "&nbsp; <img src='textures/copperBars.png' class='image'>" + "<br><br>" +
    "Diamonds Due: &nbsp;" + diamondDue + "&nbsp; <img src='textures/diamonds.png' class='image'>" + "<br><br>" +
    "Wheat Due: &nbsp;" + wheatDue + "&nbsp; <img src='textures/wheat.png' class='image'>" + "<br><br>" +
    "Bread Due: &nbsp;" + breadDue + "&nbsp; <img src='textures/bread.png' class='image'>" + "<br><br>" +
    "Logs Due: &nbsp;" + logDue + "&nbsp; <img src='textures/logs.png' class='image'>" + "<br><br>" +
    "Planks Due: &nbsp;" + woodDue + "&nbsp; <img src='textures/wood.png' class='image'>" + "<br><br><br><br><br>" +
    "Code:<br><br>" + code;

    document.getElementById('copy-code-button').style.visibility = 'visible';
    document.getElementById('download-code-button').style.visibility = 'visible';

    return code
}

function changeText(id, text) {
    let element = document.getElementById(id);
    let currentText = '';
    
    for (let i = 0; i < text.length; i++) {
        setTimeout(() => {
            let char = text[i];
            currentText += char === undefined ? '' : char;
            element.innerText = currentText;
        }, 100 * i);
    }
}

function confirmedCode(code) {
    try {
        let parts = atob(code).split('&');
        parts.forEach(part => {
            let [id, value] = part.split('.');
            let input = document.getElementById(id);
            if (input) {
                input.value = value;
            }
        }); 
        inputChanged()
    } catch (error) {
        result.innerHTML = 'Error decoding code: <br><br>' + error;
        document.getElementById('copy-code-button').style.visibility = 'hidden';
        document.getElementById('download-code-button').style.visibility = 'hidden';
    }
}
function copyCode() {
    var code = inputChanged();
    navigator.clipboard.writeText(code);
}

function downloadCode() {
    var code = inputChanged();
    var blob = new Blob([code], { type: "application/x-medieval-calculator-code" });
    var url = URL.createObjectURL(blob);
    var doc = document.createElement('a');
    doc.href = url;
    doc.download = 'data_' + new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+/, '') + '.med';
    doc.click();
}

function importFile(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function() {
        confirmedCode(reader.result);
    };
    reader.readAsText(file);
}

function changeBackground() {
    if (backgroundToggle) {
        index = (index + Math.floor(Math.random() * 11)) % 12;
        let randomImage = `screenshots/${index}.png`;
        document.body.style.backgroundImage = `url(${randomImage})`;

        let kingdom = screenshots[index].kingdom;
        let city = screenshots[index].city;
        let place = screenshots[index].place;

        setTimeout(() => {
            changeText('kingdom', kingdom);
            changeText('city', city);
            changeText('place', place);
        }, 2500);
    }
}

setInterval(() => {
    document.body.style.transition = '';
    changeBackground();
}, 10000);

function sliderChanged(value) {
    backgroundTransp = (100 - value) / 100;
    document.body.style.overflowY = 'scroll';

    document.getElementById("results").style.backgroundColor = `rgba(15, 15, 15, ${backgroundTransp})`;
    document.getElementById(`inputs`).style.backgroundColor = `rgba(15, 15, 15, ${backgroundTransp})`;

    document.getElementById('kingdom').style.visibility = 'hidden';
    document.getElementById('city').style.visibility = 'hidden';
    document.getElementById('place').style.visibility = 'hidden';

    Array.from(inputs).forEach(input => {
        input.style.backgroundColor = `#0a0b0c`;
    })
    Array.from(calculators).forEach(calculator => {
        calculator.style.backgroundColor = `rgba(15, 15, 15, ${backgroundTransp})`;
    });
    Array.from(titles).forEach(title => {
        title.style.backgroundColor = `#0a0b0c`;
    });

    if (backgroundTransp == 0) {
        document.body.querySelectorAll('*').forEach(child => {
            child.style.visibility = "hidden";
            child.style.display = "";
            child.style.justifyContent = "";
            child.style.alignItems = "";
        });

        document.getElementById('kingdom').style.visibility = 'visible';
        document.getElementById('city').style.visibility = 'visible';
        document.getElementById('place').style.visibility = 'visible';

        window.scrollTo({
            top: 0,
            behavior: 'instant'
        });
        
        document.body.style.overflow = 'hidden';
        
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                document.body.querySelectorAll('*').forEach(child => {
                child.style.visibility = "visible";
                document.getElementById('background_slider').value = 30;
                sliderChanged(30)
            })}
        })
    }   
}

function toggleBackground() {
    backgroundToggle = !backgroundToggle;

    document.body.style.backgroundImage = "";
    document.body.style.backgroundColor = "#292b2f";

    changeBackground();
    if (backgroundToggle) {
        document.getElementById('slider_title').style.visibility = 'visible';
        document.getElementById('background_slider').style.visibility = 'visible';

        document.getElementById("results").style.backgroundColor = `rgba(15, 15, 15, ${backgroundTransp})`;
        document.getElementById(`inputs`).style.backgroundColor = `rgba(15, 15, 15, ${backgroundTransp})`;
        Array.from(inputs).forEach(input => {
            input.style.backgroundColor = `#0a0b0c`;
        })
        Array.from(calculators).forEach(calculator => {
            calculator.style.backgroundColor = `rgba(15, 15, 15, ${backgroundTransp})`;
        });
        Array.from(titles).forEach(title => {
            title.style.backgroundColor = `#0a0b0c`;
        });
    } else {
        document.getElementById('slider_title').style.visibility = 'hidden';
        document.getElementById('background_slider').style.visibility = 'hidden';

        document.getElementById(`results`).style.backgroundColor = `rgb(47,49,54)`;
        document.getElementById(`inputs`).style.backgroundColor = `rgb(47,49,54)`;
        Array.from(inputs).forEach(input => {
            input.style.backgroundColor = `#292b2f`;
        })
        Array.from(calculators).forEach(calculator => {
            calculator.style.backgroundColor = `rgb(47,49,54)`;
        });
        Array.from(titles).forEach(title => {
            title.style.backgroundColor = `#292b2f`;
        });
    }
}


/*function doSomething() {
    let randomFunction = [
        () => window.open('https://google.com'),
        () => {
            let div = document.createElement('div');
            div.innerText = "You're so random, I love you!";
            div.style.position = 'fixed';
            div.style.top = '50%';
            div.style.left = '50%';
            div.style.transform = 'translate(-50%, -50%)';
            div.style.fontSize = '3em';
            div.style.color = 'yellow';
            div.style.textShadow = '0 0 10px white';
            document.body.appendChild(div);
            setTimeout(() => {
                div.remove();
            }, 5000);
        },
        () => window.open('https://youtube.com'),
        () => {
            let audio = new Audio('https://s3.amazonaws.com/freecodecamp/simonSound1.mp3');
            audio.play();
        },
        () => {
            let div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.top = '50%';
            div.style.left = '50%';
            div.style.transform = 'translate(-50%, -50%)';
            div.innerHTML = '<img src="https://media.giphy.com/media/3o7TKYdU6A753y/giphy.gif" style="width: 100%; height: auto;">';
            document.body.appendChild(div);
            setTimeout(() => {
                div.remove();
            }, 5000);
        }
    ];
    let randomIndex = Math.floor(Math.random() * randomFunction.length);
    randomFunction[randomIndex]();
}*/

inputChanged();
changeBackground();

document.getElementById('kingdom').style.visibility = 'hidden';
document.getElementById('city').style.visibility = 'hidden';
document.getElementById('place').style.visibility = 'hidden';