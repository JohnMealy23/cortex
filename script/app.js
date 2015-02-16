// var $W = window;
// var $D = document;
// var dupObj = {};

var Cortex = function() {
	"use strict";
	var cortex = this;
	var $config = {};
	var $helpers = {};
	var $domBuilder = {};
	cortex.grid = [];
	$config.breakPoints = {
		high: 90,
		low: -1
	};
	$config.neighbors = {
			e: [1,0],			
			w: [-1,0],			
			n: [0,1],			
			s: [0,-1],			
			ne: [1,1],			
			nw: [-1,1],			
			se: [1,-1],			
			sw: [-1,-1]		
	};
	$config.dimensionTypes = ['x','y','z'];
	$config.timeout = {
		parent: {
			intervols: 20,
			delay: 30
		},
		neighbors: {
			intervols: 10,
			delay: 25
		}
	};
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
	$helpers.getNode = function(coords) {
		return cortex.grid[coords.x][coords.y][coords.z];
	};
	$helpers.dupQuant = [];
	$helpers.isDup = (function(coords,checkId) {
		var dupObj = {};
		return function(coords,checkId) {
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
	})();
	$helpers.stopOn = function(testCoords, selfCoords, context) {
		var thisCoords = $helpers.stringifyCoords(selfCoords,"#");
		if(thisCoords === testCoords) {
			alert("Stop!\n" + "Current node: " + thisCoords + "; Context: " + context);
			console.log("You are here: " + thisCoords, selfCoords, "; context: ", context);
		}
	};
	$domBuilder.addNode = function() {
		
	};
	cortex.Column = function($coords) {
		"use strict";
		var self = this;
		self.config = $config;
		self.helpers = $helpers;
		// Easy external access for node coords:
		self.coords = $coords;
		// Object to hold build mechanisms:
		self.builder = {};
		// Object for routing incoming data:
		self.router = {};		
		// Get surrounding nodes:	
		$helpers.isDup($coords);
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
			hood.neighborKeys = [];
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
							self.helpers.getNode(self.neighborhood.children[0]).builder.connections.trim();
							logIt();
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
							var timeout = self.config.timeout.neighbors.intervols;
							var cycleCount = 0;
							function neighborCheckIntervol() {
								setTimeout(function() {
									if(cycleCount === timeout) {
										// Timeout ran down. No neighbor found. Discontinue search.
										delete sibs[initNeighborKeys[i]];
										amITheHippocampus();
									} else if(!$helpers.isNodeThere(sibs[initNeighborKeys[i]])) {
										// If no node found yet, and time isn't up, check again:
										neighborCheckIntervol();
									} else {
										hood.neighborKeys.push(initNeighborKeys[i]);
									}
									cycleCount++;
								},self.config.timeout.neighbors.delay);
							};
							neighborCheckIntervol();
						}).call(self,i);
					};
				}
				return sibs;
			})();
			return hood;
		})(this.coords);
		self.builder.connections = (function() {
			var connections = {};
			connections.registerChild = function(childCoords) {
				self.neighborhood.children.push(childCoords);
				if(self.neighborhood.children.length === 4){
					self.builder.propagate.up();
				}
// TODO: When to cut extraneous/incomplete parents?
			};
			connections.selfDestruct = function(childQuant) {
				var i;
				childQuant = childQuant || self.neighborhood.children.length;
				if(self.coords.z !== 0) {
					for(i=0;i<childQuant;i++) {
						$helpers.getNode(self.neighborhood.children[i]).builder.connections.selfDestruct();
					}
				}
				delete cortex.grid[$coords.x][$coords.y][$coords.z];
				nodeCountRemoval($coords.z);
			};
			connections.trimmed = false;
			connections.trim = function() {
				var timeout = self.config.timeout.parent.intervols;
				var cycleCount = 0;
				var neighborKeys = self.neighborhood.neighborKeys;
				var	childQuant;
				var i;
				// Ensure trimming only inits once and :
				if(connections.trimmed === true || $coords.z === 0) {
					return;
				} 
				connections.trimmed = true;
				// Start your neighbors looking for extraneous nodes:
				for(i = 0; i < neighborKeys.length; i++) {
					self.helpers.getNode(self.neighborhood.neighbors[neighborKeys[i]]).builder.connections.trim();
				}
				// Start cycle to check for four children, and kill self and children, in otherwise: 
				function childCheckIntervol() {
					setTimeout(function() { 
						childQuant = self.neighborhood.children.length;
						var i;
						if(cycleCount === timeout) {
							// If time has run out to collect children:
							connections.selfDestruct(childQuant);
						} else if(childQuant !== 4) {
							// If no node found yet, and time isn't up, check again:
							cycleCount++;
							childCheckIntervol();
						} else {
							// If this node has four children, start each of them searching for extraneous nodes on their level:
							for(i = 0; i < childQuant; i++) {
								self.helpers.getNode(self.neighborhood.children[i]).builder.connections.trim();
							}
						}
						// This entails that if four children exist before timeout is hit, nothing will happen. 
					}, self.config.timeout.parent.delay); //$config.buildTimeouts.parent.delay);
				};
				childCheckIntervol();
			};
			return connections;
		})();
		self.builder.propagate = {
			sideways : function () {
				var i;
				var j;
				var neighborKeys = Object.keys(self.neighborhood.neighbors);
				var totalNeighbors = neighborKeys.length;
				var totalDimTypes = $config.dimensionTypes.length;
				var positionArray = [];
				var neighborCoords;
				var column;
				// Deal with the peers:
				for(i=0; i < totalNeighbors; i++) {
					// for each neighbor address 
						neighborCoords = self.neighborhood.neighbors[neighborKeys[i]];
						// column = buildNode(neighborCoords);
						if(cortex.grid[neighborCoords.x] === undefined) {
							cortex.grid[neighborCoords.x] = [];
						}
						if(cortex.grid[neighborCoords.x][neighborCoords.y] === undefined) {
							cortex.grid[neighborCoords.x][neighborCoords.y] = [];
						}
						if(cortex.grid[neighborCoords.x][neighborCoords.y][neighborCoords.z] === undefined) {
							cortex.grid[neighborCoords.x][neighborCoords.y][neighborCoords.z] = {};
							cortex.grid[neighborCoords.x][neighborCoords.y][neighborCoords.z] = new cortex.Column(neighborCoords);
							// if($helpers.isNodeThere(neighborCoords, true)) {
								column = self.helpers.getNode(neighborCoords);
								column.builder.propagate.sideways();
								column.builder.propagate.up();
							// } else {
								// alert("Rare case. Node hadn't finished building before being called - 1");
								// setTimeout(self.builder.propagate.sideways,10);
							// }
						}
				}
				
				// column = buildGridChain(
					// cortex.grid
					// ,neighborCoords
					// ,$config.dimensionTypes
					// ,0
				// );
				// function buildGridChain(matrixFrag,coords,coordKeys,coordTypeIndex) {
					// if(matrixFrag[coords[coordKeys[coordTypeIndex]]] === undefined) {
						// matrixFrag[coords[coordKeys[coordTypeIndex]]] = [];
						// matrixFrag = matrixFrag[coords[coordKeys[coordTypeIndex]]];
					// }
					// if(coordTypeIndex++ < coordKeys.length - 1) {
						// matrixFrag = buildGridChain(matrixFrag,coords,coordKeys,coordTypeIndex);
					// } else {
						// matrixFrag[coords[coordKeys[coordTypeIndex]]] = new cortex.Column(coords);
					// }
					// return matrixFrag;
				// }
				function buildNode(coords) {
					if(cortex.grid[coords.x] === undefined) {
							cortex.grid[coords.x] = [];
					}
					if(cortex.grid[coords.x][coords.y] === undefined) {
						cortex.grid[coords.x][coords.y] = [];
					}
					if(cortex.grid[coords.x][coords.y][coords.z] === undefined) {
						cortex.grid[coords.x][coords.y][coords.z] = {};
						cortex.grid[coords.x][coords.y][coords.z] = new cortex.Column(coords);
					}
					return cortex.grid[coords.x][coords.y][coords.z];
				}
			},
			// Deal with the parents
			up: function() {
				if($helpers.isNodeThere(self.neighborhood.parent) &&
				$helpers.isNodeThere(self.neighborhood.parent, true)) {
					// If parent node is built out and ready, register this child with it.
					cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z].builder.connections.registerChild(self.coords);
				} else if($helpers.isNodeThere(self.neighborhood.parent)) {
					// If the parent node is currently building, wait a moment, then try again.
					alert("Rare case. Node hadn't finished building before being called - 0");
					self.builder.propagate.up();
				} else {
					// If no column is started, get it started.
					cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z] = new cortex.Column(self.neighborhood.parent);
					cortex.grid[self.neighborhood.parent.x][self.neighborhood.parent.y][self.neighborhood.parent.z].builder.connections.registerChild(self.coords);
				}
			}
		};


		// Halfast logging:
		if(zTotals[$coords.z] === undefined) {
			zTotals[$coords.z] = 1;
		} else {
			zTotals[$coords.z]++;
		}
		outputString += $helpers.stringifyCoords($coords,"#") + "<br>";        	
		function nodeCountRemoval(z) {
			zTotals[z]--;
		}


		// Data processing mechanisms:		
		self.router.counter = 0;
		self.router.levels = [];
		self.router.Pattern = function(data, direction){
			this.direction = direction;
			this.matched = false;
			this.currentCoordinates = coordinates;
			this.data = data;
		};
        self.router.getNextIndex = (function() {
		   var id = 0;
		   return function() { return id++; };
		})();
		self.router.purgeColumn = function() {
			for(var i;i < data.totalLevels; i++) {
				self.router.level[i].purge();
			}
		};
		self.router.startRhythm = function() {
			
		};
		// Data entry level
		self.router.counter = self.router.getNextIndex();
		self.router.levels[self.router.counter] =	function(incoming) {
			startTimer();
			pattern = new Pattern(incoming, 1);
			this.purge = function() {
								
			};
			self.router.levels[self.router.counter + incoming.direction](incoming);
		};
			
		// Passes up the pattern
		self.router.counter = self.router.getNextIndex();
		self.router.levels[self.router.counter] =	function(incoming) {
			this.purge = function() {
								
			};
			self.router.levels[self.router.counter + incoming.direction](incoming);
		};
	
		// Tests if the incoming pattern matches a previous pattern
		self.router.counter = self.router.getNextIndex();
		self.router.levels[self.router.counter] =	function(incoming) {
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
		self.router.counter = self.router.getNextIndex();
		self.router.levels[self.router.counter] =	function(incoming) {
			self.router.levels[self.router.counter + incoming.direction](incoming);
		};
		self.router.counter = self.router.getNextIndex();
		self.router.levels[self.router.counter] =	function(incoming) {
			self.router.levels[self.router.counter + incoming.direction](incoming);
		};
		self.router.totalLevels = self.router.getNextIndex() - 1;
		
	};
	
};

var zTotals = {};
var outputString = "";
function logIt() {
	document.write(outputString);
	console.log(window.Cortex.grid);
	console.log("Totals by layer:");
	console.log(zTotals);
};

// Init:
window['Cortex'] = new Cortex();
window['Cortex'].grid[0] = []; 
window['Cortex'].grid[0][0] = [];
window['Cortex'].grid[0][0][0] = new window['Cortex'].Column({x:0,y:0,z:0});
window['Cortex'].grid[0][0][0].builder.propagate.sideways();
window['Cortex'].grid[0][0][0].builder.propagate.up();

