$(document).ready(function() {
	// Initialize Objects
	var RPSLS = ["Rock", "Paper", "Scissors", "Lizard", "Spock"];
	var Rules = [	{"Key": "10", "Act": "Covers" },
					{"Key": "02", "Act": "Breaks" },
					{"Key": "03", "Act": "Crushes" },
					{"Key": "40", "Act": "Vaporizes" },
					{"Key": "21", "Act": "Cuts" },
					{"Key": "31", "Act": "Eats" },
					{"Key": "14", "Act": "Disproves" },
					{"Key": "23", "Act": "Decapitates" },
					{"Key": "42", "Act": "Smashes" },
					{"Key": "34", "Act": "Poisons" }	];

	var StepNum = 0;
	var StepTimer;

	// Initialize Firebase
	var config = {
		apiKey: "AIzaSyAt_wZtcwr7pPlp-c5bipT9wXAawTI2k80",
		authDomain: "rpsls-game-xyzzy.firebaseapp.com",
		databaseURL: "https://rpsls-game-xyzzy.firebaseio.com",
		projectId: "rpsls-game-xyzzy",
		storageBucket: "",
		messagingSenderId: "1075410489758"
	};
  	firebase.initializeApp(config);
	var database = firebase.database();

	// Initialize for Firebase DB
	var Player = {
		"Name": "",
		"Pick": -1,
		"Wins": 0,
		"Lost": 0,
		"Ties": 0
	};
	var InstMsg = ["","","","",""];
	var Players = [];
	var MyIndex = -1;
	var OgIndex = -1;
	var StepNum = -1;

	var Box = [];
	Box.push($("#Player0Choices").children(".Plays"));
	Box.push($("#Player1Choices").children(".Plays"));
	Box.push($("#Results").children(".Results"));
	Box.push($("#Msgs").children(".Msgs"));
	$("#InstantMessage").hide();

	// At the initial load, get a snapshot of the current data.
	database.ref().on("value", function(snapshot) {
		var LastStep = StepNum;
		temp = snapshot.val();
		if (temp === null) {
			StepNum = 0;
		} else {
			InstMsg = temp.InstMsg;
			Players = temp.Players;
			StepNum = temp.StepNum;
		}
		UpdateBox(3, InstMsg)
		$("#MsgEntry").val("");

		// Just in case Player 1 leaves
		if (Players.length == 1) {
			$("#Player1Name").text("Player 2");
    		MyIndex = 0;
    		OgIndex = 1;
			UpdateBox(1,["","","","",""]);
		}
		if (Players.length == 2) $("#InstantMessage").show();

		if (Players.length > 0) $("#Player0Name").text(Players[0].Name + Score(0));
		if (Players.length > 1) $("#Player1Name").text(Players[1].Name + Score(1));
		Steps();
	}, function(errorObject) {
		alert("The read failed: " + errorObject.code);
	});

	$("#helpLong").on("click", function() {
		DataPopupOpen("moviePopup","https://www.youtube.com/embed/x5Q6-wMx-K8");
	})
	$("#helpShort").on("click", function() {
		DataPopupOpen("moviePopup","https://www.youtube.com/embed/iapcKVn7DdY");;
	})

	// Remove Players from Firebase
    $(window).on('beforeunload', function() {
    	InstMsg = ["","","","",""];
    	Players.splice(MyIndex, 1);
    	if (Players.length > 0) {
    		StepNum = 1;
    		SaveFirebase();
    	} else {
    		ClearFirebase();
    	}
    });

	// When User enters Name ... AddNewUser
	$(document).on('keyup', "#PlayerName", function (e) {
    	if (e.keyCode == 13) {
    		AddNewUser();
      	}
  	});

	// User Selects Choice
	$(document).on('click', ".Plays", function (e) {
		if (Players.length !== 2) return;
		if (MyIndex+2 !== StepNum) return;
		if (this.parentElement.id === "Player" + MyIndex + "Choices") {
			Players[MyIndex].Pick = $.inArray((this.innerText).trim(), RPSLS);
			if (Players[MyIndex].Pick < 0) return; // should never return here
			StepNum++;
			SaveFirebase();
		}
  	});

	// Send Instant Message
	$(document).on('keyup', "#Msgs", function (e) {
    	if (e.keyCode == 13) {
    		InstMsg.push(Players[MyIndex].Name + ": " + $("#MsgEntry").val());
    		while (InstMsg.length >= 5) {
    			InstMsg.shift();
    		}
			SaveFirebase();
      	}
  	});

	// --> Functions start here

	// Update A Box
	function UpdateBox(Idx, TextArray) {
		console.log("Updating Box #%d. At Step #%d.", Idx, StepNum);
		console.log(TextArray);
		var zBox = Box[Idx];
		for (var i=0; i<TextArray.length; i++) {
			zBox[i].innerHTML = TextArray[i] + "&nbsp;";
		}
	}

	// Add new user
    function AddNewUser() {
		if (Players.length < 2) {
			Player.Name = $("#PlayerName").val();
			Player.Pick = -1;
			Player.Wins = 0;
			Player.Lost = 0;
			$("#PlayerName").val("");
			Players.push(Player);
			MyIndex = Players.length-1;
			OgIndex = (MyIndex===0?1:0);
			$("#PlayerName").hide();
			StepNum++;
			SaveFirebase();
		} else {
			// Don't thing we'll ever get here
			alert("Game In Progress between " + Players[0].Name + " and " + Players[1].Name);
			$(window).close();
		}
  	}

  	// save Data to Firebase
	function SaveFirebase() {
		database.ref().set({
		    InstMsg: InstMsg,
		    Players: Players,
		    StepNum: StepNum
		});
	}

	// Clear all data from Firebase
	function ClearFirebase() {
		database.ref().set({});
	}

  	// Process Steps of the Game
	function Steps() {
		if (Players.length === 0) StepNum = 0;
		if (Players.length === 1) StepNum = 1;
		switch (StepNum) {
			case 0: 	// Waiting for User 0 Name
				$("#PlayerName").attr("placeholder","Waiting for New Player 1");
				UpdateBox(2, ("Waiting for New Player 1\n\n\n\n").split("\n"));
				break;
			case 1: 	// Waiting for User 1 Name
				$("#PlayerName").attr("placeholder","Waiting for New Player 2");
				UpdateBox(2, ("Waiting for New Player 2\n\n\n\n").split("\n"));
				break;
			case 2: 	// Waiting for User 0 Selection
				clearTimeout(StepTimer);
				console.clear();
				UpdateBox(2, ("Waiting for \"" + Players[0].Name + "\"to Play\n\n\n\n").split("\n"));
				UpdateBox(MyIndex, RPSLS);
				break;
			case 3: 	// Waiting for User 1 Selection
//				if (MyIndex === 0) DisplayPick(MyIndex, Players[MyIndex].Pick)
				UpdateBox(2, ("Waiting for \"" + Players[1].Name + "\"to Play\n\n\n\n").split("\n"));
				break;
			case 4:		// Display Results
				DisplayPick(0, Players[0].Pick)
				DisplayPick(1, Players[1].Pick)
				UpdateBox(2, Winner());
				StepTimer = setTimeout(function () {
					clearTimeout(StepTimer);
					UpdateBox(0,["","","","",""]);
					UpdateBox(1,["","","","",""]);
					StepNum = 2;
					SaveFirebase();
				}, 5000);
				break;
			default:
				alert("Got Here ... Who Knows how?");
		}
	}

	// Process User Pick
  	function DisplayPick(i,p){
		var Choices = [];
		for (var j=0; j<RPSLS.length; j++) {
			if (j === p) {
				Choices.push(RPSLS[j]);
			} else {
				Choices.push("");
			}
		}
		UpdateBox(i, Choices);
  	}

	// Determine the Winner (returns Result Text)
	function Winner() {
		var Key;
		var Itm;
		var Win = [];

		if (Players[MyIndex].Pick === Players[OgIndex].Pick) {
			Players[MyIndex].Ties++;
			Players[OgIndex].Ties++;
			Win.push("It's a Tie !!!");
			Win.push("");
			Win.push(RPSLS[Players[MyIndex].Pick]);
			Win.push("vs");
			Win.push(RPSLS[Players[OgIndex].Pick]);
		} else {
			Key = Players[MyIndex].Pick.toString() + Players[OgIndex].Pick.toString();
			var Test = Rules.find(Itm => Itm.Key === Key);
			if (Test === undefined) {
				Key = Players[OgIndex].Pick.toString() + Players[MyIndex].Pick.toString();
				Test = Rules.find(Itm => Itm.Key === Key);
				Players[OgIndex].Wins++;
				Players[MyIndex].Lost++;
				Win.push("You Lose !!!");
				Win.push("");
				Win.push(RPSLS[Players[OgIndex].Pick]);
				Win.push(Test.Act);
				Win.push(RPSLS[Players[MyIndex].Pick]);
			} else {
				Players[MyIndex].Wins++;
				Players[OgIndex].Lost++;
				Win.push("You Win !!!");
				Win.push("");
				Win.push(RPSLS[Players[MyIndex].Pick]);
				Win.push(Test.Act);
				Win.push(RPSLS[Players[OgIndex].Pick]);
			}
		}
		return Win;
	}

	// Return Win/Lost for both Players
	function Score(Idx) {
		if (Players[Idx].Wins + Players[Idx].Lost + Players[Idx].Ties === 0) return "";
		return " - (W:" + Players[Idx].Wins + "/L:" + Players[Idx].Lost + "/T:" + Players[Idx].Ties + ")";
	}

})