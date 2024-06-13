import math

coal = int(input("How many coal mines do you have?")) * 64
ironMines = int(input("How many iron mines do you have?")) * 64
goldMines = int(input("How many gold mines do you have?")) * 64
copperMines = int(input("How many copper mines do you have?")) * 64
diamondMines = int(input("How many diamond mines do you have?")) * 64
wheatFarms = int(input("How many wheat farms do you have?")) * 64

iron = int(input("How much iron do you have?"))
gold = int(input("How much gold do you have?"))
copper = int(input("How much copper do you have?"))
diamond = int(input("How much diamond do you have?")) + diamondMines
wheat = int(input("How much wheat do you have?")) + wheatFarms

ironOre = int(input("How much iron ore do you have?")) + ironMines
goldOre = int(input("How much gold ore do you have?")) + goldMines
copperOre = int(input("How much copper ore do you have?")) + copperMines

beds = int(input("How many bed (villagers) do you have?"))
farms = int(input("How many farms do you have?"))

tosmelt = goldOre + ironOre + copperOre
if tosmelt / 10 < coal:
    iron = ironOre
    ironOre = 0

    gold = goldOre
    goldOre = 0

    copper = copperOre
    copperOre = 0

    coal = math.ceil(coal - tosmelt / 10)
else:
    print("You don't have enough coal to smelt everything!")

if wheat < beds * 3:
    print("You don't have enough wheat to feed all of your villagers!")
wheat = math.ceil(wheat - beds * 3)

if iron < farms:
    print("You don't have enough iron to repair all of your farms!")
iron = math.ceil(iron - farms)

print("Coal: " + str(coal))
print("Iron: " + str(iron))
print("Iron ore: " + str(ironOre))
print("Gold: " + str(gold))
print("Gold ore: " + str(goldOre))
print("Copper: " + str(copper))
print("Copper ore: " + str(copperOre))
print("Diamond: " + str(diamond))
print("Wheat: " + str(wheat))