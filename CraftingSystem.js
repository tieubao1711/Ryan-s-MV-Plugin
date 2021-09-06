//=============================================================================
// CRAFTING SYSTEM <<RELIFE ONLINE>> Version 1.3
//=============================================================================

/*:
* @plugindesc Hệ thống chế tạo (và nấu ăn).
* Release 06/02/2020
* @author tranxuanquang (Ryan)
* 
*
* @param Use Level
* @default true
*
* @param Crafting Level Variable
* @default 1
*
* @param Cooking Level Variable
* @default 2
*
* @param Crafting EXP Variable
* @default 3
*
* @param Cooking EXP Variable
* @default 4
*
* @param Crafting Title Text
* @default Chế Tạo
*
* @param Cooking Title Text
* @default Nấu Ăn
*
* @param Craft Ok Button Text
* @default Tạo
*
* @param Cooking Ok Button Text
* @default Nấu
*
* @param Cancel Button Text
* @default Thôi
* 
* @help 
* --------------------------------------------------------------------------------
* Terms of Use
* --------------------------------------------------------------------------------
* Credit tranxuanquang nếu bạn sử dụng trong dự án.
* --------------------------------------------------------------------------------
* Version 1.3 - Chỉnh sửa lần cuối 09/02/2020
* --------------------------------------------------------------------------------
*
* --------------------------------------------------------------------------------
* Trong "Item -> Notetag". Sử dụng các tag sau:
* --------------------------------------------------------------------------------
*
* <cooking:TEXT> hoặc <crafting:TEXT>
* <ingredients:ID,ID,...>
* <amounts:AMOUNT,AMOUNT,...>
* <gold:GOLD>
* <lvl:LEVEL>
* <gainEXP:EXP>
*
* TEXT - bạn có thể đặt bất cứ tên gì, nên đặt có hệ thống để dễ chia nhóm
* ID - ID của các item nguyên liệu
* AMOUNT - số lượng tương ứng của các item trên
* GOLD - số tiền cần để chế tạo/ nấu. nếu ko cần thì để 0
* LEVEL - Cấp độ Craft/Cook yêu cầu
* EXP - lượng EXP nhận được sau khi Craft/Cook
*
* --------------------------------------------------------------------------------
* Plugin Commands
* --------------------------------------------------------------------------------
* crsCall crafting/cooking TEXT TEXT1 TEXT2 ...
* TEXT - là các text bạn đặt trong item notetag, 
* nếu mục này để trống thì nó sẽ hiển thị tất cả
*
* Ví dụ: crsCall crafting normal (chỉ hiện thị các item craft "normal")
*        crsCall cooking    (hiển thị tất cả các item cooking)
*        crsCall crafting normal vip1 vip2  (hiển thị các item craft có TEXT "normal" "vip1" "vip2")
* --------------------------------------------------------------------------------
*/
(function() {
var parameters = PluginManager.parameters('CraftingSystem');
var craftTitleText = parameters['Crafting Title Text'] || "Chế Tạo";
var cookingTitleText = parameters['Cooking Title Text'] || "Nấu Ăn";
var btnCraftOkText = parameters['Craft Ok Button Text'] || "Tạo";
var btnCookOkText = parameters['Cooking Ok Button Text'] || "Nấu";
var btnCancelText = parameters['Cancel Button Text'] || "Thôi";
var useLevel = parameters['Use Level'] || "true";
var catIndex = 0;

var checkCat = /<\s*(.*)\s*:\s*(.*)\s*>/i;
var checkIgID = /<ingredients\s*:\s*(.*)>/i;
var checkAmount = /<amounts\s*:\s*(.*)>/i;
var checkLvl = /<lvl\s*:\s*(\d+)>/i;
var checkGold = /<gold\s*:\s*(.*)\s*>/i;
var Category = ['crafting','cooking'];
var titleMenu = "";
var btnOkText = "";

var craftLvlVar = Number(parameters['Crafting Level Variable'] || 1);
var cookLvlVar = Number(parameters['Cooking Level Variable'] || 2);
var craftEXPVar = Number(parameters['Crafting EXP Variable'] || 3);
var cookEXPVar = Number(parameters['Cooking EXP Variable'] || 4);
var craftLvl = 1;
var cookingLvl = 1;
var craftEXP = 0;
var cookEXP = 0;
var presentItems = [];
var isfull = false;
var crsLevel = 0;

// Game_Interpreter
var _Game_Crafting__pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Crafting__pluginCommand.call(this, command, args);
    if (command === 'crsCall') {
        switch(args[0])
        {
            case Category[0]:
                titleMenu = craftTitleText;
                btnOkText = btnCraftOkText;
                catIndex = 0;
                _x = 1;
                _arr = [];
                while (args[_x] != null) {
                    _arr.push(args[_x]);
                    _x++;
                }
                this.setCat(args[0],_arr);
                break;
            case Category[1]:
                titleMenu = cookingTitleText;
                btnOkText = btnCookOkText;
                catIndex = 1;
                _x = 1;
                _arr = [];
                while (args[_x] != null) {
                    _arr.push(args[_x]);
                    _x++;
                }
                this.setCat(args[0],_arr);
                break;
        }
        SceneManager.push(Scene_Crafting);
    }
};

Game_Interpreter.prototype.setCat = function(cat,arr) {
    if (presentItems != null)
        presentItems = [];
    for (var i=1;i<$dataItems.length;i++) {
        _cat = checkCat.exec($dataItems[i].note);
        if (_cat != null) {
            if (_cat[1]==cat) {
                if (arr.length > 0) {
                    for (var j=0;j<arr.length;j++) {
                        if (arr[j] == _cat[2]) {
                            presentItems.push(i);
                        }
                    }
                }
                else
                    presentItems.push(i);
            }
        }
    }
}

// ----- MAIN SCENE (SCENE COOKING) ----- //
function Scene_Crafting() {
    this.initialize.apply(this, arguments);
}

Scene_Crafting.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Crafting.prototype.constructor = Scene_Crafting;

Scene_Crafting.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_Crafting.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createCraftingListWindow();
    this.createCraftingTitleWindow();
    if (useLevel == "true") {
        this.createCraftingLevelWindow();
    }
    this.createInfoWindow();
    this.createConfirmWindow();
    this.createPopupWindow();
};

