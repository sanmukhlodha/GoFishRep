var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : 'aigofish',
  password : ''
});

connection.connect();

var truncateAITable =function(){

    var query = connection.query('TRUNCATE turns',function(err, rows){
        console.log("Truncated table turns");
    
    });

}




truncateAITable();


var cardid = 1;
var num_players = 0;
var Cards;
var NUM_DEAL = 5;
var PlayersInfo = new Array();
var Players = new Array();

var PlayerInfo = function(id,name,numberOfStacks) {
    var self = this;
    self.p_name =   name;
    self.p_id = id;
    self.numberOfStacks = numberOfStacks;
    return self;
}

var indexOf =function(rank) {
    if(1< rank && rank <=10)
            return rank;
    console.log("Rank is greater than 10 :"+rank);
    if(rank=="A")
        return 1;
    if(rank=="J")
        return 11;
    if(rank=="Q")
        return 12;
    if(rank=="K")
        return 13;
}



var Player = function(id,name,cards) {
    var self = this;
    self.p_id = id;
    self.p_name = name;
    self.p_cards = cards;
    self.stackCount = new Array(14);
    for(i=1;i<14;i++)
        self.stackCount[i] = 0;
    self.numberOfStacks = 0;
    self.turn = false;
    return self;
}

var Card = function(rank,suit) {
    var self = this;
    self.id = cardid++;
    self.rank = rank;
    self.suit = suit;
    self.name = self.rank + self.suit;
    return self;
}

//ViP: Edited
var removePlayer=function(player, remove) {
    for(i=0;i<Players.length;i++) {
        if(Players[i].p_id == player.p_id) {
            Players.splice(i,1);
            i--;
            if(remove == false) {
                return;
            }
            break;
        }
    }

    for(j = 0; j < PlayersInfo.length; j++) {
        if(PlayersInfo[j].p_id == player.p_id) {
            PlayersInfo.splice(j, 1);
            j--;
            return;
        }
    }
}
 
//ViP: new
var addCardsToTableStack = function(player) {
    var playerCards = player.p_cards;
    for(i=0; i < playerCards.length; i++) {
        Cards.push(playerCards[i]);
    }        
}

var StatusObject = function(currPlayer, askedPlayer, rank, result){
    var self = this;
    self.currPlayer = currPlayer;
    self.askedPlayer = askedPlayer;
    self.rank = rank;
    self.result = result;
    return self;
}



var hintObject = function(Player,Rank) {
    var self = this;
    self.Player = Player;
    self.Rank = Rank;
    return self;
}

function stackShuffle() {
    var i, j, k;
    var temp;
    // Shuffle the stack 'n' times.

    for (j = 0; j < Cards.length; j++) {
        k = Math.floor(Math.random() * Cards.length);
        temp = Cards[j];
        Cards[j] =Cards[k];
        Cards[k] = temp;
    }
}

function stackDeal() {
    if (Cards.length > 0)
        return Cards.shift();
  
    else
        return null;
}

var removeRank = function(p_cards,rank) {
    console.log("+++++++++++++++++++++++ " + p_cards.length+"Rank: "+rank);
    for(i=0;i<p_cards.length;i++) {
        if(p_cards[i].rank == rank) {
            p_cards.splice(i,1);
            i--;
        }
    }
    console.log("+++++++++++++++++++++++ "+p_cards.length+"Rank: "+rank);
    return p_cards;
}

var pickRandom = function() {
    return stackDeal();
}


var removeCards = function(p_id,num) {
   var askedPlayer;
    for (i = 0; i < Players.length; i++) {
        if (Players[i].p_id == p_id) {
            askedPlayer = Players[i];
            for (j = 0; j < askedPlayer.p_cards.length; j++) {
                if (askedPlayer.p_cards[j].rank == num) {
                    askedPlayer.p_cards.splice(j,1);
                    j--;
                }
            }
        }
    }
    return askedPlayer;
}


var displayStack = function(stack) {
    for(i=1;i<14;i++) {
        console.log(i+":"+stack[i]);
    }
}

var findCards = function (num, p_id) {
    var resultAsk = new Array();
    for (i = 0; i < Players.length; i++) {
        if (Players[i].p_id == p_id) {
            for (j = 0; j < Players[i].p_cards.length; j++) {
                if (Players[i].p_cards[j].rank == num) {
                    resultAsk.push(Players[i].p_cards[j]);
                }
            }
        }
    }
    return resultAsk;
}

