var $config = {
	breakPoints: {
		high: 9,
		low: -1
	},
	neighbors: {
		e: [1,0],			
		w: [-1,0],			
		n: [0,1],			
		s: [0,-1],			
		ne: [1,1],			
		nw: [-1,1],			
		se: [1,-1],			
		sw: [-1,-1]		
	},
	dimensionTypes: ['x','y','z']
};

var Cortex = function() {
	"use strict";
	var cortex = this;
	cortex.grid = [];
	cortex.Column = function($coords) {
		var self = this;
		var counter = 0;
		$coords = $coords || {x:0,y:0,z:0};

		// Get surrounding nodes:	
		var neighbors = function(coords) {
			var i;
			var x;
			var y;
			var z;
			var iLength;
			var neighborKeys = Object.keys($config.neighbors);
			this.neighbors = {};
			for(i=0, iLength = neighborKeys.length; i < iLength; i++) {
				this.neighbors[neighborKeys[i]] = {};
				x = coords.x + $config.neighbors[neighborKeys[i]][0];
				if(x > $config.breakPoints.low && x < $config.breakPoints.high) {
					this.neighbors[neighborKeys[i]].x = x;
				} else {
					this.neighbors[neighborKeys[i]] = null;
					continue;
				}
				y = coords.y + $config.neighbors[neighborKeys[i]][1];
				if(y > $config.breakPoints.low && y < $config.breakPoints.high) {
					this.neighbors[neighborKeys[i]].y = y;
				} else {
					this.neighbors[neighborKeys[i]] = null;
					continue;
				}
				
				this.neighbors[neighborKeys[i]].z = coords.z;
			}
			this.parent = {
				x: Math.round(coords.x/2),
				y: Math.round(coords.y/2),
				z: coords.z + 1
			};
			this.children = [];
		};
		self.neighborhood = new neighbors($coords);
		self.registerChild = function(childCoords) {
			var totalChildren = self.neighbors.children.push(childCoords);
			if(totalChildren === 4){
				cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z].propagate.up();
			}
		};
		self.propagate = {
			sideways : function () {
				var i;
				var j;
				var neighborKeys = Object.keys(self.neighborhood.neighbors);
				var totalNeighbors = neighborKeys.length;
				var totalDimTypes = $config.dimensionTypes.length;
				var neighborCoords = {};
				var positionArray = [];
				
				// Deal with the peers:
				for(i=0; i < totalNeighbors; i++) {
					// for each neighbor address 
					if(self.neighborhood.neighbors[neighborKeys[i]] !== null) {
						for(j=0; j < totalDimTypes; j++) {
							neighborCoords[neighborKeys[i]]= self.neighborhood.neighbors[neighborKeys[i]][$config.dimensionTypes[j]];
						}
						if(cortex.grid[neighborCoords.x] === undefined) {
							cortex.grid[neighborCoords.x] = [];
						}
						if(cortex.grid[neighborCoords.x][neighborCoords.y] === undefined) {
							cortex.grid[neighborCoords.x][neighborCoords.y] = [];
						}
						if(cortex.grid[neighborCoords.x][neighborCoords.y][neighborCoords.z] === undefined) {
							cortex.grid[neighborCoords.x][neighborCoords.y][neighborCoords.z] = {};
							cortex.grid[neighborCoords.x][neighborCoords.y][neighborCoords.z] = new cortex.Column(self.neighborhood[neighborKeys[i]]);
							cortex.grid[neighborCoords.x][neighborCoords.y][neighborCoords.z].propagate.sideways();
						}
					}
				}
			},
			// Deal with the parents
			up: function() {
				if(cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z] !== undefined) {
					cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z].registerChild($coords);
				} else {
					cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z] = new cortex.Column(self.neighborhood.parent);
				}
			}
		};
		
		
		
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
var protoColumn = new window['Cortex'].Column;
protoColumn.propagate.sideways();


