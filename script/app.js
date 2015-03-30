var Cortex = {};
var Router = function() {};
var Helpers = function() {};
var Column;
var Organ;
var Stimulous;
var Config = {};
var init;

/***********************************
 *  Config specs:   
 */

Config.initNode = {x:0,y:0,z:0,string:'x0y0z0'};
Config.breakPoints = {
	high: 70,
	low: -1
};
Config.neighbors = {
	n: [0,1],			
	ne: [1,1],
	e: [1,0],			
	se: [1,-1],			
	s: [0,-1],			
	sw: [-1,-1],		
	w: [-1,0],			
	nw: [-1,1]			
};
Config.dimensionTypes = ['x','y','z'];
Config.timeout = {
	parent: {
		intervols: 20,
		delay: 30
	},
	neighbors: {
		intervols: 10,
		delay: 25
	}
};



/***************************************/
/*           Helper Functions          */
/***************************************/

Helpers.prototype.isNodeThere = function(nodeKey, isColumn) {
	if(isColumn && Cortex[nodeKey] instanceof Column) { 
		return true;
	} else if(!isColumn && Cortex[nodeKey] !== undefined) { 
		return true;
	}
	return false; 
};
Helpers.prototype.stringifyCoords = function(coords) {
	var keys = Object.keys(coords);
	var coordsString = "";
	var i;
	for(i=0;i<keys.length;i++) {
		coordsString += keys[i] + coords[keys[i]];
	}
	return coordsString;
};
Helpers.prototype.getNode = function(nodeKey) {
	return Cortex[nodeKey];
};
Helpers.prototype.isDup = (function(coords,checkId) {
	var dupObj = {};
	return function(coords,checkId) {
		var coordsString = Helpers.stringifyCoords(coords);
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
Helpers.prototype.stopOn = function(testCoords, thisCoords, context) {
	if(thisCoords === testCoords) {
		alert("Stop!\n" + "Current node: " + thisCoords + "\nContext: " + context);
		console.log("Stopped on: " + thisCoords, "; context: ", context);
	}
};

/***************************************/
/*           Helper functions          */
/***************************************/

Column = function(config, coords, promise) {
	"use strict";
	var self = this;
	// Easy external access for node coords:
	self.coords = coords || config.initNode;
	self.config = config;
	self.helpers = new Helpers;
	// Object for routing incoming data:
	self.router = new Router;	
	self.neighborhood = (function(coords) {
		"use strict";
		var hood = {};
		hood.hippocampus = false;
		hood.parent = {
			x: Math.floor(self.coords.x/2),
			y: Math.floor(self.coords.y/2),
			z: self.coords.z + 1
		};
		hood.parent.string = self.helpers.stringifyCoords(hood.parent);
		hood.children = [];
		hood.neighborKeys = [];
		hood.neighbors = (function() {
			var sibs = {};
			var initNeighborKeys = Object.keys(self.config.neighbors);
			var x;
			var y;
			var i;
			var iLength;
			var amITheHippocampus = (function() {
				var countDown = initNeighborKeys.length;
				return function() { 
					countDown--;
					if(countDown === 0 && hood.children.length === 1) {
						// On the 8th time this function is called, if it only has one child,
						// we know it is the hippocampus (top of the pyramid).  This means the 
						// construction is completed, and the trimming process will need to begin:
						hood.hippocampus = true;
						Cortex[self.neighborhood.children[0].string].manageConnections.trim();
					}
				};
			})();
			for(i=0, iLength = initNeighborKeys.length; i < iLength; i++) {
				x = self.coords.x + self.config.neighbors[initNeighborKeys[i]][0];
				y = self.coords.y + self.config.neighbors[initNeighborKeys[i]][1];
				if(
					// If not the base layer, return a neighbor in every direction:
					self.coords.z !== 0 || (
					// If base layer, only return neighbors in directions within confines of config:
					x > self.config.breakPoints.low && 
					x < self.config.breakPoints.high &&
					y > self.config.breakPoints.low && 
					y < self.config.breakPoints.high
					)
				) {
					sibs[initNeighborKeys[i]] = {};
					sibs[initNeighborKeys[i]].x = x;
					sibs[initNeighborKeys[i]].y = y;
					sibs[initNeighborKeys[i]].z = self.coords.z;
					sibs[initNeighborKeys[i]].string = self.helpers.stringifyCoords(sibs[initNeighborKeys[i]]);
					(function(i) {
						var timeout = self.config.timeout.neighbors.intervols;
						var cycleCount = 0;
						function neighborCheckIntervol() {
							setTimeout(function() {
								if(cycleCount === timeout) {
									// Timeout ran down. No neighbor found. Discontinue search.
									delete sibs[initNeighborKeys[i]];
									amITheHippocampus();
								} else if(!self.helpers.isNodeThere(sibs[initNeighborKeys[i]].string)) {
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
	self.manageConnections = (function() {
		var connections = {};
		connections.registerChild = function(childCoords) {
			self.neighborhood.children.push(childCoords);
			if(self.neighborhood.children.length === 4){
				self.propagate.up();
			}
		};
		connections.selfDestruct = function(childQuant) {
			var i;
			childQuant = childQuant || self.neighborhood.children.length;
			if(self.coords.z !== 0) {
				for(i=0;i<childQuant;i++) {
					Cortex[self.neighborhood.children[i].string].manageConnections.selfDestruct();
				}
			}
			self.log.nodeCountRemoval(self.coords.z);
			delete Cortex[self.coords.string];
		};
		connections.trimmed = false;
		connections.trim = function() {
			var timeout = self.config.timeout.parent.intervols;
			var cycleCount = 0;
			var neighborKeys = self.neighborhood.neighborKeys;
			var	childQuant;
			var i;
			// Ensure trimming only inits once and :
			if(connections.trimmed === true || self.coords.z === 0) {
				return;
			} 
			connections.trimmed = true;
			// Start your neighbors looking for extraneous nodes:
			for(i = 0; i < neighborKeys.length; i++) {
				Cortex[self.neighborhood.neighbors[neighborKeys[i]].string].manageConnections.trim();
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
							Cortex[self.neighborhood.children[i].string].manageConnections.trim();
						}
					}
					// This entails that if four children exist before timeout is hit, nothing will happen. 
				}, self.config.timeout.parent.delay); //self.config.buildTimeouts.parent.delay);
			};
			childCheckIntervol();
		};
		return connections;
	})();
	self.propagate = {
		sideways : function () {
			var i;
			var neighborKeys = Object.keys(self.neighborhood.neighbors);
			var totalNeighbors = neighborKeys.length;
			var neighborCoords;
			// Deal with the peers:
			for(i=0; i < totalNeighbors; i++) {
				// for each neighbor address 
				neighborCoords = self.neighborhood.neighbors[neighborKeys[i]];
				if(!(Cortex[neighborCoords.string] instanceof Column)) {
					Cortex[neighborCoords.string] = new Column(self.config, neighborCoords, promise);
					Cortex[neighborCoords.string].propagate.sideways();
					Cortex[neighborCoords.string].propagate.up();
				}
			}
		},
		// Deal with the parents
		up: function() {
			if(Cortex[self.neighborhood.parent.string] instanceof Column) {
				// If parent node is built out and ready, register this child with it.
				Cortex[self.neighborhood.parent.string].manageConnections.registerChild(self.coords);
			} else {
				// If no column is started, get it started.
				Cortex[self.neighborhood.parent.string] = new Column(self.config, self.neighborhood.parent, promise);
				Cortex[self.neighborhood.parent.string].manageConnections.registerChild(self.coords);
			}
		}
	};
	self.log = (function() {
		// Halfast logging:
		var columnLog = {};
		if(zTotals[self.coords.z] === undefined) {
			zTotals[self.coords.z] = 1;
		} else {
			zTotals[self.coords.z]++;
		}
		outputString += self.coords.string + "<br>";        	
		columnLog.nodeCountRemoval = function(z) {
			zTotals[z]--;
		};
		return columnLog;
	})();
};


// Data processing mechanisms:		
Router.counter = 0;
Router.levels = [];
Router.Pattern = function(data, direction){
	this.direction = direction;
	this.matched = false;
	this.currentCoordinates = coordinates;
	this.data = data;
};
Router.getNextIndex = (function() {
   var id = 0;
   return function() { return id++; };
})();
Router.purgeColumn = function() {
	for(var i;i < data.totalLevels; i++) {
		Router.level[i].purge();
	}
};
Router.startRhythm = function() {
	
};
// Data entry level
Router.counter = Router.getNextIndex();
Router.levels[Router.counter] =	function(incoming) {
	startTimer();
	pattern = new Pattern(incoming, 1);
	this.purge = function() {
						
	};
	Router.levels[Router.counter + incoming.direction](incoming);
};
	
// Passes up the pattern
Router.counter = Router.getNextIndex();
Router.levels[Router.counter] =	function(incoming) {
	this.purge = function() {
						
	};
	Router.levels[Router.counter + incoming.direction](incoming);
};

// Tests if the incoming pattern matches a previous pattern
Router.counter = Router.getNextIndex();
Router.levels[Router.counter] =	function(incoming) {
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
				// Cortex[self.childAddress[i].x][self.childAddress[i].y][self.childAddress[i].z](fromBelow);
			} else {
				alert("Pattern not recognized");
				// Cortex[self.parentAddress.x][self.parentAddress.y][self.parentAddress.z](fromBelow);
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
Router.counter = Router.getNextIndex();
Router.levels[Router.counter] =	function(incoming) {
	Router.levels[Router.counter + incoming.direction](incoming);
};
Router.counter = Router.getNextIndex();
Router.levels[Router.counter] =	function(incoming) {
	Router.levels[Router.counter + incoming.direction](incoming);
};
Router.totalLevels = Router.getNextIndex() - 1;
		

/***********************************
 *   
 */

var zTotals = {};
var outputString = "";
function logIt() {
	document.write(outputString);
	console.log(window.Cortex);
	console.log("Totals by layer:");
	console.log(zTotals);
};

Organ = function() {
	self = this;
	self.grid = {};
	self.init = (function() {
		var init = {};
		var cortexKeys = (function() {
			return Object.keys(window.Cortex);
		})();
		init.gridSpecs = (function() {
			var dimTypes = Config.dimensionTypes;
			var gridSpecs = {};
			var nodeSplit = [];
			var curNodeArray = {};
			var curDim;
			var i = 0;
			var j;
			for(j=0;j<dimTypes.length;j++) {
				curNodeArray[dimTypes[j]] = [];
			}
			function auditBase() {
				var curNode = cortexKeys[i];
				for(j=0;j<dimTypes.length;j++) {
					nodeSplit = curNode.split(dimTypes[j]);
					curDim = nodeSplit[0];
					curNode = nodeSplit[1];
					if(curDim) {
						curNodeArray[dimTypes[j-1]].push(curDim);
					}
				}
				if(curNodeArray[dimTypes[j-1]] === 0) {
					auditBase();
				} else {
					// Back out the last additions
					curNodeArray
				}
				i++;
			} 
			auditBase();
		})();
		init.gridHeight = (function() {
			
		})();
		
				
		return true;
	})();
	self.incoming = function() {
		
		return;
	};
	self.dispersal = function() {
		
		return;
	};
};

Stimulous = function() {
	
};

Promise.UNFILLED = 0;
Promise.RESOLVED = 1;
Promise.REJECTED = 2;
function Promise(context){
	this._resolved= [];
	this._rejected= [];
	this._state = Promise.UNFILLED;
	this._context= context || this;
	this._value = null;
	this._error = null;
}
Promise.prototype = { 
	'then': function (resolved, rejected, context) {
		context = context == null ? this : context;
		resolved= resolved || new Function;
		rejected= rejected || new Function;
		this._resolved.push([resolved,context]);
		this._rejected.push([rejected,context]);
		if(this._state === Promise.RESOLVED) 
			this.resolved(this._value); 
		else if(this._state === Promise.REJECTED) 
			this.rejected(this._error); 
		return this;
	}
	,'resolved': function(value){
		var a;
		while(a = this._resolved.shift())
			try {
				// fix for injected ads
				if (typeof a[0] !== 'object'){
					a[0].call(a[1],value);
				} else {
					continue;
				}
			} catch(err) {
				window.console.log('error: ' + err);
			}
		this._state = Promise.RESOLVED;
		this._value = value;
		return this;
	}
	,'rejected': function(error){
		var a;
		while((a = this._rejected.shift()))
			a[0].call(a[1],error);	

		this._state = Promise.REJECTED;
		this._error = error; 
		return this;
	}
	,'join': function(promises){
		var $self = this
		   ,$total = promises.length 
		   ,$values = [] 
		   ,$errors = [] 
		;
		for(var i =0, l= promises.length; i < l; i++) {
			promises[i].then(onResolved, onRejected, i);
		}
		return this;

		function onResolved(value){
			$values[this]= value;
			checkTotal(--$total);
		}
		function onRejected(error){
			$errors[this]= error;	
			checkTotal(--$total);
		}
		function checkTotal(){
			if($total) {
				return;
			}
			if($values.length) {
				$self.resolved($values);
			}
			if($errors.length) {
				$self.rejected($errors);
			}
		}
	}
};

init = (function() {
	this.cortexInit = function() {
		var promise = new Promise;
		// Set up cortex:	
		Cortex[Config.initNode.string] = new Column(Config, null, promise);
		Cortex[Config.initNode.string].propagate.sideways();
		Cortex[Config.initNode.string].propagate.up();
		return promise;
	};
	this.organInit = function() {
		var promise = new Promise;
		
		window['Organ'] = new Organ;
		
		return promise;
	};
	this.stimulousInit = function() {
		var promise = new Promise;
		
		window['Stimulous'] = new Stimulous;
		
		return promise;
	};
	
	// this.cortexInit().then(this.organInit).then(this.stimulousInit);
	this.cortexInit().then(logIt);
	window['Cortex'] = Cortex;
})();