Scene_Crafting.prototype.createCraftingListWindow = function() {
    var x = Graphics.boxWidth*2/7;
    var y = Graphics.boxHeight*1/5;
    var w = Graphics.boxWidth*3/7;
    var h = Graphics.boxHeight*3/5;
    this._craftinglistWindow = new Window_CraftingList(x,y,w,h);
	this._craftinglistWindow.setHandler('ok',     this.onOk.bind(this));
    this._craftinglistWindow.setHandler('cancel', this.popScene.bind(this));
    this._craftinglistWindow.refresh();
    this.addWindow(this._craftinglistWindow);
    this._craftinglistWindow.select(0);
};

Scene_Crafting.prototype.createCraftingTitleWindow = function() {
    if (useLevel == "true") {
        var x = this._craftinglistWindow.x + (this._craftinglistWindow.width*1/8);
        var w = this._craftinglistWindow.width*1/2; 
    }
    else {
        var x = this._craftinglistWindow.x + (this._craftinglistWindow.width*1/4);
        var w = this._craftinglistWindow.width*1/2; 
    }
    var y = this._craftinglistWindow.y - 54;
    var h = 54;
    this._craftingtitleWindow = new Window_CraftingTitle(x,y,w,h);
    this.addWindow(this._craftingtitleWindow);
}
Scene_Crafting.prototype.createCraftingLevelWindow = function() {
    var x = this._craftingtitleWindow.x + (this._craftingtitleWindow.width);
    var y = this._craftinglistWindow.y - 54;
    var w = this._craftinglistWindow.width*1/4; 
    var h = 54;
    this._craftinglevelWindow = new Window_CraftingLevel(x,y,w,h);
    this.addWindow(this._craftinglevelWindow);
}