var gameEnd = function() {
    var max =-1;
    var winner;
    for(i=0;i<Players.length;i++) {
        if(max < Players[i].numberOfStacks) {
            max = Players[i].numberOfStacks;
            winner = Players[i];
        }
    }
    console.log("Game end 1");
    io.sockets.emit('gameOver',winner);
     console.log("Game end 2");
}
var createDeck = function() {
    var n =1;
    var ranks = new Array("A", "2", "3", "4", "5", "6", "7", "8", "9",
                          "10", "J", "Q", "K");
    var suits = new Array("C", "D", "H", "S");
    var i, j, k;
    var m;
    l =0;
    m = ranks.length * suits.length;
    // Set array of cards.
    Cards = new Array(m);
    // Fill the array with 'n' packs of cards.
    // for (i = 0; i < n; i++)
    for (j = 0; j < suits.length; j++)
        for (k = 0; k < ranks.length; k++)
            Cards[l++] =
              new Card(ranks[k], suits[j]);
}

app.get('/', function(req, res){
    res.sendFile('index.html', { root: __dirname });
});

io.on('connection', function(socket){
    var newPlayer;
    socket.on('requestCards',function(name){
        num_players++;

        if(num_players==1) {
            createDeck();
        }

        stackShuffle();
        var player_cards =  new Array(NUM_DEAL);

        for(i = 0; i < NUM_DEAL; i++) {
            var cardReturned = stackDeal();
            console.log("Card Removed"+cardReturned.name);
            player_cards[i] = cardReturned;
        }
        newPlayer = new Player(socket.id,name,player_cards);

        for(i =0;i< NUM_DEAL;i++){
            //console.log(indexOf(player_cards[i].rank));
            newPlayer.stackCount[indexOf(player_cards[i].rank)]++;
            if(newPlayer.stackCount[indexOf(player_cards[i].rank)] == 4) {
                newPlayer.p_cards = removeRank(newPlayer.p_cards,card.rank);
                newPlayer.stackCount[indexOf(player_cards[i].rank)] = 0;
                newPlayer.numberOfStacks++;
                var playerInfo = new PlayerInfo(newPlayer.p_id,newPlayer.p_name,newPlayer.numberOfStacks);
                io.sockets.emit('updatePlayerStackCount',playerInfo);
            }
            //console.log(newPlayer.stackCount[indexOf(player_cards[i].rank)]);
        } 
        displayStack(newPlayer.stackCount);
        Players.push(newPlayer);

        socket.emit('sendCards',newPlayer);
        if(num_players == 1) {
            console.log("Emiting turn for 1st player");
            socket.emit('turn',newPlayer.p_id);
        }
    });

   
    var getPlayerFromId = function(p_id){
        for(var i=0; i<Players.length; i++){
            if(Players[i].p_id == p_id)
                return Players[i];
        }
        return null;
    }
    

    socket.on('myName' , function(name){
        console.log('new player with name: ' + name);
        var newPlayerInfo = new PlayerInfo(socket.id,name,0);
        PlayersInfo.push(newPlayerInfo);
        io.sockets.emit('playersInfoObject',PlayersInfo);
    });


    socket.on('ask',function(number,p_id){
        console.log("Cards length"+Cards.length);
        var currPid = p_id;
        console.log("Number:"+number+"+Pid :"+p_id); 
        var askedCards = findCards(number,p_id);
        console.log("Asked Cards :"+askedCards.length);
        
        var post  = {pid: newPlayer.p_id, rank:number};
        var query = connection.query('INSERT INTO turns SET ?', post, function(err, result) {
            if(err) console.log("Already Exists");
        });
        console.log(query.sql); 

        var askedPlayer = getPlayerFromId(p_id);
        
        var statusObject = new StatusObject(newPlayer, askedPlayer,number,null); 
        
        if(askedCards.length > 0) {
            statusObject.result = "Bingo!";
            if(Cards.length!=0) {
                newPlayer.stackCount[indexOf(askedCards[0].rank)]+=askedCards.length;

                for(var i=0;i<askedCards.length;i++) {
                    newPlayer.p_cards.push(askedCards[i]);
                }
                if(newPlayer.stackCount[indexOf(askedCards[0].rank)] == 4) {
                    newPlayer.p_cards = removeRank(newPlayer.p_cards,askedCards[0].rank);
                    newPlayer.stackCount[indexOf(askedCards[0].rank)] = 0;
                    newPlayer.numberOfStacks++;
                    var playerInfo = new PlayerInfo(newPlayer.p_id,newPlayer.p_name,newPlayer.numberOfStacks);
                    var post  = {pid: newPlayer.p_id, rank:askedCards[0].rank};
                    var query = connection.query('DELETE FROM turns WHERE ?',post, function(err, result) {
                        if(!err) console.log("Could not delete");
                    });
                    console.log(query.sql);
                    io.sockets.emit('updatePlayerStackCount',playerInfo);
                }

                var askedPlayer = removeCards(p_id,askedCards[0].rank);
                var post  = {pid: p_id, rank:askedCards[0].rank};
                var query = connection.query('DELETE FROM turns WHERE ?',post, function(err, result)                              {
                        if(!err) console.log("Could not delete");
                    });
                console.log(query.sql);
                askedPlayer.stackCount[indexOf(askedCards[0].rank)]-=askedCards.length;
                removePlayer(askedPlayer, false);
                console.log("Asked Player Removed:"+askedPlayer.p_id);
                Players.push(askedPlayer);
                if (io.sockets.connected[p_id]) {
                    io.sockets.connected[p_id].emit('sendCards',askedPlayer);

                    //console.log(askedPlayer.p_cards.length);
                }

                removePlayer(newPlayer, false);
                //    console.log("Player Removed:"+newPlayer.p_id);
                Players.push(newPlayer);
                //  console.log("Player Pushed:"+newPlayer.p_id);
                socket.emit("resultAsk",newPlayer,1);
                console.log("Adding "+askedCards[0].rank);
                displayStack(newPlayer.stackCount);
                if(Cards.length==0)
                    gameEnd();
            }
        }
        else {  // Go fish case
            statusObject.result = "GoFish!"
            if(Cards.length != 0) {
                var card = pickRandom();
                newPlayer.p_cards.push(card);
                newPlayer.stackCount[indexOf(card.rank)]++;
                if(newPlayer.stackCount[indexOf(card.rank)] == 4) {
                    newPlayer.p_cards = removeRank(newPlayer.p_cards,card.rank);
                    newPlayer.stackCount[indexOf(card.rank)] = 0;
                    newPlayer.numberOfStacks++;
                    var playerInfo = new PlayerInfo(newPlayer.p_id,newPlayer.p_name,newPlayer.numberOfStacks);
                    io.sockets.emit('updatePlayerStackCount',playerInfo);
                }
                removePlayer(newPlayer, false);
                // console.log("Player Removed:"+newPlayer.p_id);
                Players.push(newPlayer);
                // console.log("Player Pushed:"+newPlayer.p_id);
                newPlayer.turn = false;

                for(var i=0;i<Players.length;i++) {
                    if(Players[i].p_id == newPlayer.p_id){
                        console.log("i previous::: " +i);
                        console.log("players length:::  "+ Players.length);
                        i = (i+1)%Players.length;
                        console.log("i later::: "+i);
                        io.sockets.emit('turn',Players[i].p_id);
                        break;
                    }
                }

                socket.emit("resultAsk",newPlayer,0);
                console.log("Adding Go Fish "+card.rank);
                displayStack(newPlayer.stackCount);

                if(Cards.length==0)
                    gameEnd();
            }
        }
        
        io.sockets.emit('status',statusObject);
        
        
        
        
    });
    
     socket.on("hint",function(name){
            console.log("Hint called by "+ name);
            var i =0;
            var found = false;
            for(i=0;i<newPlayer.p_cards.length;i++)
            {
                
                var rankIterator = newPlayer.p_cards[i].rank;
                var select = {rank : rankIterator};
                var query = connection.query('SELECT * FROM turns WHERE ?', select,function(err, rows) {
                       if (err) throw err;
                        console.log("Total matched hints for card "+select.rank +" is : "+ rows.length);
                        for (var j in rows) {
                                
                                console.log('For card ' + select.rank +'Player ID ', rows[j].pid);
                                found = true;
                                
                                for(var k = 0; k < Players.length ; k++)
                                {
                                    console.log("Player id : "+Players[k].p_id);
                                    console.log("Result pid :"+rows[j].pid);
                                    if(Players[k].p_id == rows[j].pid && rows[j].pid != newPlayer.p_id)
                                    {
                                        var hint = new hintObject(Players[k],rows[j].rank);
                                        console.log("Ask "+Players[k].p_name);
                                        socket.emit('hint',hint);
                                        found = true;        
                                        break;
                                    }
                                }
                                break;
                        }
                    });
                if(found) 
                    break;
            }
            if(!found)
                socket.emit('hint',null);
            
        });
    
    
    
    //ViP: Remove player on diconnection or refresh
    socket.on('disconnect', function(socket){
        if(newPlayer != null && newPlayer != undefined) {
            console.log("Cards length in the table stack : " + Cards.length);
            addCardsToTableStack(newPlayer);
            removePlayer(newPlayer, true);
            num_players--;
            console.log("Cards length in the table stack : " + Cards.length);
            io.sockets.emit('playersInfoObject', PlayersInfo);
            console.log("diconnected --- >> " + newPlayer.p_id);
            console.log("Total Number of Players in the game : " + num_players);
        }
    });
    
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});