var $config = {
	breakPoints: {
		high: 10,
		low: -1
	},
	directions: ['east','west,','north','south'],
	neighbors: {
		near: {
			e: [1,0],			
			w: [-1,0],			
			n: [0,1],			
			s: [0,-1],			
			ne: [1,1],			
			nw: [-1,1],			
			se: [1,-1],			
			sw: [-1,-1],			
		},
		far: {
			e: [1,0],			
			w: [-1,0],			
			n: [0,1],			
			s: [0,-1],			
			ne: [1,1],			
			nw: [-1,1],			
			se: [1,-1],			
			sw: [-1,-1],			
		}
	},
	dimensionTypes: ['x','y','z']
};

var Cortex = function() {
	"use strict";
	var cortex = this;
	cortex.grid = [];
	cortex.Column = function(coords) {
		var self = this;
		var counter = 0;

		// Get surrounding nodes:	
		self.neighbors = (function makeNeighbors() {
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
				var newCoord = x + oscillate();
				if(newCoord > $config.breakPoints.low && newCoord < $config.breakPoints.high) {
					return newCoord;
				} else {
					return false;
				}
			};
			for(i=0;i<$config.directions.length;i++) {
				mi = mutationInterval();
				neighborArray[$config.directions[i]] = {};
				for(a=0;a<$config.dimensionTypes.length;a++) {
					if(mi === a) {
						neighborArray[$config.directions[i]][$config.dimensionTypes[a]] = mutate(coords[$config.dimensionTypes[a]]);
						if(neighborArray[$config.directions[i]][$config.dimensionTypes[a]] === false) {
							neighborArray[$config.directions[i]] = null;
							break;
						}
					} else {
						neighborArray[$config.directions[i]][$config.dimensionTypes[a]] = coords[$config.dimensionTypes[a]];
					} 
				}
			}
			return neighborArray;
		})($config, coords);	
		
		// console.log(self.neighbors);
		
		self.propagation = function() {
			var i;
			var j = 0;
			var iLength;
			var jLength;
			var x;
			var y;
			var z;
			var positionArray = [];
			var neighborhood = self.neighbors;
			// var neighborhood = new self.neighbors;
			for(i=0, iLength = $config.directions.length; i < iLength; i++) {
				// for each neighbor...
				
				if(neighborhood[$config.directions[i]]) {				
					x = neighborhood[$config.directions[i]][$config.dimensionTypes[0]];
					y = neighborhood[$config.directions[i]][$config.dimensionTypes[1]];
					z = neighborhood[$config.directions[i]][$config.dimensionTypes[2]];
				                              
				// for(j = 0, jLength = $config.dimensionTypes.length; j<jLength; j++) {
					if(!window.Cortex.grid === undefined) {
						window.Cortex.grid = [];
					} 
					if(window.Cortex.grid[x] === undefined) {
						window.Cortex.grid[x] = [];
					}
					if(window.Cortex.grid[x][y] === undefined) {
						window.Cortex.grid[x][y] = [];
					}
					if(window.Cortex.grid[x][y][z] === undefined) {
						window.Cortex.grid[x][y][z] = {};
						var stuff = new cortex.Column(neighborhood[$config.directions[i]]);
						window.Cortex.grid[x][y][z] = stuff;
					} else {
						// window.Cortex.grid[x][y][z].checkin();
					}
				// }
				
					// window.Cortex.grid[neighborArray[$config.directions[i];
				
				
					// for(i=0;i<$config.directions.length;i++) {
						// x = self.neighbors[$config.directions[i]];
						// console.log(curNeighbor());
					// }
				}
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
		
		self.propagation();
		
		
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
						window['Cortex'].grid[self.childAddress[i].x][self.childAddress[i].y][self.childAddress[i].z](fromBelow);
					} else {
						alert("Pattern not recognized");
						window['Cortex'].grid[self.parentAddress.x][self.parentAddress.y][self.parentAddress.z](fromBelow);
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

var dims = {x:5,y:5,z:5};

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
// var cube = buildCortex(dims);

// window['Cortex'].propagate();