Scene_Crafting.prototype.createInfoWindow = function() {
    var x = this._craftinglistWindow.x-this._craftinglistWindow.x*1/5;
    var y = this._craftinglistWindow.y;
    var w = this._craftinglistWindow.width*5/4;
    var h = this._craftinglistWindow.height;
    this._infoWindow = new Window_Info(x,y,w,h);
    this.addWindow(this._infoWindow);
    this._infoWindow.hide();
}

Scene_Crafting.prototype.createConfirmWindow = function(){
    var x = this._craftinglistWindow.x;
    var y = this._infoWindow.y+this._infoWindow.height;
    this._confirmWindow = new Window_CraftConfirm(x,y);
    this._confirmWindow.setHandler('ok',this.openPopup.bind(this));
    this._confirmWindow.setHandler("cancel",this.proccessCancel.bind(this));
    this.addWindow(this._confirmWindow);
    this._confirmWindow.hide();
}

Scene_Crafting.prototype.createPopupWindow = function(){
    this._popupWindow = new Window_CookPopup();
    this._popupWindow.setHandler('ok',this.popupOk.bind(this));
    this._popupWindow.setHandler('cancel',this.popupOk.bind(this));
    this.addWindow(this._popupWindow);
}

Scene_Crafting.prototype.openPopup = function() {
    _igID = (checkIgID.exec($dataItems[presentItems[this._craftinglistWindow.index()]].note))[1].split(",");
    _amount = (checkAmount.exec($dataItems[presentItems[this._craftinglistWindow.index()]].note))[1].split(",");
    _tit = (catIndex>0)? cookingTitleText : craftTitleText;
    if (useLevel == "true") {
        _lvl = (catIndex>0)? cookingLvl : craftLvl;
        _expVar = (catIndex>0)? cookEXPVar : craftEXPVar;
        if (_lvl >= Number(checkLvl.exec($dataItems[presentItems[this._craftinglistWindow.index()]].note)[1])) {
            this.checkFull();
        }
        else {
            this._popupWindow.setTextFail("cấp độ "+_tit+" chưa đủ!");
            this._popupWindow.activate();
        }
    }
    else {
        this.checkFull();
    }
}

Scene_Crafting.prototype.checkFull = function() {
    if (isfull) {           
        if ($gameParty._gold >= Number(checkGold.exec($dataItems[presentItems[this._craftinglistWindow.index()]].note)[1])) { 
            for (var j=1; j <= Number(_igID.length);j++) {
                $gameParty.loseItem($dataItems[Number(_igID[j-1])],Number(_amount[j-1]));
            }
            $gameParty.gainItem($dataItems[presentItems[this._craftinglistWindow.index()]],1);
            $gameParty.loseGold(Number(checkGold.exec($dataItems[presentItems[this._craftinglistWindow.index()]].note)[1]));
            if (useLevel == "true") {
                _expGain = /<\s*gainEXP\s*:\s*(.*)\s*>/i.exec($dataItems[presentItems[this._craftinglistWindow.index()]].note);
                $gameVariables.setValue(_expVar,$gameVariables.value(_expVar)+Number(_expGain[1]));
                console.log(_expVar+" "+_expGain);
            }
            this._popupWindow.setText(presentItems[this._craftinglistWindow.index()]);
            this._popupWindow.activate();
        }
        else {
            this._popupWindow.setTextFail("không đủ vàng!");
            this._popupWindow.activate();
        }
    }
    else {
        this._popupWindow.setTextFail("không đủ nguyên liệu!");
        this._popupWindow.activate();
    }
}

Scene_Crafting.prototype.popupOk = function() {
    this._confirmWindow.deactivate();
    this._confirmWindow.hide();
    this._infoWindow.hide();
    this._popupWindow.deactivate();
    this._popupWindow.close();
    this._craftinglistWindow.activate();
    this._craftinglistWindow.select(0);
}

Scene_Crafting.prototype.onOk = function() {
    this._craftinglistWindow.deactivate();
    this._infoWindow.refresh();
    this._infoWindow.show();
    this._confirmWindow.activate();
    this._confirmWindow.select(0);
    this._confirmWindow.show();
    this._infoWindow.drawAllItems(presentItems[this._craftinglistWindow.index()]);
};

