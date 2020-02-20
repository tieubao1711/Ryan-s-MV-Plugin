//=============================================================================
// RYAN INVENTORY ADVANCED - Version 1.4
//=============================================================================

/*:
* @plugindesc Hệ thống túi đồ và trang bị.
* Release 16/02/2020
* @author tranxuanquang (Ryan)
*
* @param Tool Variable
* @default 2
*
* @param Skin Variable
* @default 3
*
* @param Vehicle Variable
* @default 4
* 
* @help 
* --------------------------------------------------------------------------------
* Terms of Use
* --------------------------------------------------------------------------------
* Credit tranxuanquang nếu bạn sử dụng trong dự án.
* --------------------------------------------------------------------------------
* Chỉnh sửa lần cuối 20/02/2020
* --------------------------------------------------------------------------------
* Trong "Item -> Notetag". Sử dụng các tag sau:
* --------------------------------------------------------------------------------
*
* <invType : TYPE> 		#TYPE: tool/skin/vehicle
* <invHP : HP>			#HP: số lần sử dụng MAX của dụng cụ. Chỉ
							sử dụng tag này với TYPE là tool
* <invVar : VAR>		#VAR: biến số lưu trữ số lần sử dụng còn lại
							của dụng cụ. Chỉ sử dụng với TYPE là tool
* <invChar : IMG, INDEX> #IMG : tên ảnh trong img/characters
						 #INDEX : vị trí của nhân vật trong ảnh (từ 0-7)
						Chỉ sử dụng với TYPE là skin.
*
* --------------------------------------------------------------------------------
* PLUGIN COMMAND:
* --------------------------------------------------------------------------------
* Inventory open
* --------------------------------------------------------------------------------
* Inventory close
* --------------------------------------------------------------------------------
* SCRIPT CALL:
* $toolCat[0] - Kiểm tra đang trang bị loại dụng cụ gì
* $toolCat[1] - Kiểm tra variable của dụng cụ đang trang bị
* --------------------------------------------------------------------------------
*/
var $toolCat = [];

(function() {
var parameters = PluginManager.parameters('InventoryAdvanced');
var EquipSlot = ['Dụng cụ','Quần áo','Xe cộ'];
var EquipCmd = ['tool','skin','vehicle'];
var EquipVar = [Number(parameters['Tool Variable'] || 2),Number(parameters['Skin Variable'] || 3),Number(parameters['Vehicle Variable'] || 4)];

var checkInvType = /<invType\s*:\s*(\w+)-?(\d+)?>/i;
var checkInvHP = /<invHP\s*:\s*(\d+)>/i;
var checkInvVar = /<invVar\s*:\s*(\d+)>/i;
var checkInvChar = /<invChar\s*:\s*(.*),(.*)>/

_invadv_scene_map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _invadv_scene_map_update.call(this);
	if (!this.loadVar) {
		this.loadVar = true;
		if ($gameVariables.value(EquipVar[0])) {
			$toolCat[0] = $gameVariables.value(EquipVar[0]);
			$toolCat[1] = Number(checkInvVar.exec($dataItems[$toolCat[0]].note)[1]);
		}
	}
}

// Game_Interpreter
var _Game_InvAdv_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_InvAdv_pluginCommand.call(this, command, args);
    if (command === 'Inventory') {
		switch (args[0]) {
			case 'open':
				SceneManager.push(Scene_InventoryAdvanced);
				break;
			case 'close':
				SceneManager.pop();
				break;
		}
    }
};

// MAIN SCENE
function Scene_InventoryAdvanced() {
    this.initialize.apply(this, arguments);
}

Scene_InventoryAdvanced.prototype = Object.create(Scene_ItemBase.prototype);
Scene_InventoryAdvanced.prototype.constructor = Scene_InventoryAdvanced;

Scene_InventoryAdvanced.prototype.initialize = function() {
	Scene_ItemBase.prototype.initialize.call(this);
};

Scene_InventoryAdvanced.prototype.create = function() {
	Scene_ItemBase.prototype.create.call(this);
	this.createWindowInvAdvList();
	this.createWindowInvAdvEquip();
	this.createWindowInvAdvHelp();
	this.createWindowEquipCommand();
	this.createWindowInvAdvTitle();
};

Scene_InventoryAdvanced.prototype.createWindowInvAdvList = function(){
	var x = Graphics.boxWidth * 1/16;
	var y = (Graphics.boxHeight - 400) / 2 + 26;
	var w = Graphics.boxWidth * 3/8;
	var h = 400;
	this._itemList = new Window_InvAdvList(x,y,w,h);
	this._itemList.setHandler('ok', this.onOk.bind(this));
	this._itemList.setHandler('cancel', this.onCancel.bind(this));
	this._itemList.refresh();
	this.addWindow(this._itemList);
}

