var app = angular.module('appModule',[]);
var socket;
app.controller('gameController',function($scope){
    $scope.sendName = function(){
        socket.emit('myName', $scope.name);
        socket.emit('requestCards',$scope.name);
    }
    
    $scope.ask = function(){
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
         var msg = new SpeechSynthesisUtterance('Hello World');
         window.speechSynthesis.speak(msg);
         
        /* myAudio.src = "http://www-scf.usc.edu/~slodha/css12/voices/"+imgName+".mp3"
         myAudio.play();*/
        $scope.$apply($scope.number);
    }
    
    $scope.callHint = function(){
        socket.emit('hint',$scope.name);
    
    }
    
    $scope.initialize = function(){
       socket = io();
        $scope.askedPlayerId = 0;
        $scope.showName = 1;
        $scope.turn = false;
        $scope.player = null;
        $scope.disableButton = false;
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
                $scope.turn = false;
            }
                else
                $scope.message = "Bingo!!"
            $scope.$apply($scope.message);
            $scope.player = player;
            $scope.$apply($scope.player);
            $scope.$apply($scope.false);
        });
        
        socket.on('hint',function(hintObject){
            alert("You can ask "+ hintObject.Player.p_name + "for card of rank "+hintObject.Rank);
        });
        
        socket.on('gameOver',function(player){
            $scope.disableButton  = true;
            if(player.p_id == $scope.player.p_id)
                $scope.message = "You Won!!";
            else
                $scope.message = player.p_name+" Won! Sorry!";
            $scope.$apply($scope.message);
        });
                  
        socket.on('updatePlayerStackCount',function(player){
           for(var i=0;i<$scope.players.length;i++)
           {
               if($scope.players[i].p_id == player.p_id)
               {
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
    }
});