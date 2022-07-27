let index = 0

function liveFifo(){
  this.data = []
}

liveFifo.prototype.set = function(value){
	this.data.push(value)
}

liveFifo.prototype.reget = function(){
  return this.data.shift();
}

liveFifo.prototype.get = function(){
  return this.data[0];
}
liveFifo.prototype.len = function(){
  return this.data.length;
}

liveFifo.prototype.clear = function(){
	this.data.splice(0,this.data.length)
}


function playBackFifo(){
  this.data= []
}

playBackFifo.prototype.set = function(value){
	this.data.push(value);
}

playBackFifo.prototype.getAll = function(){
  return this.data;
}
playBackFifo.prototype.len = function(){
  return this.data.length;
}

playBackFifo.prototype.clear = function(){
	this.data.splice(0,this.data.length)
}

playBackFifo.prototype.getPlayBackCache = function(timeStamp){
	let tmp = this.data
	let res = []
	let index = this.data.length-1
	if(tmp[0].timeStamp == timeStamp){
		return res
	}
	if(tmp[index].timeStamp == timeStamp){
		return this.data
	}
	while(index){
		if(tmp[index].timeStamp <= timeStamp){
			if(tmp[index].type == 7){
				break
			}
			res.unshift(tmp[index])
		}
		index--
	}
	return res
}

playBackFifo.prototype.getLiveCache = function(timeStamp){
	let tmp = this.data
	let res = []
	let index = 0
	if(tmp[0].timeStamp == timeStamp){
		return this.data
	}
	while(index<this.data.length-1){
		if(tmp[index].timeStamp >= timeStamp){
			res.push(tmp[index])
		}
		index++
	}
	return res
}


export{
	liveFifo,
	playBackFifo
}