Scene_InventoryAdvanced.prototype.createWindowInvAdvEquip = function(){
	var x = this._itemList.x + this._itemList.width;
	var y = this._itemList.y+this._itemList.height;
	var w = Graphics.boxWidth * 1/2;
	this._itemEquip = new Window_InvAdvEquip(x,y,w);
	this._itemEquip.setHandler('ok',this.cmdClear.bind(this));
	this._itemEquip.setHandler('cancel', this.onCancel.bind(this));
	this._itemEquip.refresh();
	this.addWindow(this._itemEquip);
}

Scene_InventoryAdvanced.prototype.createWindowInvAdvHelp = function() {
	var x = this._itemEquip.x;
	var y = this._itemList.y;
	var w = this._itemEquip.width;
	this._itemDesc = new Window_InvAdvHelp(x,y,w);
	this.addWindow(this._itemDesc);
}

Scene_InventoryAdvanced.prototype.createWindowEquipCommand = function() {
	this._equipcmd = new Window_InvAdvEquipCmd();
    this._equipcmd.setHandler('equip',  this.cmdEquip.bind(this));
    this._equipcmd.setHandler('cancel', this.cmdCancel.bind(this));
	this.addWindow(this._equipcmd);
	this._equipcmd.hide();
}

Scene_InventoryAdvanced.prototype.createWindowInvAdvTitle = function() {
	var x = this._itemList.x;
	var y = this._itemList.y - 52;
	var w = this._itemList.width + this._itemEquip.width;
	var h = 52;
	this._itemTitle = new Window_InvAdvTitle(x,y,w,h);
	this.addWindow(this._itemTitle);
}

Scene_InventoryAdvanced.prototype.update = function(){
	Scene_ItemBase.prototype.update.call(this);

	if (this.lengthChange != $gameParty.allItems().length) {
		this.lengthChange = $gameParty.allItems().length;
		this.checkAll = $gameParty.allItems();
		for (var i=0; i<this.lengthChange;i++){
			if (checkInvType.exec(this.checkAll[i].note)) {
				if ($gameParty.numItems(this.checkAll[i]) > 1) {
					$gameParty.loseItem(this.checkAll[i],$gameParty.numItems(this.checkAll[i])-1);
				}
			}
		}
		this._itemList.refresh();
	}

	if (this._lTemp != this._itemList.index()) {
		this._lTemp = this._itemList.index();

		if(this._lTemp >= 0) {
			if (this._itemEquip.index() >= 0)
				this._itemEquip.deselect();

			if (this.itemTemp != this._itemList._data[this._lTemp]) {
				this.itemTemp = this._itemList._data[this._lTemp];
			}
			if (checkInvType.exec(this.itemTemp.note) && checkInvType.exec(this.itemTemp.note)[1] == EquipCmd[1]) {
				this.charImg = checkInvChar.exec(this.itemTemp.note)[1];
				this.charIndex = Number(checkInvChar.exec(this.itemTemp.note)[2]);	
			}
			else {
				this.charIndex = -1;
				this.charImg = null;
			}
			this._itemDesc.drawAllItems(this.itemTemp? this.itemTemp : null,this.charImg,this.charIndex);
		}
	}
	if (this._eTemp != this._itemEquip.index()) {
		this._eTemp = this._itemEquip.index();
		
		if(this._eTemp >= 0) {
			if (this._itemList.index() >= 0)
				this._itemList.deselect();

			if (this.itemTemp != $dataItems[$gameVariables.value(EquipVar[this._eTemp])]) {
				this.itemTemp = $dataItems[$gameVariables.value(EquipVar[this._eTemp])];
				if (!this.itemTemp)
					this._itemDesc.refresh();
			}
			if (this.itemTemp && checkInvType.exec(this.itemTemp.note) && checkInvType.exec(this.itemTemp.note)[1] == EquipCmd[1]) {
				this.charImg = checkInvChar.exec(this.itemTemp.note)[1];
				this.charIndex = Number(checkInvChar.exec(this.itemTemp.note)[2]);	
			}
			else {
				this.charIndex = -1;
				this.charImg = null;
			}
		}
		this._itemDesc.drawAllItems(this.itemTemp? this.itemTemp : null,this.charImg,this.charIndex);
	}
	if (!this._itemDesc.height) {
		this._itemDesc.height = this._itemList.height-this._itemEquip.height;
	}
}

