const result = document.getElementById('result')

const coal_mines_box = document.getElementById('coal_mines')
const iron_mines_box = document.getElementById('iron_mines')
const gold_mines_box = document.getElementById('gold_mines')
const copper_mines_box = document.getElementById('copper_mines')
const diamond_mines_box = document.getElementById('diamond_mines')
const wheat_farms_box = document.getElementById('wheat_farms')

const iron_ore_box = document.getElementById('iron_ore')
const gold_ore_box = document.getElementById('gold_ore')
const copper_ore_box = document.getElementById('copper_ore')

const coal_box = document.getElementById('coal')
const iron_bars_box = document.getElementById('iron_bars')
const gold_bars_box = document.getElementById('gold_bars')
const copper_bars_box = document.getElementById('copper_bars')
const diamonds_box = document.getElementById('diamonds')
const wheat_box = document.getElementById('wheat')

const beds_box = document.getElementById('beds')
const farms_box = document.getElementById('farms')
function buttonclick() {
    var coalMines = parseInt(coal_mines_box.value) * 64;
    var ironMines = parseInt(iron_mines_box.value) * 64;
    var goldMines = parseInt(gold_mines_box.value) * 64;  
    var copperMines = parseInt(copper_mines_box.value) * 64;
    var diamondMines = parseInt(diamond_mines_box.value) * 64;
    var wheatFarms = parseInt(wheat_farms_box.value) * 64;

    var ironOre = parseInt(iron_ore_box.value) + ironMines;
    var goldOre = parseInt(gold_ore_box.value) + goldMines;
    var copperOre = parseInt(copper_ore_box.value) + copperMines;

    var coal = parseInt(coal_box.value) + coalMines;
    var ironBars = parseInt(iron_bars_box.value);
    var goldBars = parseInt(gold_bars_box.value);
    var copperBars = parseInt(copper_bars_box.value);
    var diamonds = parseInt(diamonds_box.value) + diamondMines;
    var wheat = parseInt(wheat_box.value) + wheatFarms;

    var beds = parseInt(beds_box.value);
    var farms = parseInt(farms_box.value);

    coal = Math.ceil(coal - (ironOre + goldOre + copperOre) / 10)
    ironBars = ironOre
    goldBars = goldOre
    copperBars = copperOre

    wheat -= beds * 3

    ironBars -= farms

    if (coal > 0) {
        coal = "<span class='good'>" + "+" + coal + "</span>"
    } else if (coal < 0) {
        coal = "<span class='bad'>" + coal + "</span>"
    }

    if (ironBars > 0) {
        ironBars = "<span class='good'>" + "+" + ironBars + "</span>"
    } else if (ironBars < 0) {
        ironBars = "<span class='bad'>" + ironBars + "</span>"
    }

    if (goldBars > 0) {
        goldBars = "<span class='good'>" + "+" + goldBars + "</span>"
    } else if (goldBars < 0) {
        goldBars = "<span class='bad'>" + goldBars + "</span>"
    }

    if (copperBars > 0) {
        copperBars = "<span class='good'>" + "+" + copperBars + "</span>" 
    } else if (copperBars < 0) {
        copperBars = "<span class='bad'>" + copperBars + "</span>"
    }

    if (diamonds > 0) {
        diamonds = "<span class='good'>" + "+" + diamonds + "</span>"
    } else if (diamonds < 0) {
        diamonds = "<span class='bad'>" + diamonds + "</span>"
    }

    if (wheat > 0) {
        wheat = "<span class='good'>" + "+" + wheat + "</span>"
    } else if (wheat < 0) {
        wheat = "<span class='bad'>" + wheat + "</span>"
    }

    result.innerHTML = "Coal: &nbsp;" + coal + "<br><br>" + "Iron: &nbsp;" + ironBars + "<br><br>" + "Gold: &nbsp;" + goldBars + "<br><br>" + "Copper: &nbsp;" + copperBars + "<br><br>" + "Diamonds: &nbsp;" + diamonds + "<br><br>" + "Wheat: &nbsp;" + wheat
}