Scene_Crafting.prototype.proccessCancel = function() {
    this._confirmWindow.deactivate();
    this._confirmWindow.hide();
    this._infoWindow.hide();
    this._craftinglistWindow.activate();
    this._craftinglistWindow.refresh();
}


// ----- WINDOW TITLE ----- //

function Window_CraftingTitle() {
    this.initialize.apply(this,arguments);
}

Window_CraftingTitle.prototype = Object.create(Window_Base.prototype);
Window_CraftingTitle.prototype.constructor = Window_CraftingTitle;

Window_CraftingTitle.prototype.standardPadding = function() {
    return 6;
}

Window_CraftingTitle.prototype.initialize = function(x,y,w,h) {
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    this.drawAllItems();
}

Window_CraftingTitle.prototype.drawAllItems = function() {
    this.contents.fontSize = 28;
    this.contents.fontBold = true;
    this.drawText(titleMenu,0,4,this.width - this.padding * 2,"center");
}

// ----- WINDOW LEVEL ----- //

function Window_CraftingLevel() {
    this.initialize.apply(this,arguments);
}

Window_CraftingLevel.prototype = Object.create(Window_Base.prototype);
Window_CraftingLevel.prototype.constructor = Window_CraftingLevel;

Window_CraftingLevel.prototype.initialize = function(x,y,w,h) {
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    if (craftLvl != $gameVariables.value(craftLvlVar) || cookingLvl != $gameVariables.value(cookLvlVar)) {
        craftLvl = $gameVariables.value(craftLvlVar);
        cookingLvl = $gameVariables.value(cookLvlVar);
    }
}

Window_CraftingLevel.prototype.standardPadding = function() {
    return 6;
}

Window_CraftingLevel.prototype.update = function() {
    switch (catIndex) {
        case 0:
            if ($gameVariables.value(craftEXPVar) != craftEXP)
                craftEXP = $gameVariables.value(craftEXPVar);
            if ($gameVariables.value(craftLvlVar) != craftLvl) {
                craftLvl = $gameVariables.value(craftLvlVar);
                this.drawWindows = false;
            }
            break;
        case 1:
            if ($gameVariables.value(cookEXPVar) != cookEXP)
                cookEXP = $gameVariables.value(cookEXPVar);
            if ($gameVariables.value(cookLvlVar) != cookingLvl) {
                cookingLvl = $gameVariables.value(cookLvlVar);
                this.drawWindows = false;
            }
            break;
    }
    if (!this.drawWindows) {
        this.contents.clear();
        this.drawWindows = true;
        _arg = (catIndex>0) ? cookingLvl : craftLvl;
        this.drawAllItems(_arg);
    }
}

Window_CraftingLevel.prototype.drawAllItems = function(lvl) {
    this.contents.fontSize = 24;
    this.contents.fontBold = false;
    //this.drawGauge(8,-this.padding-2,this.width-this.padding*3,1,"#000000","#373957");
    //this.drawGauge(8,-this.padding-2,this.width-this.padding*3,0.6,"#00ff40","#1eff00");
    //this.drawIcon(iconMenu,this.width-this.padding-44,5);
    this.drawText("Lv."+lvl,0,4,this.width - this.padding * 2,"center");
}

// ----- WINDOW LIST ----- //

function Window_CraftingList() {
    this.initialize.apply(this, arguments);
}

Window_CraftingList.prototype = Object.create(Window_Selectable.prototype);
Window_CraftingList.prototype.constructor = Window_CraftingList;

Window_CraftingList.prototype.standardPadding = function() {
    return 18;
}

Window_CraftingList.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this.activate();
};

Window_CraftingList.prototype.maxItems = function() {
    return presentItems.length;
};

Window_CraftingList.prototype.maxVisibleItems = function() {
    return 8;
};

