var Init = function(roomName)
{
	Game.rooms[roomName].memory.source = Game.rooms[roomName].find(FIND_SOURCES);
}


module.exports.loop  = function(){
	
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

	var roomW47N27 = "W47N27"


	var Tower = Game.getObjectById('64525d54821b762a98b95b87')
	if(Tower != 0)
		;//TowerOperator(Tower,roomE56S51);

	//清除已经死亡的creep内存
	MemoryManage();
	
	for(var name in Game.creeps)
    {
    	var creep = Game.creeps[name];

		switch(creep.memory.type)
		{
			case 'allinoneOut':{AllInOne_out++;break;}
			
			
		}
	}	
	console.log("能量",Game.rooms[roomW47N27].energyAvailable,"/",Game.rooms[roomW47N27].energyCapacityAvailable);



	//-------------------------------------------------------------------------------------
	//creep自动孵化
	//-------------------------------------------------------------------------------------

	

	for(var i = 0;i<1;i++){
    if(5<4){
      Game.spawns['Spawn1'].spawnCreep([MOVE,CARRY,WORK],
        'creep#'+Game.time,{memory:{source:0,type:'roomW47N27_harvestS',state:'null'}});
        break;
    }
	}
		
	
	
    //-------------------------------------------------------------------------------------
    //管理creep行动
    //-------------------------------------------------------------------------------------

	for(const i  in Game.creeps)
	{
		var creep = Game.creeps[i];
		if(creep.store.getFreeCapacity(RESOURCE_ENERGY)==0)creep.memory.state = 'full';
		if(creep.store.getUsedCapacity(RESOURCE_ENERGY)==0)creep.memory.state = 'null';

		switch(creep.memory.type){
			case "roomW47N27_harvestS":
				{
					
				}
			default:{}
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
	if(Containers.length>0)
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

var upgrade = function(roomName,creep)
{
	creep.upgradeController(Game.rooms[roomName].controller)
}
var upgrade_and_move = function(roomName,creep)
{
	if(creep.upgradeController(Game.rooms[roomName].controller)==ERR_NOT_IN_RANGE)
	{
		creep.moveTo(Game.rooms[roomName].controller);
	}
}

var withdraw_From_Storage = function(roomName,creep)
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


var StoreToStorage = function(roomName,creep)
{
	if(creep.transfer(Game.rooms[roomName].storage,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE)
		creep.moveTo(Game.rooms[roomName].storage);
}