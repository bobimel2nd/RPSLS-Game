$(document).ready(function() {
	// Initialize Objects
	const RPSLS = ["Rock", "Paper", "Scissors", "Lizard", "Spock"];
	const Rules = [	{"Key": "10", "Act": "Covers" },
					{"Key": "02", "Act": "Breaks" },
					{"Key": "03", "Act": "Crushes" },
					{"Key": "40", "Act": "Vaporizes" },
					{"Key": "21", "Act": "Cuts" },
					{"Key": "31", "Act": "Eats" },
					{"Key": "14", "Act": "Disproves" },
					{"Key": "23", "Act": "Decapitates" },
					{"Key": "42", "Act": "Smashes" },
					{"Key": "34", "Act": "Poisons" }	];
	const ResultsBox = 2;
	const InstMsgBox = 3;


	var StepNum = 0;
	var StepTimer = null;

	var MyIndex = -1;
	var OgIndex = -1;

	var Player = {
		"Name": "Player",
		"Pick": -1,
		"Wins": 0,
		"Lost": 0,
		"Ties": 0
	};
	var Empty =  ["","","","",""];
	var InstMsg = Empty.slice();
	var Results = Empty.slice();
	var Players = [];

	var Box = [];
	Box.push($("#Player0Choices").children(".Plays"));
	Box.push($("#Player1Choices").children(".Plays"));
	Box.push($("#Results").children(".Results"));
	Box.push($("#Msgs").children(".Msgs"));
	$("#Msgs").hide();

	// Initialize Firebase
	const config = {
		apiKey: "AIzaSyAt_wZtcwr7pPlp-c5bipT9wXAawTI2k80",
		authDomain: "rpsls-game-xyzzy.firebaseapp.com",
		databaseURL: "https://rpsls-game-xyzzy.firebaseio.com",
		projectId: "rpsls-game-xyzzy",
		storageBucket: "",
		messagingSenderId: "1075410489758"
	};
  	firebase.initializeApp(config);
	var database = firebase.database();
	var PlayersRef = null;
	var StepNumRef = database.ref("StepNum");
	var InstMsgRef = database.ref("InstMsg");



	// Setup Event Handler for Long Help
	$("#helpLong").on("click", function() {
		DataPopupOpen("moviePopup","https://www.youtube.com/embed/x5Q6-wMx-K8");
	})

	// Setup Event Handler for Short Help
	$("#helpShort").on("click", function() {
		DataPopupOpen("moviePopup","https://www.youtube.com/embed/iapcKVn7DdY");;
	})

	// At the initial load, get a snapshot of the current data.
	database.ref("Players").on("value", function(snapshot) {
		var temp = snapshot.val();
		if (temp === null) {
			database.ref().set({}); // if nobody there then clear database
			temp = [];
		}
		if ((Players.length === 2) && (temp[0] === undefined)) {
			// Lost Player Number 1
			Players.shift();
			UpdateBox(MyIndex, Empty.slice());
			MyIndex = 0;
			OgIndex = 1;
			PlayersRef = database.ref("Players/" + MyIndex);
			PlayersRef.set(Players[MyIndex]);
			StepNumRef.set(1);
			InstMsgRef.set(Players[0].Name + ", You are Now Player #1");
			database.ref("Players/" + OgIndex).remove();
		} else {
			Players = temp;			
			for (var i=0; i<Players.length; i++) $("#Player" + i + "Name").text(Players[i].Name + Score(i));
		}
	});

	database.ref("StepNum").on("value", function(snapshot) {
		var temp = snapshot.val();
		if (temp === null) temp = 0;
		StepNum = temp;
		Steps();
	});

	database.ref("InstMsg").on("value", function(snapshot) {
		var temp = snapshot.val();
		if (temp === null) return;
		InstMsg.push(temp);
    	while (InstMsg.length > 5) {
    		InstMsg.shift();
    	}
    	UpdateBox(InstMsgBox, InstMsg);
	});

	// User Selects Choice
	$(document).on('click', ".Plays", function (e) {
		if (Players.length !== 2) return;
		if (StepNum-2 !== MyIndex) return;
		if (this.parentElement.id === "Player" + MyIndex + "Choices") {
			Players[MyIndex].Pick = $.inArray((this.innerText).trim(), RPSLS);
			if (Players[MyIndex].Pick < 0) return; // should never return here
			PlayersRef.set(Players[MyIndex]);
			StepNumRef.set(StepNum+1);
		}
  	});

	// When User enters Name ... AddNewPlayer
	$(document).on('keyup', "#PlayerName", function (e) {
    	if (e.keyCode == 13) {
    		AddNewPlayer();
			PlayersRef.set(Players[MyIndex]);
			StepNumRef.set(StepNum+1);
      	}
  	});

	// Send Instant Message
	$(document).on('keyup', "#MsgEntry", function (e) {
    	if (e.keyCode == 13) {
			InstMsgRef.set(Players[MyIndex].Name + ": " + $("#MsgEntry").val());
			$("#MsgEntry").val("");
      	}
  	});


	//
	// --> Functions start here
	//

  	// Process Steps of the Game
	function Steps() {
		if (Players.length === 0) StepNum = 0;
		if (Players.length === 1) StepNum = 1;
		switch (StepNum) {
			case 0: 	// Waiting for User 0 Name
				$("#Player0Name").text("Player 1");
				$("#Player1Name").text("Player 2");
				var Msg = "Waiting for New Player 1";
				$("#PlayerName").attr("placeholder",Msg);
				UpdateResults(Msg);
				break;
			case 1: 	// Waiting for User 1 Name
				$("#Player1Name").text("Player 2");
				var Msg = "Waiting for New Player 2";
				$("#PlayerName").attr("placeholder",Msg);
				UpdateResults(Msg);
				break;
			case 2: 	// Waiting for User 0 Selection
				if (MyIndex === -1) return;
				$("#Msgs").show();
				clearTimeout(StepTimer);
				UpdateResults("Waiting for \"" + Players[0].Name + "\"to Play");
				UpdateBox(MyIndex, RPSLS);
				break;
			case 3: 	// Waiting for User 1 Selection
				if (MyIndex === -1) return;
				if (MyIndex === 0) DisplayPick(MyIndex, Players[MyIndex].Pick)
				UpdateResults("Waiting for \"" + Players[1].Name + "\"to Play");
				break;
			case 4:		// Display Results
				if (MyIndex === -1) return;
				DisplayPick(MyIndex, Players[MyIndex].Pick)
				DisplayPick(OgIndex, Players[OgIndex].Pick)
				UpdateBox(ResultsBox, Winner());
				PlayersRef.set(Players[MyIndex]);
				StepTimer = setTimeout(function () {
					clearTimeout(StepTimer);
					UpdateBox(MyIndex, Empty.slice());
					StepNumRef.set(StepNum+1);  // round over - start new round
				}, 5000);
				break;
			case 5:		// Display Results
				if (MyIndex === -1) return;
				UpdateBox(OgIndex, Empty.slice());
				StepNumRef.set(2);  // round over - start new round
				break;
			default:
				alert("Got Here ... Who Knows how?");
		}
	}

	// Update Results
	function UpdateResults(Msg) {
	  	for (var i=0; i<Results.length; i++) Results[i] = "\n";
		Results[0] = Msg;
		UpdateBox(ResultsBox, Results);
	}

	// Update A Box
	function UpdateBox(Idx, TextArray) {
		if (Idx == -1) return;
		var zBox = Box[Idx];
		for (var i=0; i<TextArray.length; i++) {
			zBox[i].innerHTML = TextArray[i] + "&nbsp;";
		}
	}

	// Process User Pick
  	function DisplayPick(user, pick){
		var Choices = [];
		for (var j=0; j<RPSLS.length; j++) {
			if (j === pick) {
				Choices.push(RPSLS[j]);
			} else {
				Choices.push("");
			}
		}
		UpdateBox(user, Choices);
  	}

	function AddNewPlayer() {
		if (Players.length === 2) {
			// Don't thing we'll ever get here
			alert("Game In Progress between " + Players[0].Name + " and " + Players[1].Name);
			$(window).close();
		}

		MyIndex = Players.length;
		OgIndex = (MyIndex === 0?1:0);
		Player.Name = $("#PlayerName").val();
		Player.Pick = -1;
		Player.Wins = 0;
		Player.Lost = 0;
		Player.Ties = 0;
		Players.push(Player);
		$("#PlayerName").val("");
		$("#PlayerName").hide();
		$("#Msgs").show();

		PlayersRef = database.ref("Players/" + MyIndex);

	    // On disconnect remove this user's player object
	    PlayersRef.onDisconnect().remove();
		InstMsgRef.onDisconnect().set("*** Player \"" + Player.Name + "\" has left the game ***");
	}


	// Determine the Winner (returns Result Text)
	function Winner() {
		var Key;
		var Itm;
		var Win = [];

		if (Players[MyIndex].Pick === Players[OgIndex].Pick) {
			Players[MyIndex].Ties++;
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
				Players[MyIndex].Lost++;
				Win.push("You Lose !!!");
				Win.push("");
				Win.push(RPSLS[Players[OgIndex].Pick]);
				Win.push(Test.Act);
				Win.push(RPSLS[Players[MyIndex].Pick]);
			} else {
				Players[MyIndex].Wins++;
				Win.push("You Win !!!");
				Win.push("");
				Win.push(RPSLS[Players[MyIndex].Pick]);
				Win.push(Test.Act);
				Win.push(RPSLS[Players[OgIndex].Pick]);
			}
		}
		return Win;
	}

	// Return Win/Lost for a Players
	function Score(Idx) {
		if (Players[Idx].Wins + Players[Idx].Lost + Players[Idx].Ties === 0) return "";
		return " - (W:" + Players[Idx].Wins + "/L:" + Players[Idx].Lost + "/T:" + Players[Idx].Ties + ")";
	}

})