Window_CraftingList.prototype.itemHeight = function() {
    var innerHeight = this.height - this.padding * 2;
    return Math.floor(innerHeight / this.maxVisibleItems());
};
/*
Window_CraftingList.prototype.isEnable = function(index) {
    crsLevel = (catIndex>0) ? cookingLvl : craftLvl;
    if (crsLevel < Number(checkLvl.exec($dataItems[presentItems[index]].note)[1]))
        return false;
    else
        return true;
}
*/
Window_CraftingList.prototype.drawItem = function(index) {
    //this.changePaintOpacity(this.isEnable(index));
    var rect = this.itemRectForText(index);
    this.contents.fontSize = 22;
    this.contents.fontBold = false;
    this.drawIcon($dataItems[presentItems[index]].iconIndex,rect.x,rect.y+4);
    this.drawText($dataItems[presentItems[index]].name,rect.x+40,rect.y+4,this.width-this.padding,"left");
    this.contents.fontSize = 18;
    this.contents.fontBold = false;
    if (useLevel == "true") {
        _lvl = checkLvl.exec($dataItems[presentItems[index]].note);
        this.drawText("Lv."+_lvl[1],rect.x,rect.y+4,this.width-this.padding*3,"right");
    }
};

Window_CraftingList.prototype.refresh = function() {
    this.createContents();
    Window_Selectable.prototype.refresh.call(this);
}


// ----- POPUP (WINDOW INFO + WINDOW CONFIRM) ----- //

// INFO

function Window_Info() {
    this.initialize.apply(this,arguments);
}
Window_Info.prototype = Object.create(Window_Base.prototype);
Window_Info.prototype.constructor = Window_Info;

Window_Info.prototype.initialize = function(x,y,width,height) {
    Window_Base.prototype.initialize.call(this,x,y,width,height);
    this.drawAllItems();
}

