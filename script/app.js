var dupObj = {};
var output = "";
var $config = {
	breakPoints: {
		high: 24,
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
	
	var $helpers = {};
	$helpers.isNodeThere = function(coords, isColumn) {
		if(isColumn && cortex.grid[coords.x] !== undefined && cortex.grid[coords.x][coords.y] !== undefined && cortex.grid[coords.x][coords.y][coords.z] instanceof cortex.Column) { 
			return true;
		} else if(cortex.grid[coords.x] !== undefined && cortex.grid[coords.x][coords.y] !== undefined && cortex.grid[coords.x][coords.y][coords.z] !== undefined) { 
			return true;
		}
		return false; 
	};
	$helpers.stringifyCoords = function(coords,delineator) {
		var keys = Object.keys(coords);
		var coordsString = "";
		var i;
		delineator = delineator || '';
		for(i=0;i<keys.length;i++) {
			coordsString += coords[keys[i]] + delineator;
		}
		return coordsString;
	};
	$helpers.dupQuant = [];
	$helpers.isDup = function(coords,checkId) {
		var coordsString = $helpers.stringifyCoords(coords,"#");
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
	};
	$helpers.stopOn = function(testCoords, selfCoords, context) {
		var thisCoords = $helpers.stringifyCoords(selfCoords,"#");
		if(thisCoords === testCoords) {
			alert("Stop!\n" + "Current node: " + thisCoords + "; Context: " + context);
			console.log("You are here: " + thisCoords, selfCoords, "; context: ", context);
		}
	};
	
	cortex.Column = function($coords) {
		"use strict";
		var self = this;
		var data = {};		
		
		self.helpers = $helpers;
		// Easy external access for node coords:
		self.coords = $coords;
		
		// Get surrounding nodes:	
		self.neighborhood = (function(coords) {
			"use strict";
			var hood = {};
			hood.hippocampus = false;
			hood.parent = {
				x: Math.floor(coords.x/2),
				y: Math.floor(coords.y/2),
				z: coords.z + 1
			};
			hood.children = [];
			hood.neighbors = (function() {
				var sibs = {};
				var initNeighborKeys = Object.keys($config.neighbors);
				var x;
				var y;
				var i;
				var iLength;
				var amITheHippocampus = (function() {
					var countDown = initNeighborKeys.length;
					return function() { 
						--countDown;
						if(countDown === 0 && hood.children.length === 1) {
							hood.hippocampus = true;
						}
					};
				})();
				for(i=0, iLength = initNeighborKeys.length; i < iLength; i++) {
					x = coords.x + $config.neighbors[initNeighborKeys[i]][0];
					y = coords.y + $config.neighbors[initNeighborKeys[i]][1];
					if(
						// If not the base layer, return a neighbor in every direction:
						coords.z !== 0 || (
						// If base layer, only return neighbors in directions within confines of config:
						x > $config.breakPoints.low && 
						x < $config.breakPoints.high &&
						y > $config.breakPoints.low && 
						y < $config.breakPoints.high
						)) 
					{
						sibs[initNeighborKeys[i]] = {};
						sibs[initNeighborKeys[i]].x = x;
						sibs[initNeighborKeys[i]].y = y;
						sibs[initNeighborKeys[i]].z = coords.z;
						(function(i) {
							var timeout = 50;
							var cycleCount = 0;
							function neighborCheckIntervol() {
								setTimeout(function() {
									if(cycleCount === timeout) {
										// Timeout ran down. No neighbor found. Discontinue search.
										delete sibs[initNeighborKeys[i]];
										amITheHippocampus();
									} else if(!self.helpers.isNodeThere(sibs[initNeighborKeys[i]])) {
										// If no node found yet, and time isn't up, check again:
										neighborCheckIntervol();
									}
									cycleCount++;
								},30);
							};
							neighborCheckIntervol();
						}).call(self,i);
					};
				}
				return sibs;
			})();
			return hood;
		})(this.coords);
		self.connections = (function() {
			var connections = {};
			connections.registerChild = function(childCoords) {
				self.neighborhood.children.push(childCoords);
				if(self.neighborhood.children.length === 4){
					self.propagate.up();
				}
// TODO: When to cut extraneous/incomplete parents?
			};
			return connections;
		})();
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
					cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z].connections.registerChild(self.coords);
					// self.propagate.up();
				}
			}
		};




		
		data.counter = 0;
		data.levels = [];
		data.Pattern = function(data, direction){
			this.direction = direction;
			this.matched = false;
			this.currentCoordinates = coordinates;
			this.data = data;
		};
        data.getNextIndex = (function() {
		   var id = 0;
		   return function() { return id++; };
		})();
		data.purgeColumn = function() {
			for(var i;i < data.totalLevels; i++) {
				data.level[i].purge();
			}
		};
		data.startRhythm = function() {
			
		};
		// Data entry level
		data.counter = data.getNextIndex();
		data.levels[data.counter] =	function(incoming) {
			startTimer();
			pattern = new Pattern(incoming, 1);
			this.purge = function() {
								
			};
			data.levels[data.counter + incoming.direction](incoming);
		};
			
		// // Passes up the pattern
		// data.counter = data.getNextIndex();
		// data.levels[data.counter] =	function(incoming) {
			// this.purge = function() {
			// };
			// data.levels[data.counter + incoming.direction](incoming);
		// };
	
		// Passes up the pattern
		data.counter = data.getNextIndex();
		data.levels[data.counter] =	function(incoming) {
			this.purge = function() {
								
			};
			data.levels[data.counter + incoming.direction](incoming);
		};
	
		// Tests if the incoming pattern matches a previous pattern
		data.counter = data.getNextIndex();
		data.levels[data.counter] =	function(incoming) {
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
						// window['Cortex'].grid[self.childAddress[i].x][self.childAddress[i].y][self.childAddress[i].z](fromBelow);
					} else {
						alert("Pattern not recognized");
						// window['Cortex'].grid[self.parentAddress.x][self.parentAddress.y][self.parentAddress.z](fromBelow);
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
		data.counter = data.getNextIndex();
		data.levels[data.counter] =	function(incoming) {
			data.levels[data.counter + incoming.direction](incoming);
		};
		data.counter = data.getNextIndex();
		data.levels[data.counter] =	function(incoming) {
			data.levels[data.counter + incoming.direction](incoming);
		};
		data.totalLevels = data.getNextIndex() - 1;
		
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