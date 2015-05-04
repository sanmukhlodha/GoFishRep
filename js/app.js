var app = angular.module('appModule',[]);
var socket;
app.controller('gameController',function($scope){
    
    $scope.sendName = function(){
        socket.emit('requestCards',$scope.name);
        socket.emit('myName', $scope.name);
    }
    
    $scope.ask = function(){
        $scope.turn = false;
        $scope.$apply($scope.turn);
        socket.emit('ask',$scope.number,$scope.askedPlayerId)
    }
    
    $scope.selectCard = function(imgName) {
        if(imgName.length > 2) {
            $scope.number = imgName.charAt(0) + imgName.charAt(1);
        }
        else {
            $scope.number = imgName.charAt(0);
        }   
         var myAudio = document.getElementById(imgName)
        /* var msg = new SpeechSynthesisUtterance('Hello World');
         window.speechSynthesis.speak(msg);*/
         /*
         myAudio.src = "http://www-scf.usc.edu/~slodha/css12/voices/"+imgName+".mp3"
         myAudio.play();*/
         
         $scope.getCardClip(imgName);
        $scope.$apply($scope.number);
    }
    
    $scope.callHint = function(){
        if($scope.turn == true)
        {
            socket.emit('hint',$scope.name);
        }
    }
    
    $scope.speak = function(stringToPlay)
    {
       if(responsiveVoice.length != 0)
	{
      		responsiveVoice.cancel();
		responsiveVoice.speak(stringToPlay,$('#voiceselection').val());
	}	
	else
	{
		responsiveVoice.speak(stringToPlay,$('#voiceselection').val());
	}
    }
    $scope.getSuit = function(suit){
        switch(suit)
        {
            case 'S': return 'spades';
            case 'D': return 'diamonds';
            case 'H': return 'hearts';
            case 'C': return 'clubs';
        }
        return '-1';
    }
    
    $scope.getRank = function(rank){
        switch (rank)
        {
            case 'A': return 'ace';
            case '1': return 'one';
            case '2': return 'two';
            case '3': return 'three';
            case '4': return 'four';
            case '5': return 'five';
            case '6': return 'six';
            case '7': return 'seven';
            case '8': return 'eight';
            case '9': return 'nine';
            case '10': return 'ten';
            case 'J': return 'jack';
            case 'Q': return 'queen';
            case 'K': return 'king';
        }
        return '-1';
    }
    
    $scope.getCardClip = function(card)
    {
        var rank, suit;
        if(card.length > 2) {
            rank = card.charAt(0) + card.charAt(1);
            suit = card.charAt(2);
        }
        else {
            rank = card.charAt(0);
            suit= card.charAt(1);
        }   
        
        cardStr = $scope.getRank(rank) + " of " + $scope.getSuit(suit);
        $scope.speak(cardStr);
    }
    
    
    $scope.initialize = function(){
        socket = io();
        $scope.askedPlayerId = 0;
        $scope.showName = 1;
        $scope.max_lim = false;
        $scope.turn = false;
        $scope.player = null;
        $scope.disableButton = false;
   
        $(document).keypress(function(event){
            if(String.fromCharCode(event.which) == 'h' || String.fromCharCode(event.which) == 'H')
	       {
               $scope.callHint();
	       }
	
        });
        
        $(document).keydown(function(event){    
            var key = event.which;                
            switch(key) {
              case 37:
				alert("LEFT !!");
                  break;
              case 38:
				alert("UP !!");
					//Play Instructions..
				var audioElement = document.createElement('audio');
				audioElement.setAttribute('src','Instructions.mp3');
				audioElement.play();
				break;
              case 39:
				  alert("Right");
                  break;
              case 40:
				alert("DOWN !!");
				//Start New game
				  
                  break;
            }   
        }); 
        
        socket.on('maximumLimit',function(obj){
            $scope.max_lim = true;
            $scope.statusMessage = obj;
            $scope.$apply($scope.statusMessage);
        });
        
        socket.on('playersInfoObject',function(players){
            $scope.players = players;
            $scope.$apply($scope.players);
        });
        socket.on('sendCards',function(player){
            $scope.showName = 0;
            $scope.player = player;
            $scope.$apply($scope.player);
        });
        socket.on('resultAsk',function(player,found){
            if(found==0)
            {
                $scope.message = "Go Fish!";
                   $scope.$apply($scope.message);
                $scope.turn = false;
            }
                else
            {
                $scope.turn = true;
                $scope.$apply($scope.turn);
                $scope.message = "Bingo!!"
            }
            $scope.$apply($scope.message);
            $scope.player = player;
            $scope.$apply($scope.player);
        });
        
        socket.on('hint',function(hintObject){
            if(hintObject != null)
            {
                  $("#myModal").modal('show');
                $('#modaltitle').html('Your Hint!');
                var dialogue = "You can ask "+ hintObject.Player.p_name + " for card of rank "+hintObject.Rank
                $('#modalbody').html(dialogue);
                $scope.speak(dialogue);
            }
            else
            {
                $("#myModal").modal('show');
                $('#modaltitle').html('Your Hint!');
                var dialogue = "No hints at this time";
                $('#modalbody').html(dialogue);
                $scope.speak(dialogue);
            }
            
        });
        
        socket.on('gameOver',function(player){
            $scope.disableButton  = true;
            if(player.p_id == $scope.player.p_id)
                $scope.statusMessage = "You Won!!";
            else
                $scope.statusMessage = player.p_name+" Won! Sorry!";
            $scope.$apply($scope.statusMessage);
        });
                  
        socket.on('updatePlayerStackCount',function(player){
           for(var i=0;i<$scope.players.length;i++)
           {
               if($scope.players[i].p_id == player.p_id)
               {
                   $('.error').stop().fadeIn(400).delay(3000).fadeOut(400);
                   $scope.players[i].numberOfStacks = player.numberOfStacks;
                   $scope.$apply($scope.players);
               }
           }
        
        });
        
        socket.on('turn',function(id){
        $scope.turn = false;    
       
               if($scope.player.p_id == id)
               {
                   $scope.turn = true;
               }
            $scope.$apply($scope.turn);
        });
        
        socket.on('status',function(obj){
            
            $scope.statusMessage =  obj.currPlayer.p_name+" asked for card of rank "+ obj.rank + " from " + obj.askedPlayer.p_name+": "+ obj.result;
            $scope.$apply($scope.statusMessage);
            setTimeout(function(){
            $("#statusMessage").fadeOut(1250).delay().fadeIn(1250);
            });
        });
        
        
    }
});