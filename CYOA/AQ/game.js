/**
 * author: Ant
 * current-workspace: Twine + Adventure
 * version: 0.1.0
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
window.saveGame = function () {
	const currentPassage = window.story.currentPassage;
	window.saveData = { currentPassage, stages: window.stages };
}
window.loadGame = function () {
	const { currentPassage, stages } = window.saveData;
	if (currentPassage) {
		window.story.showPassage(currentPassage);
		window.stages = stages;
	} else {
		throw new Error("There is no save data!");
	}
}