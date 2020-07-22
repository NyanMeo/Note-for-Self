/**
 * author: Ant
 * current-workspace: Twine + Adventure
 * version: 0.2.1
 * change-log: 
 * - fixed save/load to be more specific
 */

/**
 * Game Config
 */
window.config = {
	"items": [
		{
			"tag": "sword",
			"name": "Steel Sword",
			"x": 1, "y": 107
		},
		{
			"tag": "shield",
			"name": "Shield",
			"x": 2, "y": 71
		},
		{
			"tag": "small-red-potion",
			"name": "Lesssor Health Potion",
			"x": 2, "y": 45
		},
		{
			"tag": "chest-key",
			"name": "Chest Key",
			"x": 10, "y": 32
		},
		{
			"tag": "treasure-chest",
			"name": "Treasure Chest",
			"x": 8, "y": 58
		},
		{
			"tag": "sea-monster-scroll",
			"name": "Sea Monster Scroll",
			"x": 3, "y": 51
		},
	]
};

/**
 * Customizable Stages Object
 */
window.stages = [
	{
		name: "global",
		objects: [
			{
				name: "age",
				value: 18,
			},
			{
				name: "water-resis",
				value: 0,
			},
			{
				name: "fire-resis",
				value: 0,
			},
			{
				name: "poison-resis",
				value: 0,
			},
			{
				name: "healing",
				value: 0,
			},
			{
				name: "points",
				value: 0,
			},
		],
	},
	{
		name: "1-1",
		objects: [
			{
				name: "mermaid",
				isAlive: true,
				status: "idle", // can be ["idle", "hostile", "friendly"]
				points: 0,
			},
		],
	},
	{
		name: "1-2",
		objects: [
			{
				name: "ske",
				darkMode: false,
				status: "idle", // can be ["idle", "hostile", "friendly"]
				points: 0,
			},
			{
				name: "helful kitty",
				isFound: false,
				status: 1, // 1..9 friendliness
			},
		],
	},
];

window.getStage = function (stageName) {
	const stage = window.stages.filter(({ name }) => name === stageName).pop();
	if (stage) {
		return stage;
	} else {
		throw new Error("There is no stage with name " + stageName);
	}
}

window.getStageObject = function (stageName, objectName = "") {
	const stage = window.getStage(stageName);
	const object = stage.objects.filter(({ name }) => name === objectName).pop();
	if (object) {
		return object;
	} else {
		throw new Error("There is no object with name " + objectName);
	}
}

window.setStageObject = function (stageName, objectName, property, value) {
	const stageObject = window.getStageObject(stageName, objectName);
	stageObject[property] = value;
}

/**
 * Save/Load
 */
window.saveData = {};
window.isAutosave = true;
window.kittyHealing = [];
window.eventOnce = [];

/**
 * Run when document loaded
 */
(function (funcName, baseObj) {
	"use strict";
	funcName = funcName || "docReady";
	baseObj = baseObj || window;
	var readyList = [];
	var readyFired = false;
	var readyEventHandlersInstalled = false;
	function ready() {
		if (!readyFired) {
			readyFired = true;
			for (var i = 0; i < readyList.length; i++) {
				readyList[i].fn.call(window, readyList[i].ctx);
			}
			readyList = [];
		}
	}
	function readyStateChange() {
		if (document.readyState === "complete") {
			ready();
		}
	}
	baseObj[funcName] = function (callback, context) {
		if (typeof callback !== "function") {
			throw new TypeError("callback for docReady(fn) must be a function");
		}
		if (readyFired) {
			setTimeout(function () { callback(context); }, 1);
			return;
		} else {
			readyList.push({ fn: callback, ctx: context });
		}
		if (document.readyState === "complete" || (!document.attachEvent && document.readyState === "interactive")) {
			setTimeout(ready, 1);
		} else if (!readyEventHandlersInstalled) {
			if (document.addEventListener) {
				document.addEventListener("DOMContentLoaded", ready, false);
				window.addEventListener("load", ready, false);
			} else {
				document.attachEvent("onreadystatechange", readyStateChange);
				window.attachEvent("onload", ready);
			}
			readyEventHandlersInstalled = true;
		}
	}
})("docReady", window);

docReady(function () {
	window.saveGame = function () {
		const currentPassage = window.story.currentPassage;
		const { health, gold, inventory } = window.character;
		window.saveData = {
			currentPassage,
			stages: window.stages,
			character: {
				health,
				gold,
				items: inventory.items.map(x => x),
			},
		};
	}

	window.loadGame = function () {
		const { currentPassage, stages, character } = window.saveData;
		if (currentPassage) {
			const { health, gold, items } = character;
			window.stages = stages;
			window.character.health = health;
			window.character.gold = gold;
			window.story.showPassage(currentPassage);
			window.character.inventory.items.replace(items);
			document.querySelector("#saveBtn").style.display = "block";
		} else {
			throw new Error("There is no save data!");
		}
	}

	window.suddenDeath = function () {
		window.character.damage(window.character.health);
		document.querySelector("#saveBtn").style.display = "none";
	}

	document.querySelector(".panel-content").insertAdjacentHTML("beforeend", `<div id="saveLoadBtns" class="row" style="display:none;justify-content:space-around;"><button id="saveBtn" class="button red" onclick="window.saveGame()">Save</button><button class="button blue" onclick="window.loadGame()">Load</button></div>`);
});