Scene_InventoryAdvanced.prototype.onOk = function() {
	this.type = checkInvType.exec(this._itemList._data[this._itemList.index()].note);
	if (this.type && (this.type[1] == EquipCmd[0] || this.type[1] == EquipCmd[1] || this.type[1] == EquipCmd[2])) {
		for (var i=0; i < EquipSlot.length; i++) {
			if (this.type && this.type[1] == EquipCmd[i]) {
				if ($gameVariables.value(EquipVar[i]) > 0 && $dataItems[$gameVariables.value(EquipVar[i])]) {
					$gameParty.gainItem($dataItems[$gameVariables.value(EquipVar[i])],1);
				}			
				$gameVariables.setValue(EquipVar[i],this._itemList._data[this._itemList.index()].id);
				SaveVariable();
				if (this.type[1] == EquipCmd[0]) {
					$toolCat[0] = Number(this.type[2]);
					$toolCat[1] = Number(checkInvVar.exec(this._itemList._data[this._itemList.index()].note)[1]);
				}
				if (this.type[1] == EquipCmd[1]) {
					$gameActors.actor(1).setCharacterImage(this.charImg,this.charIndex);
					$gamePlayer.refresh();
				}
			}
		}
		this.EquipProcessor();
	}
	else {
		if (this._itemList._data[this._itemList.index()].consumable) {
			this.okProcessor('Sử dụng');
		}
		else {
			this._itemList.activate();
			this._itemEquip.activate();
		}
	}
}

Scene_InventoryAdvanced.prototype.okProcessor = function(nameCmd) {
	this._equipcmd.x = this._itemList.x + this._itemList.itemRect(this._itemList.index())['x'] + 40;
	this._equipcmd.y = this._itemList.y + this._itemList.itemRect(this._itemList.index())['y'] + 40;
	this._itemList.deactivate();
	this._itemEquip.deactivate();
	this._equipcmd.activate();
	this._equipcmd.select(0);
	this._equipcmd.show();
}

Scene_InventoryAdvanced.prototype.onCancel = function() {
	if (this._itemList.index() >= 0 || this._itemEquip.index() >= 0) {
		this._itemEquip.deselect();
		this._itemList.deselect();
		this._itemDesc.refresh();
		this._itemList.activate();
		this._itemEquip.activate();
	}
	else {
		SceneManager.pop();
	}
}

Scene_InventoryAdvanced.prototype.cmdEquip = function() {
	if (this._itemList._data[this._itemList.index()].effects && this._itemList._data[this._itemList.index()].effects[0])
		if (this._itemList._data[this._itemList.index()].effects[0]['code'] == 44) {
			$gameTemp.reserveCommonEvent(this._itemList._data[this._itemList.index()].effects[0]['dataId']); 
			SceneManager.pop();
		}
	this.EquipProcessor();
}

Scene_InventoryAdvanced.prototype.EquipProcessor = function() {
	$gameParty.loseItem(this._itemList._data[this._itemList.index()],1);
	this._itemList.deselect();
	this._itemEquip.refresh();
	this._itemList.refresh();
	this.cmdCancel();
}

Scene_InventoryAdvanced.prototype.cmdClear = function() {
	if (this._itemEquip.index() != 1) {
		if (!$gameParty.hasItem($dataItems[$gameVariables.value(EquipVar[this._itemEquip.index()])],false))
			$gameParty.gainItem($dataItems[$gameVariables.value(EquipVar[this._itemEquip.index()])],1);
		$gameVariables.setValue(EquipVar[this._itemEquip.index()],0);
		SaveVariable();
		$toolCat[0] = null;
		$toolCat[1] = null;
	}
		this._itemList.refresh();
		this._itemEquip.refresh();
		this._itemEquip.activate();
		this.onCancel();
}

Scene_InventoryAdvanced.prototype.cmdCancel = function() {
	this._equipcmd.deactivate();
	this._equipcmd.hide();
	this._itemList.activate();
	this._itemEquip.activate();
}


// ----- WINDOW TITLE ----- //

function Window_InvAdvTitle() {
    this.initialize.apply(this,arguments);
}

Window_InvAdvTitle.prototype = Object.create(Window_Base.prototype);
Window_InvAdvTitle.prototype.constructor = Window_InvAdvTitle;

Window_InvAdvTitle.prototype.standardPadding = function() {
    return 6;
}

Window_InvAdvTitle.prototype.initialize = function(x,y,w,h) {
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    this.drawAllItems();
}

