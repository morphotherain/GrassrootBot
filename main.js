var InitSource = function(roomName){
	Game.rooms[roomName].memory.source = Game.rooms[roomName].find(FIND_SOURCES);
}
var InitSourceSum = function(roomName){
	Game.rooms[roomName].memory.sourceSum = [0,0]
}

module.exports.loop  = function(){
	
  //-------------------------------------------------------------------------------------
	//房间布局
	//-------------------------------------------------------------------------------------

  var MainRooms = ["W7N4"]
  var RoomsDictionary = {"W7N4":["W8N4","W6N4","W7N3","W7N5"]}
	//-------------------------------------------------------------------------------------
	//初始化部分
	//-------------------------------------------------------------------------------------

	//状态
	//冷启动
	var cold_start = true;
	//紧急维护
	var repair_state = true;
	//日常维护
	var repair = true;
	//正常工作
	var OK = true;
	//建造模式
	var BuilderMode = false;
	//预定模式
	var claimMode = false;

  	console.log("------循环开始------------------------------------------------")



    //循环处理所有房间
  	for(const theRoomName of MainRooms){

	console.log(">>>当前房间："+theRoomName)
	//-------------------------------------------------------------------------------------
	//内存和建筑管理
	//-------------------------------------------------------------------------------------
	var Tower = Game.spawns[theRoomName].room.find(FIND_MY_STRUCTURES, {
		filter: { structureType: STRUCTURE_TOWER }
	}); 



	if(Tower != 0)
		TowerOperator(Tower[0],theRoomName);

	//清除已经死亡的creep内存
	MemoryManage()
  if(!Game.rooms[theRoomName].memory.source)
	  InitSource(theRoomName)
  if(Game.rooms[RoomsDictionary[theRoomName][0]] != undefined && !Game.rooms[RoomsDictionary[theRoomName][0]].memory.source )
	  InitSource(RoomsDictionary[theRoomName][0])
  if(!Game.rooms[theRoomName].memory.sourceSum)
    InitSourceSum(theRoomName)

	var container = Game.spawns[theRoomName].room.find(FIND_MY_STRUCTURES, {
		filter: { structureType: STRUCTURE_CONTAINER }
	}); 
	if(Game.rooms[theRoomName].memory.containerForSource == undefined )
	{
		var container = []
		container.push(Game.getObjectById(Game.rooms[theRoomName].memory.source[0].id).pos.findClosestByRange(FIND_STRUCTURES,{
			filter: { structureType: 'container' }}))
		container.push(Game.getObjectById(Game.rooms[theRoomName].memory.source[1].id).pos.findClosestByRange(FIND_STRUCTURES,{
			filter: { structureType: 'container' }}))
		Game.rooms[theRoomName].memory.containerForSource = container
	}if(Game.rooms[theRoomName].memory.containerForUpgrade == undefined )
	{
		var container = []
		container.push(Game.rooms[theRoomName].controller.pos.findClosestByRange(FIND_STRUCTURES,{
			filter: { structureType: 'container' }}))
		Game.rooms[theRoomName].memory.containerForUpgrade = container
	}
	console.log("container"+Game.rooms[theRoomName].memory.containerForSource)
	console.log("能量",Game.rooms[theRoomName].energyAvailable,"/",Game.rooms[theRoomName].energyCapacityAvailable);



	//-------------------------------------------------------------------------------------
	//creep自动孵化
	//-------------------------------------------------------------------------------------


  //每种creep的预定最大生产数量,按照优先等级排序。
  var ECA = Game.rooms[theRoomName].energyCapacityAvailable
  var EA = Game.rooms[theRoomName].energyAvailable

  

  var creepMax = {
    "creep_v1": (ECA<550 ) ?                       8 : 0 + 
				(EA < 550 && Object.keys(Game.creeps).length==0 && ECA > 300),
    "creep_v2": (ECA >= 550 && ECA <1300 && ( Game.rooms[theRoomName].memory.containerForSource<2 )) ?         12  : 0,
	"creep_outside_v2": (ECA >= 550 && ECA <1300) ? 4  : 0,
    "upgrader_v2":(ECA >= 550 && ECA <800 && ( Game.rooms[theRoomName].memory.containerForSource<2 ))?       2  : 0,
    "carrier_v2":(ECA >= 550 && ECA <800 && ( Game.rooms[theRoomName].memory.containerForSource<2 ))?       2 : 0,
    "builder_v2":(ECA >= 550 && ECA <800 && ( Game.rooms[theRoomName].memory.containerForSource<2 ))?       0  : 0,
    "harvester_v2_s0":(ECA >= 550 && ECA <800 && ( Game.rooms[theRoomName].memory.containerForSource<2 ))?     1  : 0,
    "harvester_v2_s1":(ECA >= 550 && ECA <800 && ( Game.rooms[theRoomName].memory.containerForSource<2 ))?     1  : 0,
    "harvester_v3_s0":(ECA >= 1300)?                1  : 0,
    "harvester_v3_s1":(ECA >= 1300)?                1  : 0,
  }
  console.log(Object.keys(Game.creeps).length)
  //每种creep的部件设计
  var creepBody = {
    "creep_v1":[MOVE,CARRY,MOVE,CARRY,WORK],
    "creep_v2":[MOVE,MOVE,MOVE,CARRY,CARRY,WORK,WORK,WORK],
	"creep_outside_v2":[MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,WORK,WORK],
    "upgrader_v2":[WORK,WORK,WORK,WORK,CARRY,MOVE],
    "carrier_v2":[MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],
    "builder_v2":[WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE],
    "harvester_v2_s0":[WORK,WORK,WORK,WORK,WORK,MOVE],
    "harvester_v2_s1":[WORK,WORK,WORK,WORK,WORK,MOVE],
    "harvester_v3_s0":[WORK,WORK,WORK,WORK,WORK,MOVE,CARRY],
    "harvester_v3_s1":[WORK,WORK,WORK,WORK,WORK,MOVE,CARRY],
  }
  
  //每种creep的已生产数量
  var creepnums = {
    "creep_v1":0,
    "creep_v2":0,
	"creep_outside_v2":0,
	"upgrader_v2":0,
	"carrier_v2":0,
	"builder_v2":0,
    "harvester_v2_s0":0,
    "harvester_v2_s1":0,
    "harvester_v3_s0":0,
    "harvester_v3_s1":0,
  }

  //统计每种creep的以生产数量
	for(var name in Game.creeps)
  {
    creepnums[Game.creeps[name].memory.type]++;
  }
  for(var name in creepnums)
  {
	if(creepMax[name]!=0)
	  console.log(name+ " "+creepnums[name]+"/"+creepMax[name])
  }

  var sourceN0 = 0;
  var sourceN1 = 0;
  for(var name in Game.creeps)
  {
    if(Game.creeps[name].memory.source == 0 && Game.creeps[name].memory.state == 'null')
      sourceN0++;
    if(Game.creeps[name].memory.source == 1 && Game.creeps[name].memory.state == 'null')
      sourceN1++;
	if(Game.creeps[name].memory.type != 'creep_outside_v2')
	  showEnergyHarvested(Game.creeps[name],theRoomName)
	  //Game.creeps[name].memory.energyHarvested = 0;
  }
  Game.rooms[theRoomName].memory.sourceSum[0]=sourceN0
  Game.rooms[theRoomName].memory.sourceSum[1]=sourceN1
  console.log(Game.rooms[theRoomName].memory.sourceSum)


  var spawnQueue = []
  //遍历每一种creep下达生产任务
  for(let creepType in creepMax)
  {
    if(creepnums[creepType]<creepMax[creepType])
      spawnQueue.push(creepType)
  }
  if(spawnQueue.length != 0 )
  Game.spawns[theRoomName].spawnCreep(creepBody[spawnQueue[0]],
    'creep#'+Game.time,{memory:{source:-1,type:spawnQueue[0],state:'full',energyHarvested:0}});
		
	
    //-------------------------------------------------------------------------------------
    //可视化
    //-------------------------------------------------------------------------------------



	
    //-------------------------------------------------------------------------------------
    //管理creep行动
    //-------------------------------------------------------------------------------------

	for(const i  in Game.creeps)
	{
		var creep = Game.creeps[i];
		switch(creep.memory.type){
		case "creep_v1":
		{
			harvest_build_upgrade(creep,theRoomName,Tower)
          break;
		}
		case "creep_v2":
		{
			harvest_build_upgrade(creep,theRoomName,Tower)
          break;
		}
		case "creep_outside_v2":
		{
			harvest_build_upgrade_outside(creep,theRoomName,RoomsDictionary,RoomPosition)
			
		  break;
		}
		case "upgrader_v2":
		{
			setCreepEnergyState(creep)
			var __container = Game.getObjectById(Game.rooms[theRoomName].memory.containerForUpgrade.id)
			if(creep.memory.state == 'null')
			{
				if(creep.withdraw(__container,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
					creep.moveTo(__container)
			}
			else
			{
				if(creep.upgrade(Game.rooms[theRoomName].controller)==ERR_NOT_IN_RANGE)
					creep.moveTo(__container)
			}
		  break;
		}
		case "carrier_v2":
		{
			var contianer0 = Game.getObjectById(Game.rooms[theRoomName].memory.containerForSource[0].id)
			var contianer1 = Game.getObjectById(Game.rooms[theRoomName].memory.containerForSource[1].id)
				
			if(creep.store.getFreeCapacity(RESOURCE_ENERGY)==0){
				creep.memory.state = 'full'
				creep.memory.energyHarvested += creep.store.getUsedCapacity(RESOURCE_ENERGY)
			};
			if(creep.store.getUsedCapacity(RESOURCE_ENERGY)==0){
				creep.memory.state = 'null';
				if(contianer0.getFreeCapacity()<contianer1.getFreeCapacity())
				{
					creep.memory.source = 0;
				}
				else
				{
					creep.memory.source = 1
				}
			}
			if(creep.memory.state == 'full')
			{
				if(StoreToSpawn(creep)==-1 )
				{
					if(( Tower.length == 0) || ( Tower[0].store.getFreeCapacity(RESOURCE_ENERGY)<200) ) {
						var __container = Game.getObjectById(Game.rooms[theRoomName].memory.containerForUpgrade.id)
						if(creep.transfer(__container,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE	)
							creep.moveTo(__container)
					}
					else
					{
						if(creep.transfer(Tower[0],RESOURCE_ENERGY)==ERR_NOT_IN_RANGE	)
							creep.moveTo(Tower[0])

					}
				}
				//upgrade_and_move(creep,roomName)
			}
			else
			{
				var _container = (creep.memory.source == 0)? contianer0:contianer1
				if(creep.withdraw(_container,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
					creep.moveTo(_container);
			}
			
		  break;
		}
		case "builder_v2":
		{
		  break;
		}
		case "harvester_v2_s0":
		{
			harvest_with_container(creep,theRoomName,0)
		  break;
		}
		case "harvester_v2_s1":
		{
			harvest_with_container(creep,theRoomName,1)
		  break;
		}
      case "harvester_v3_s0":
      {
		harvest_with_container(creep,theRoomName,0)
        break;
      } 
      case "harvester_v3_s1":
      {
		harvest_with_container(creep,theRoomName,1)
		break;
      } 
			default:{}
		}
		
	}
	}
}

var harvest_with_container = function(creep,theRoomName,index)
{
	var source = Game.getObjectById(Game.rooms[theRoomName].memory.source[index].id)
	var container = Game.getObjectById(Game.rooms[theRoomName].memory.containerForSource[index].id)
	if(creep.harvest(source)==ERR_NOT_IN_RANGE||creep.harvest(source)==ERR_NOT_ENOUGH_RESOURCES)
		creep.moveTo(container)
}


var harvest_build_upgrade = function(creep,roomName,Tower)
{
	setCreepEnergyStateEX(creep,roomName)
	if(creep.memory.state=='full')
	{
		if(StoreToSpawn(creep)==-1 )
		{
			if(( Tower.length == 0) || ( Tower[0].store.getFreeCapacity(RESOURCE_ENERGY)<200) ) {
				if(Game.rooms[roomName].controller.ticksToDowngrade < 1000)
					upgrade_and_move(creep,roomName)
				else{
					
						if(buildCloest(creep)==-1)
							upgrade_and_move(creep,roomName)
					
				}
			}
			else
			{
				if(creep.transfer(Tower[0],RESOURCE_ENERGY)==ERR_NOT_IN_RANGE	)
					creep.moveTo(Tower[0])

			}
		}
		//upgrade_and_move(creep,roomName)
	}
	else
	{
		var source = Game.getObjectById(Game.rooms[roomName].memory.source[(creep.memory.source==-1)?0:creep.memory.source].id)
		if(creep.harvest(source)==ERR_NOT_IN_RANGE||creep.harvest(source)==ERR_NOT_ENOUGH_RESOURCES)
			creep.moveTo(source)
	}
}

var harvest_build_upgrade_outside = function(creep,roomName,RoomsDictionary,roomPosition)
{
	setCreepEnergyState(creep)
	if(creep.memory.state=='full')
	{
		if(StoreToSpawn(creep)==-1 || creep.memory.source == 1)
			if(buildCloest(creep)==-1)
				upgrade_and_move(creep,roomName)
		//upgrade_and_move(creep,roomName)
	}
	else
	{
		var roomname = RoomsDictionary[roomName][0]
		if(Game.rooms[roomname]!=null){
			var source = Game.getObjectById(Game.rooms[roomname].memory.source[1].id)
			if(creep.harvest(source)==ERR_NOT_IN_RANGE||creep.harvest(source)==ERR_NOT_ENOUGH_RESOURCES)
				creep.moveTo(source)
		}
		else{
			//console.log(roomPosition[roomname])
			creep.moveTo(new RoomPosition( roomPosition[roomname][0][0], roomPosition[roomname][0][1], roomname))
		}
	}
}



var harvestOutside = function(container,source,creep)
{
	
	if(container!=undefined&&source!=undefined)
	{
		if(creep.memory.state == 'full')
		{
			if(container.hitsMax-container.hits>20000)
				creep.repair(container)
			else
				creep.transfer(container,RESOURCE_ENERGY);
		}
		else
		{
			if(creep.harvest(source)==ERR_NOT_IN_RANGE||creep.harvest(source)==ERR_NOT_ENOUGH_RESOURCES)
				creep.moveTo(container)
		}
	}
	else{
		console.log("visualLost!");
	}
}

var StoreToSpawn = function (creep) {
	var target = creep.pos.findClosestByRange(FIND_STRUCTURES,{
			filter:(structure)=>{
					return (structure.structureType == STRUCTURE_EXTENSION 
						|| structure.structureType == STRUCTURE_SPAWN)&&
						structure.store.getFreeCapacity(RESOURCE_ENERGY)>0
	}})
	if(target!=null)
	{
		if(creep.transfer(target,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
			{	creep.moveTo(target);
				creep.transfer(target,RESOURCE_ENERGY)
			}
	}
  else
    return -1;
	// body...
}

var StoreToRoomSpawn = function(creep,roomName) {
	var target = Game.rooms[roomName].find(FIND_STRUCTURES,{
			filter:(structure)=>{
					return (structure.structureType == STRUCTURE_EXTENSION 
						|| structure.structureType == STRUCTURE_SPAWN)&&
						structure.store.getFreeCapacity(RESOURCE_ENERGY)>0
	}})
	if(target!=null)
	{
		if(creep.transfer(target[0],RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
			{	creep.moveTo(target[0]);
				creep.transfer(target[0],RESOURCE_ENERGY)
			}
	}
	// body...
}

var TowerOperator = function(Tower,roomName)
{
	const Attack_target = Tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
	
	Tower.attack(Attack_target);

	const targets = Game.rooms[roomName].find(FIND_STRUCTURES, {
    		filter: object =>{return (object.hits < object.hitsMax)&&(object.structureType != STRUCTURE_WALL)}
		});

	targets.sort((a,b) => a.hits - b.hits);
	Tower.repair(targets[0]);
}

var MemoryManage = function()
{
	for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
           delete Memory.creeps[name];
        }
    }
}

var withdraw_From_Container_And_Storage = function(roomName,creep)
{
	var Containers = Game.rooms[roomName].find(FIND_STRUCTURES,{filter:(structure) => {
							return (structure.structureType == STRUCTURE_CONTAINER)&&
								(structure.store.getUsedCapacity(RESOURCE_ENERGY)>800);
	}});
	if((Containers!=null)&&Containers.length>0)
	{
		if(creep.withdraw(Containers[0],RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
			creep.moveTo(Containers[0]);
	}
		else
		{
			if(creep.withdraw(Game.rooms[roomName].storage,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
				creep.moveTo(Game.rooms[roomName].storage);
			
		}
}

var upgrade = function(creep,roomName)
{
	creep.upgradeController(Game.rooms[roomName].controller)
}

var upgrade_and_move = function(creep,roomName)
{
	if(creep.upgradeController(Game.rooms[roomName].controller)==ERR_NOT_IN_RANGE)
	{
		creep.moveTo(Game.rooms[roomName].controller)
		
	}
	creep.moveTo(Game.rooms[roomName].controller);
}

var withdraw_From_Storage = function(creep,roomName)
{
	if(creep.withdraw(Game.rooms[roomName].storage,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
		creep.moveTo(Game.rooms[roomName].storage);
}

var withdraw_From_Container_By_id = function(ContainerID,creep)
{
	if(Game.getObjectById(ContainerID)!=undefined&&creep!=undefined)
		if(creep.withdraw(Game.getObjectById(ContainerID),RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
			creep.moveTo(Game.getObjectById(ContainerID));
}

var StoreToStorage = function(creep,roomName)
{
	if(creep.transfer(Game.rooms[roomName].storage,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
		creep.moveTo(Game.rooms[roomName].storage);
}

/**
 * 
 * @param {*} creep 
 * 设定creep状态为满或者空
 */
var setCreepEnergyState = function(creep)
{
  if(creep.store.getFreeCapacity(RESOURCE_ENERGY)==0){creep.memory.state = 'full'
  creep.memory.energyHarvested += creep.store.getUsedCapacity(RESOURCE_ENERGY)
};
	if(creep.store.getUsedCapacity(RESOURCE_ENERGY)==0)creep.memory.state = 'null';
}

//切换creep_v1状态且自动分配能量矿
var setCreepEnergyStateEX = function(creep,roomName)
{
  var sourceSum =  Game.rooms[roomName].memory.sourceSum
  //console.log(sourceSum)
  //满了以后释放能量矿
  if(creep.store.getFreeCapacity(RESOURCE_ENERGY)==0 && (creep.memory.state == 'null')){
	creep.memory.energyHarvested += creep.store.getUsedCapacity(RESOURCE_ENERGY)
    creep.memory.state = 'full';
    Game.rooms[roomName].memory.sourceSum[creep.memory.source] -= 1
  }
  //空了以后预定能量矿
	if(creep.store.getUsedCapacity(RESOURCE_ENERGY)==0 && (creep.memory.state == 'full')){
    
    creep.memory.state = 'null';

	var max = (creep.memory.type == 'creep_v2')?8:4
    if(sourceSum[0]<max){
      creep.memory.source = 0
      Game.rooms[roomName].memory.sourceSum[0] += 1
    }
    else{
      creep.memory.source = 1
      Game.rooms[roomName].memory.sourceSum[1] += 1
    }
  }
}

var setCreepEnergyStateOutside = function(creep,roomName)
{
  var sourceSum =  Game.rooms[roomName].memory.sourceSum
  //console.log(sourceSum)
  //满了以后释放能量矿
  if(creep.store.getFreeCapacity(RESOURCE_ENERGY)==0 && (creep.memory.state == 'null')){

    creep.memory.state = 'full';
    Game.rooms[roomName].memory.sourceSum[creep.memory.source] -= 1
  }
  //空了以后预定能量矿
	if(creep.store.getUsedCapacity(RESOURCE_ENERGY)==0 && (creep.memory.state == 'full')){
    
    creep.memory.state = 'null';
	
	var max = (creep.memory.type == 'creep_v2')?4:9
    if(sourceSum[0]<max){
      creep.memory.source = 1
      Game.rooms[roomName].memory.sourceSum[0] += 1
    }
    else{
      creep.memory.source = 0
      Game.rooms[roomName].memory.sourceSum[1] += 1
    }
  }
}


var buildCloest = function(creep)
{
	const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
	if(target) {
		if(creep.memory.source == 0){
			
		//console.log("creep.build(target)"+creep.build(target)+target.pos)	
	}

		if(creep.build(target) == ERR_NOT_IN_RANGE) {
			creep.moveTo(target);
		}
	}
	else 
		return -1
}

var showEnergyHarvested = function(creep,roomName)
{
	
	Game.rooms[roomName].visual.text(creep.memory.energyHarvested,creep.pos, {color: '#FFFF00', fontSize: 0, opacity:0.3, fontVariant:'small-caps'})
}