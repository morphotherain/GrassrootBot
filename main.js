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






	//-------------------------------------------------------------------------------------
	//内存和建筑管理
	//-------------------------------------------------------------------------------------

	var Tower = 0
	if(Tower != 0)
		;//TowerOperator(Tower,roomE56S51);

	//清除已经死亡的creep内存
	MemoryManage()
  if(!Game.rooms[MainRooms[0]].memory.source)
	  InitSource(MainRooms[0])
  if(!Game.rooms[MainRooms[0]].memory.sourceSum)
    InitSourceSum(MainRooms[0])

	console.log("能量",Game.rooms[MainRooms[0]].energyAvailable,"/",Game.rooms[MainRooms[0]].energyCapacityAvailable);



	//-------------------------------------------------------------------------------------
	//creep自动孵化
	//-------------------------------------------------------------------------------------


  //每种creep的预定最大生产数量,按照优先等级排序。
  var ECA = Game.rooms[MainRooms[0]].energyCapacityAvailable
  var creepMax = {
    "creep_v1": (ECA<550 ) ? 12:0,
    "creep_v2": (ECA >= 550 && ECA <600) ? 8:0,
    "harvester_v3_s0":(ECA >= 600)?1:0,
    "harvester_v3_s1":(ECA >= 600)?1:0
  }

  //每种creep的部件设计
  var creepBody = {
    "creep_v1":[MOVE,CARRY,MOVE,CARRY,WORK],
    "creep_v2":[MOVE,MOVE,MOVE,CARRY,CARRY,WORK,WORK,WORK],
    "harvester_v3_s0":[WORK,WORK,WORK,WORK,WORK,MOVE,CARRY],
    "harvester_v3_s0":[WORK,WORK,WORK,WORK,WORK,MOVE,CARRY]
  }
  
  //每种creep的已生产数量
  var creepnums = {
    "creep_v1":0,
    "creep_v2":0,
    "harvester_v3_s0":0,
    "harvester_v3_s0":0
  }

  //统计每种creep的以生产数量
	for(var name in Game.creeps)
  {
    creepnums[Game.creeps[name].memory.type]++;
  }

  var sourceN0 = 0;
  var sourceN1 = 0;
  for(var name in Game.creeps)
  {
    if(Game.creeps[name].memory.source == 0 && Game.creeps[name].memory.state == 'null')
      sourceN0++;
    if(Game.creeps[name].memory.source == 1 && Game.creeps[name].memory.state == 'null')
      sourceN1++;
  }
  Game.rooms[MainRooms[0]].memory.sourceSum[0]=sourceN0
  Game.rooms[MainRooms[0]].memory.sourceSum[1]=sourceN1


  var spawnQueue = []
  //遍历每一种creep下达生产任务
  for(let creepType in creepMax)
  {
    if(creepnums[creepType]<creepMax[creepType])
      spawnQueue.push(creepType)
  }
  Game.spawns['Spawn1'].spawnCreep(creepBody[spawnQueue[0]],
    'creep#'+Game.time,{memory:{source:0,type:spawnQueue[0],state:'null'}});
		
	
	
    //-------------------------------------------------------------------------------------
    //管理creep行动
    //-------------------------------------------------------------------------------------

	for(const i  in Game.creeps)
	{
		var creep = Game.creeps[i];
		switch(creep.memory.type){
		case "creep_v1":
		{
			harvest_build_upgrade(creep,MainRooms[0])
          break;
		}
		case "creep_v2":
		{
			harvest_build_upgrade(creep,MainRooms[0])
          break;
		}
      case "harvester_v3_s0":
      {
        var source = Game.getObjectById(Game.rooms[MainRooms[0]].memory.source[0].id)
        if(creep.harvest(source)==ERR_NOT_IN_RANGE||creep.harvest(source)==ERR_NOT_ENOUGH_RESOURCES)
            creep.moveTo(source)
          
        break;
      } 
      case "harvester_v3_s1":
      {
        var source = Game.getObjectById(Game.rooms[MainRooms[0]].memory.source[1].id)
        if(creep.harvest(source)==ERR_NOT_IN_RANGE||creep.harvest(source)==ERR_NOT_ENOUGH_RESOURCES)
            creep.moveTo(source)
        break;
      } 
			default:{}
		}
		
	}

}
var harvest_build_upgrade = function(creep,roomName)
{
	setCreepEnergyStateEX(creep,roomName)
	if(creep.memory.state=='full')
	{
		
		if(StoreToSpawn(creep)==-1 || creep.memory.source == 1)
			if(buildCloest(creep)==-1)
				upgrade_and_move(creep,roomName)
		//upgrade_and_move(creep,roomName)
	}
	else
	{
		var source = Game.getObjectById(Game.rooms[roomName].memory.source[creep.memory.source].id)
		if(creep.harvest(source)==ERR_NOT_IN_RANGE||creep.harvest(source)==ERR_NOT_ENOUGH_RESOURCES)
			creep.moveTo(source)
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
		creep.moveTo(Game.rooms[roomName].controller);
	}
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
  if(creep.store.getFreeCapacity(RESOURCE_ENERGY)==0)creep.memory.state = 'full';
	if(creep.store.getUsedCapacity(RESOURCE_ENERGY)==0)creep.memory.state = 'null';
}


//切换creep_v1状态且自动分配能量矿
var setCreepEnergyStateEX = function(creep,roomName)
{
  var sourceSum =  Game.rooms[roomName].memory.sourceSum
  console.log(sourceSum)
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
      creep.memory.source = 0
      Game.rooms[roomName].memory.sourceSum[0] += 1
    }
    else{
      creep.memory.source = 1
      Game.rooms[roomName].memory.sourceSum[1] += 1
    }
  }
}



var buildCloest = function(creep)
{
	const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
	if(target) {
		if(creep.memory.source == 0){
			
		console.log("creep.build(target)")	
		console.log(creep.build(target))	
		console.log(target.pos)
	}

		if(creep.build(target) == ERR_NOT_IN_RANGE) {
			creep.moveTo(target);
		}
	}
	else 
		return -1
}