Window_InvAdvTitle.prototype.drawAllItems = function() {
    this.contents.fontSize = 24;
    this.contents.fontBold = true;
    this.drawText("Thông tin vật phẩm và trang bị.",16,2,this.width - this.padding * 2,"left");
}

// WINDOW ITEM LIST

function Window_InvAdvList() {
    this.initialize.apply(this, arguments);
}

Window_InvAdvList.prototype = Object.create(Window_Selectable.prototype);
Window_InvAdvList.prototype.constructor = Window_InvAdvList;

Window_InvAdvList.prototype.initialize = function(x, y, width, height) {
	Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	this._data = [];
	this.activate();
};

Window_InvAdvList.prototype.maxItems = function() {
    return this._data ? this._data.length : 1;
};

Window_InvAdvList.prototype.maxCols = function() {
	return Math.round((this.width-this.padding*2)/(45+6));
}

Window_InvAdvList.prototype.maxVisibleItems = function() {
	return Math.round((this.height-this.padding*2)/(45+6));;
};

Window_InvAdvList.prototype.itemHeight = function() {
    return 45;
};

Window_InvAdvList.prototype.itemRect = function(index) {
	var rect = new Rectangle();
	rect.width = 45;
	rect.height = this.itemHeight();
	rect.x = index % this.maxCols() * (45 + 6) + 6;
	rect.y = Math.floor(index / this.maxCols()) * (this.itemHeight() + 6) + 6;
	return rect;
}
Window_InvAdvList.prototype.drawItem = function(index) {
	var item = this._data[index];
	if(item) {
		var rect = this.itemRect(index);
		rect.width -= 4;
		rect.x += 2;
		this.drawIcon(item.iconIndex, rect.x+5, rect.y+6 );
		this.makeFontSmaller();
		var number = $gameParty.numItems(item);
		if(Number(number) > 1) {
			this.drawText("x" + number, rect.x + 20, rect.y + 18, 24);
		}
		this.makeFontBigger();
	}
}

Window_InvAdvList.prototype.refresh = function() {
	this._data = $gameParty.allItems();
	Window_Selectable.prototype.refresh.call(this);
}

// ----- WINDOW HELP ----- //
function Window_InvAdvHelp() {
    this.initialize.apply(this,arguments);
}

Window_InvAdvHelp.prototype = Object.create(Window_Base.prototype);
Window_InvAdvHelp.prototype.constructor = Window_InvAdvHelp;

Window_InvAdvHelp.prototype.initialize = function(x,y,w) {
    Window_Base.prototype.initialize.call(this,x,y,w);
}

Window_InvAdvHelp.prototype.standardPadding = function() {
    return 18;
}

Window_InvAdvHelp.prototype.drawAllItems = function(item,img,index) {
	if (item) {
		this.refresh();

		this.changeTextColor(this.systemColor());
		this.drawIcon(item.iconIndex,0,1);
		this.drawText(item.name,45,0,this.width-this.padding*2,"left");
		this.contents.fontSize = 22;
		this.drawText("x" + ($gameParty.numItems(item)? $gameParty.numItems(item) : 1 ),0,0,this.width-this.padding*2,"right");
		this.drawHorzLine(0,42,this.width-this.padding*2);

		this.contents.fontSize = 20;
		_string = item.description;
		_tempStr = "";
		_desc = [];
		_count = -1;
		if (this.textWidth(_string) > this.width - this.padding * 2) {
			for (var i=0; i < _string.split(" ").length; i++) {
				if (this.textWidth(_tempStr.concat(_string.split(" ")[i])) < this.width - this.padding * 2) {
					_tempStr = _tempStr.concat(_string.split(" ")[i]," ");
				}
				else {
					_count++;
					_desc[_count] = _tempStr;
					_tempStr = _string.split(" ")[i]+" ";
				}

				if (i==_string.split(" ").length-1) {_desc[++_count] = _tempStr;}
			}
		}
		else {_desc[0] = _string;}

		for (var j=0; j<_desc.length; j++) {
			this.changeTextColor(this.normalColor());
			this.drawText(_desc[j],0,46+24*j);
		}
		if (img && (index>=0 && index<=6)) {
			this.drawCharacter(img,index,this.width-96,40);
		}
		if (checkInvType.exec(item.note) && checkInvType.exec(item.note)[1] == EquipCmd[0]) {
			this.maxHP = Number(checkInvHP.exec(item.note)[1]);
			this.hp = $gameVariables.value(Number(checkInvVar.exec(item.note)[1]));
			if (this.hp < 0) {
				this.hp = 0;
				$gameVariables.setValue(Number(checkInvVar.exec(item.note)[1]),0);
			}
			if (this.hp > this.maxHP) {
				this.hp = this.maxHP;
				$gameVariables.setValue(Number(checkInvVar.exec(item.note)[1]),this.maxHP);
			}
			this.percent = (this.hp/this.maxHP);
			if (this.percent == 0) {
				this.itemStatus = "Đã hỏng";
				this.colorStatus = "#fc4949";
			}
			else {
				if (this.percent <0.65) {
					this.itemStatus = "Trung bình";
					this.colorStatus = "#e8dc35";
				}
				else {
					this.itemStatus = "Tốt";
					this.colorStatus = "#35e83e";
				}
			}
			this.contents.fontSize = 18;
			this.changeTextColor(this.colorStatus);
			this.drawText(this.itemStatus,72+this.textWidth(item.name),2,this.width-this.padding*2,"left");
		}
	}
}

