window['playingField'] = [];

var Cortex = function() {
	"use strict";
	var cortex = this;
	cortex.grid = [];
	cortex.Column = function(coords) {
		var self = this;
		var counter = 0;
			
		self.neighbors = function() {
			this.east = function() {
				var xyz = {};
				var newCoord = getNeighbor(coords.x,1);
				if(!newCoord) {
					delete this;
					return;
				}
				xyz.x = newCoord;
				xyz.y = coords.y;
				xyz.z = coords.z;
				return xyz;
			};
			this.west = {
				x : getNeighbor(coords.x,-1),
				y : coords.y,
				z : coords.z
			};
			this.north = {
				x : coords.x,
				y : getNeighbor(coords.y,1),
				z : coords.z
			};
			this.south = {
				x : coords.x,
				y : getNeighbor(coords.y,-1),
				z : coords.z
			};
			this.up = {
				x : coords.x,
				y : coords.y,
				z : getNeighbor(coords.z,1),
			};
			this.down = {
				x : coords.x,
				y : coords.y,
				z : getNeighbor(coords.z,-1),
			};
			// function getNeighbor(coor, val) {
				// var newCoord = (coor + val) > -1 ? coor + val : null;
				// return newCoord;
			// }
		};
		function makeNeighbors(coords) {
			var dirs = ['east','west,','north','south','up','down'];
			var dims = ['x','y','z'];
			var i;
			var a;
			var mi;
			var neighborArray = {};
			var mutationInterval = (function () {
				var y = 0;
				var first = true;
				return function() {
					if(first) {
						first = false;
						return y;
					}
					first = true;
					return y++;
				};
			})();
			var oscillate = (function() {
				var posneg = 1;
				return function(){
					posneg = posneg === 1 ? -1 : 1;
					return posneg;
				};
			})();
			var mutate = function(x) {
				return x + oscillate();
			};
			for(i=0;i<dirs.length;i++) {
				self.neighbors[dirs[i]] = {};
				mi = mutationInterval();
				neighborArray[dirs[i]] = {};
				for(a=0;a<dims.length;a++) {
					neighborArray[dirs[i]][dims[a]] = mi === a ? mutate(coords[dims[a]]) : coords[dims[a]];
				}
			}
			return neighborArray;
		}		
		
		self.propogation = function() {
			var i;
			// var neighborhood = new self.neighbors;
			var neighborhood = makeNeighbors(coords);
			var neighborKeys = Object.keys(neighborhood);
			var curNeighbor;
			for(i=0;i<neighborKeys.length;i++) {
				curNeighbor = neighborhood[neighborKeys[i]];
				console.log(curNeighbor());
			}
			
			
			// 1. Create base
			// 2. Detect base has been created by coords x and y respectively reaching 0 
			// 3. Init the base
			// 4. Repeat until detection that an init is called on a <4X and <4Y layer has been attempted
			
			
			// if(
				// window['Cortex'].cube[self.parentAddress.x][self.parentAddress.y][self.parentAddress.z] !== undefined &&
				// self.parentAddress.z !== 0
				// // && window['Cortex'].cube[coords.x][coords.y][coords.z + 1] !== undefined 
				// // && window['Cortex'].cube[coords.x][coords.y + 1][coords.z] !== undefined 
			// ) {
				// newCoords = {}
				// window['Cortex'].cube[self.parentAddress.x][self.parentAddress.y][self.parentAddress.z] = new cortex.Column(newCoords);
			// }
			// Create siblings
		};
		
		self.propogation();
		
		
		
		
		
		self.levels = [];
		self.Pattern = function(data, direction){
			this.direction = direction;
			this.matched = false;
			this.currentCoordinates = coordinates;
			this.data = data;
		};
        self.getNextIndex = (function() {
		   var id = 0;
		   return function() { return id++; };
		})();
		self.purgeColumn = function() {
			for(var i;i < self.totalLevels; i++) {
				self.level[i].purge();
			}
		};
		self.startRhythm = function() {
			
		};
		
		// Data entry level
		counter = self.getNextIndex();
		self.levels[counter] =	function(incoming) {
			startTimer();
			pattern = new Pattern(incoming, 1);
			this.purge = function() {
								
			};
			self.levels[counter + incoming.direction](incoming);
		};
			
		// // Passes up the pattern
		// counter = self.getNextIndex();
		// self.levels[counter] =	function(incoming) {
			// this.purge = function() {
			// };
			// self.levels[counter + incoming.direction](incoming);
		// };
	
		// Passes up the pattern
		counter = self.getNextIndex();
		self.levels[counter] =	function(incoming) {
			this.purge = function() {
								
			};
			self.levels[counter + incoming.direction](incoming);
		};
	
		// Tests if the incoming pattern matches a previous pattern
		counter = self.getNextIndex();
		self.levels[counter] =	function(incoming) {
			var fromBelow = null;
			var fromAbove = null;
			this.purge = function() {
				// clear all inputs
				fromBelow = fromAbove = null;				
			};
			// Is the data recognized?
			function decide() {
				var recognise = false;
				if(fromAbove && fromBelow) {
					if(fromAbove == fromBelow) {
						alert("Pattern recognized");
						window['Cortex'][self.childAddress[i].x][self.childAddress[i].y][self.childAddress[i].z](fromBelow);
					} else {
						alert("Pattern not recognized");
						window['Cortex'][self.parentAddress.x][self.parentAddress.y][self.parentAddress.z](fromBelow);
					}
				}
			}
			if(incoming && incoming.rising) {
				fromAbove = incoming.data;
			} else if(incoming.falling) {
				fromBelow = incoming.data;
			}
			decide();
		};
		
		// 
		counter = self.getNextIndex();
		self.levels[counter] =	function(incoming) {
			
			self.levels[counter + incoming.direction](incoming);
		};
		
		//
		counter = self.getNextIndex();
		self.levels[counter] =	function(incoming) {
			
			self.levels[counter + incoming.direction](incoming);
		};
		
		self.totalLevels = self.getNextIndex() - 1;
	};
	
};
window['Cortex'] = new Cortex();

var dims = {x:50,y:50,z:50};

function buildCortex(dims) {
	var cube = [];
	// var x = 0;
	// var y = 0;
	// var z = 0;	
	// for(x = 0;x<dims.x;x++) {
		// cube[x] = [];	
		// for(y = 0;y<dims.y;y++) {
			// cube[x][y] = new window['Cortex'].Column({x:x,y:y});
		// }
	// }	
	
	// for(x = 0;x<dims.x;x++) {
		// cube[x] = [];	
		// for(y = 0;y<dims.y;y++) {
			// cube[x][y] = [];
			// for(z = 0;z<dims.z;z++) {
				// // if() ratio between z and x/y 
				// cube[x][y] = new window['Cortex'].Column({x:x,y:y});
			// }
		// }
		// for(y = 0;y<dims.y;y++) {
			// // for(z = 0;z<dims.z;z++) {
				// window['Cortex'].cube[x][y].init();
			// // }
		// }
		// if(window['Cortex'].cube[x][y][z]);
	// }	

	cube = new window['Cortex'].Column(dims);
	console.log(cube);
	return cube;
}
var cube = buildCortex(dims);




