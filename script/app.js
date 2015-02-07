var dupObj = {};
var output = "";
var $config = {
	breakPoints: {
		high: 98,
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
var domHelper = function() {
	
};
var Cortex = function() {
	"use strict";
	var cortex = this;
	cortex.grid = [];
	cortex.Column = function($coords) {
		var self = this;
		var counter = 0;
		
		// Halfast logging:
		var layerTest = [0,1,2,3,4,5,6];
		var tally = [];
		var duh;
		
		for(duh=0;duh<layerTest.length;duh++) {
			if($coords.z == duh) {
				if(!tally[duh]) {tally[duh] = 0;}
				output += $coords.x + "#" + $coords.y + "#" + $coords.z + ":0:" + tally[duh]++ + "<br>";
			}
		}

		self.coords = $coords;
		
		// Get surrounding nodes:	
		var neighbors = function(coords) {
			var i;
			var x;
			var y;
			var z;
			var iLength;
			this.initNeighborKeys = Object.keys($config.neighbors);
			this.neighborKeys = [];
			this.neighbors = {};
			for(i=0, iLength = this.initNeighborKeys.length; i < iLength; i++) {
				x = coords.x + $config.neighbors[this.initNeighborKeys[i]][0];
				y = coords.y + $config.neighbors[this.initNeighborKeys[i]][1];
				if(x > $config.breakPoints.low && 
					x < $config.breakPoints.high &&
					y > $config.breakPoints.low && 
					y < $config.breakPoints.high) 
				{
					this.neighbors[this.initNeighborKeys[i]] = {};
					this.neighbors[this.initNeighborKeys[i]].x = x;
					this.neighbors[this.initNeighborKeys[i]].y = y;
					this.neighbors[this.initNeighborKeys[i]].z = coords.z;
					this.neighbors[this.initNeighborKeys[i]].confirmed = false;
					this.neighborKeys.push(this.initNeighborKeys[i]);
				}
			}
			this.parent = {
				x: Math.floor(coords.x/2),
				y: Math.floor(coords.y/2),
				z: coords.z + 1
			};
			this.children = [];
		};
		self.neighborhood = new neighbors(self.coords);
		self.connections = new getConnections();
		self.connections.checkNeighbors();
		self.propagate = {
			sideways : function () {
				var i;
				var j;
				var neighborKeys = self.neighborhood.neighborKeys;
				var totalNeighbors = neighborKeys.length;
				var totalDimTypes = $config.dimensionTypes.length;
				var neighborCoords = {};
				var positionArray = [];
				// Deal with the peers:
				for(i=0; i < totalNeighbors; i++) {
					// for each neighbor address 
					if(self.neighborhood.neighbors[neighborKeys[i]] !== null) {
						neighborCoords[neighborKeys[i]] = {};
						for(j=0; j < totalDimTypes; j++) {
							neighborCoords[neighborKeys[i]][$config.dimensionTypes[j]] = self.neighborhood.neighbors[neighborKeys[i]][$config.dimensionTypes[j]];
						}
						if(cortex.grid[neighborCoords[neighborKeys[i]].x] === undefined) {
							cortex.grid[neighborCoords[neighborKeys[i]].x] = [];
						}
						if(cortex.grid[neighborCoords[neighborKeys[i]].x][neighborCoords[neighborKeys[i]].y] === undefined) {
							cortex.grid[neighborCoords[neighborKeys[i]].x][neighborCoords[neighborKeys[i]].y] = [];
						}
						if(cortex.grid[neighborCoords[neighborKeys[i]].x][neighborCoords[neighborKeys[i]].y][neighborCoords[neighborKeys[i]].z] === undefined) {
							cortex.grid[neighborCoords[neighborKeys[i]].x][neighborCoords[neighborKeys[i]].y][neighborCoords[neighborKeys[i]].z] = {};
							cortex.grid[neighborCoords[neighborKeys[i]].x][neighborCoords[neighborKeys[i]].y][neighborCoords[neighborKeys[i]].z] = new cortex.Column(neighborCoords[neighborKeys[i]]);
							if(self.helpers.isNodeThere(neighborCoords[neighborKeys[i]], true)) {
								cortex.grid[neighborCoords[neighborKeys[i]].x][neighborCoords[neighborKeys[i]].y][neighborCoords[neighborKeys[i]].z].propagate.sideways();
								cortex.grid[neighborCoords[neighborKeys[i]].x][neighborCoords[neighborKeys[i]].y][neighborCoords[neighborKeys[i]].z].propagate.up();
							} else {
								alert("Rare case. Node hadn't finished building before being called - 1");
								setTimeout(self.propagate.sideways,10);
							}
						}
					}
				}
			},
			// Deal with the parents
			up: function() {
				if(self.helpers.isNodeThere(self.neighborhood.parent) &&
				self.helpers.isNodeThere(self.neighborhood.parent, true)) {
					// If parent node is built out and ready, register this child with it.
					cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z].connections.registerChild(self.coords);
				} else if(self.helpers.isNodeThere(self.neighborhood.parent)) {
					// If the parent node is currently building, wait a moment, then try again.
					// self.propagate.up();
					alert("Rare case. Node hadn't finished building before being called - 0");
				} else {
					// If no column is started, get it started.
					cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z] = new cortex.Column(self.neighborhood.parent);
					self.propagate.up();
				}
			}
		};
		function getConnections() {
			var connections = this;
			var connectionCycle = {};
			var neighbors = self.neighborhood.neighbors;
			var neighborKeys = self.neighborhood.neighborKeys;
			var totalUnconfirmedNeighbors = neighborKeys.length;
			connections.checkNeighbors = function() {
				var g;
				for(g = 0; g < totalUnconfirmedNeighbors; g++) {
					(function(g) {
						var timeout = 50;
						var cycleCount = 0;
						function neighborCheckIntervol() {
							setTimeout(function() {
								if(self.helpers.isNodeThere(neighbors[neighborKeys[g]])) {
									self.neighborhood.neighbors[neighborKeys[g]].confirmed = true;
									if(checkinComplete()) {
										// TODO: Do we actually need this anymore?
									}
								} else {
									neighborCheckIntervol();
								}
								cycleCount++;
							},300);
						};
						neighborCheckIntervol();
						// connectionCycle[neighborKeys[g]] = ;
					}).call(this,g);
				}
				function checkinComplete() {
					totalUnconfirmedNeighbors--;
					if(totalUnconfirmedNeighbors === 0) {
						return true;
					}
					return false;
				}
			};
			connections.registerChild = function(childCoords) {
				var i;
				for(i=0;i<self.neighborhood.children.length;i++) {
					
				}
				if(self.helpers.isDup(childCoords,2)) {
					console.log("registering the same child twice. Child:",childCoords);
				};
				self.neighborhood.children.push(childCoords);
				if(self.neighborhood.children.length === 4){
					self.propagate.up();
				}
				// TODO: When to cut extraneous/incomplete parents?
			};
		};
		self.helpers = {
			isNodeThere : function(coords, isColumn) {
				if(isColumn && cortex.grid[coords.x] !== undefined && cortex.grid[coords.x][coords.y] !== undefined && cortex.grid[coords.x][coords.y][coords.z] instanceof cortex.Column) { 
					return true;
				} else if(cortex.grid[coords.x] !== undefined && cortex.grid[coords.x][coords.y] !== undefined && cortex.grid[coords.x][coords.y][coords.z] !== undefined) { 
					return true;
				}
				return false; 
			},
			stringifyCoords: function(coords) {
				var keys = Object.keys(coords);
				var coordsString = "";
				var i;
				for(i=0;i<keys.length;i++) {
					coordsString += coords[keys[i]] + "#";
				}
				return coordsString;
			},
			dupQuant: [],
			isDup: function(coords,checkId) {
				var coordsString = this.stringifyCoords(coords);
				if(checkId === undefined) {
					checkId = 10;
				}
				if(dupObj[checkId] === undefined) {
					dupObj[checkId] = {};
					dupObj[checkId].duplicates = 0;
					dupObj[checkId].dupList = [];
					dupObj[checkId].tested = {};
					
				}
				if(dupObj[checkId].tested[coordsString] === undefined) {
					dupObj[checkId].tested[coordsString] = true;
					return false;
				} else {
					dupObj[checkId].duplicates++;
					dupObj[checkId].dupList.push(coordsString);
					return true;
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

// Init:
window['Cortex'] = new Cortex();
window['Cortex'].grid[0] = []; 
window['Cortex'].grid[0][0] = [];
window['Cortex'].grid[0][0][0] = new window['Cortex'].Column({x:0,y:0,z:0});
window['Cortex'].grid[0][0][0].propagate.sideways();
window['Cortex'].grid[0][0][0].propagate.up();

setTimeout(function() {
	document.write(output);
	 console.log(window.Cortex.grid);
},3000);