Window_InvAdvHelp.prototype.refresh = function() {
    this.createContents();
}

Window_InvAdvHelp.prototype.drawHorzLine = function(x, y, l) {
    this.contents.paintOpacity = 48;
    this.contents.fillRect(x, y, l, 2, this.normalColor());
    this.contents.paintOpacity = 255;
};

// ----- WINDOW EQUIP ----- //
function Window_InvAdvEquip() {
    this.initialize.apply(this,arguments);
}

Window_InvAdvEquip.prototype = Object.create(Window_Selectable.prototype);
Window_InvAdvEquip.prototype.constructor = Window_InvAdvEquip;

Window_InvAdvEquip.prototype.initialize = function(x,y,w) {
	Window_Selectable.prototype.initialize.call(this,x,y-this.windowHeight(),w,this.windowHeight());
	this.activate();
}

Window_InvAdvEquip.prototype.windowHeight = function() {
	return this.fittingHeight(this.maxItems());
}

Window_InvAdvEquip.prototype.maxItems = function() {
    return EquipSlot.length;
};

Window_InvAdvEquip.prototype.drawItem = function(index) {
    var rect = this.itemRectForText(index);
    this.contents.fontSize = 22;
	this.contents.fontBold = false;
	this.changeTextColor(this.systemColor());
	this.drawText(EquipSlot[index],rect.x,rect.y,this.width-this.padding*2,"left");
	this.changeTextColor(this.normalColor());
	this.item = $dataItems[$gameVariables.value(EquipVar[index])];
	if (EquipVar[index] && this.item) {
		this.drawIcon(this.item.iconIndex,rect.x+85,rect.y+2);
		this.drawText(this.item.name,rect.x+125,rect.y,this.width-this.padding*2,"left");
		if (index == 0) {
			this.maxHP = Number(checkInvHP.exec(this.item.note)[1]);
			this.hp = $gameVariables.value(Number(checkInvVar.exec(this.item.note)[1]));
			if (this.hp < 0) {
				this.hp = 0;
				$gameVariables.setValue(Number(checkInvVar.exec(this.item.note)[1]),0);
			}
			if (this.hp > this.maxHP) {
				this.hp = this.maxHP;
				$gameVariables.setValue(Number(checkInvVar.exec(this.item.note)[1]),this.maxHP);
			}
			this.percent = (this.hp/this.maxHP);
			this.drawGauge(rect.x+this.width-this.padding-130,rect.y-rect.height/2+2,100,this.percent,"#fcba03","#fcd703");
			this.drawGauge(rect.x+this.width-this.padding-130,rect.y-rect.height/2+8,100,this.percent,"#fcba03","#fcd703");
		}
	}
}

Window_InvAdvEquip.prototype.refresh = function() {
	Window_Selectable.prototype.refresh.call(this);
}


// Window_InvAdvEquipCmd

function Window_InvAdvEquipCmd() {
    this.initialize.apply(this, arguments);
}

Window_InvAdvEquipCmd.prototype = Object.create(Window_Command.prototype);
Window_InvAdvEquipCmd.prototype.constructor = Window_InvAdvEquipCmd;

Window_InvAdvEquipCmd.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, 0, 0);
	this.updatePlacement();
};

Window_InvAdvEquipCmd.prototype.updatePlacement = function() {
    this.x = 0;
    this.y = 0;
};

Window_InvAdvEquipCmd.prototype.makeCommandList = function() {
    this.addCommand('Sử dụng',   'equip');
    this.addCommand('Thôi',   'cancel');
};
})();