Window_Info.prototype.drawAllItems = function(index) {
    this.refresh();
    if (index) {
        this.drawIcon($dataItems[index].iconIndex,8,8);
        this.contents.fontSize = 24;
        this.changeTextColor(this.normalColor());
        this.drawText($dataItems[index].name,48,8,this.width-this.padding,"left");
        this.contents.fontSize = 18;
        _lvl = checkLvl.exec($dataItems[index].note);
        if (useLevel == "true") {
            this.changeTextColor(this.normalColor());
            this.drawText("Lv: "+_lvl[1],-120,8,this.width-this.padding,"right");
        }
        this.changeTextColor("#0095ff");
        this.drawText(checkGold.exec($dataItems[index].note)[1],-35,8,this.width-this.padding,"right");
        this.changeTextColor("#ffee00");
        this.drawText($dataSystem.currencyUnit,-20,8,this.width-this.padding,"right");
        this.drawHorzLine(8,50,this.width-this.padding-16);
        this.contents.fontSize = 20;
        _string = $dataItems[index].description;
        _tempStr = "";
        _desc = [];
        _count = -1;
        if (this.textWidth(_string) > this.width - this.padding * 2) {
            for (var i=0; i < _string.split(" ").length; i++) {
                if (this.textWidth(_tempStr.concat(_string.split(" ")[i])) < this.width - this.padding * 3) {
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
            this.drawText(_desc[j],8,56+24*j);
        }
        this.drawHorzLine(8,56+22*5,this.width-this.padding-16);
        this.changeTextColor("#0095ff");
        this.drawText("Nguyên liệu:",8,168,this.width-this.padding*2,"left");
        _igID = (checkIgID.exec($dataItems[index].note))[1].split(",");
        _amount = (checkAmount.exec($dataItems[index].note))[1].split(",");
        _fulltemp = true;
        for (var i=1; i <= _igID.length; i++) {
            this.changeTextColor(this.normalColor());
            if (i%2!=0) {
                this.drawIcon($dataItems[Number(_igID[i-1])].iconIndex,12,168+38*Math.ceil(i/2));
                this.drawText($dataItems[Number(_igID[i-1])].name,12+36,168+38*Math.ceil(i/2));
                this.drawText("x"+_amount[i-1],(this.width-this.padding*2)/2-34,168+38*Math.ceil(i/2),30,"right");
            }
            else {
                this.drawIcon($dataItems[Number(_igID[i-1])].iconIndex,(this.width-this.padding*2)/2+12,168+38*(i/2));
                this.drawText($dataItems[Number(_igID[i-1])].name,(this.width-this.padding*2)/2+12+36,168+38*(i/2));
                this.drawText("x"+_amount[i-1],(this.width-this.padding*2)-34,168+38*(i/2),30,"right");
            }
            if ($gameParty.numItems($dataItems[Number(_igID[i-1])]) < _amount[i-1]) {
                _fulltemp = false;
            }
        }
        isfull = _fulltemp;  
    }
}

Window_Info.prototype.refresh = function() {
    this.createContents();
}

// CONFIRM

function Window_CraftConfirm() {
    this.initialize.apply(this,arguments);
}
Window_CraftConfirm.prototype = Object.create(Window_HorzCommand.prototype);
Window_CraftConfirm.prototype.constructor = Window_CraftConfirm;

Window_CraftConfirm.prototype.initialize = function(x,y) {
    Window_HorzCommand.prototype.initialize.call(this,x,y);
}	

Window_CraftConfirm.prototype.windowWidth = function() {
    return Graphics.boxWidth*3/7;
}

Window_CraftConfirm.prototype.maxCols = function() {
    return 2;
}
Window_CraftConfirm.prototype.standardPadding = function() {
    return 8;
}
Window_CraftConfirm.prototype.makeCommandList = function() {
    this.addCommand(btnOkText,'cook');
    this.addCommand(btnCancelText,"cancel");
}

// ----- POPUP ----- //
	
function Window_CookPopup() {
    this.initialize.apply(this, arguments);
}
Window_CookPopup.prototype = Object.create(Window_Selectable.prototype);
Window_CookPopup.prototype.constructor = Window_CookPopup;
Window_CookPopup.prototype.initialize = function() {
    Window_Selectable.prototype.initialize.call(this, Graphics.width/2-72,Graphics.height/2-this.windowHeight()/2,120,this.fittingHeight(1)); 
    this.openness = 0;
    this.deactivate();
}
Window_CookPopup.prototype.windowWidth = function() {return 120;} 
Window_CookPopup.prototype.windowHeight = function() {return this.fittingHeight(1);}
Window_CookPopup.prototype.setText = function(item) {
    this.contents.clear();
    //AudioManager.playSe({name:success,volume:successVol,pitch:100,pan:0})
    var text = "Bạn đã nấu thành công "+$dataItems[item].name+"!";
    var width = this.textWidth(text) + Window_Base._iconWidth;
    this.width = width + this.standardPadding() * 2;
    this.x = (Graphics.width-width)/2-16;
    this.createContents();
    this.contents.fontSize = 26;
    this.changeTextColor(this.normalColor());
    this.drawText(text,Window_Base._iconWidth+16,0,this.contents.width);
    this.drawIcon($dataItems[item].iconIndex,0,0);
    this.open();
}
Window_CookPopup.prototype.setTextFail = function(_txt) {
    this.contents.clear();
    //AudioManager.playSe({name:failure,volume:failureVol,pitch:100,pan:0})
    var text = "Thất bại, "+_txt;
    var width = this.textWidth(text) + Window_Base._iconWidth;
    this.width = width + this.padding * 2;
    this.x = (Graphics.width-width)/2;
    this.createContents();
    this.contents.fontSize = 26;
    this.changeTextColor(this.normalColor());
    this.drawText(text,Window_Base._iconWidth+16,0,this.contents.width);
    this.drawIcon(1,0,0);
    this.open();
}
Window_CookPopup.prototype.processOk = function() {
    if (this.isCurrentItemEnabled()) {
        this.updateInputData();
        this.deactivate();
        this.callOkHandler();
    } else {
        this.playBuzzerSound();
    }
}
Window_CookPopup.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    if (this.isOpen()) {
        if (TouchInput._x > 200 && TouchInput._x < Graphics.width-200) {
            if (TouchInput._y > 150 && TouchInput._y < Graphics.height-150) {
                if (TouchInput.isPressed())
                    this.processOk();
            }
        }
    }
};

// --- DRAW LINE ---

Window_Info.prototype.drawHorzLine = function(x, y, l) {
    this.contents.paintOpacity = 48;
    this.contents.fillRect(x, y, l, 2, this.normalColor());
    this.contents.paintOpacity = 255;
};
// --- END DRAW LINE ---
})();
