//======================================================================
// ORDERED SYSTEM <<RELIFE ONLINE>> 02/04/2020 Version 0.2
//=======================================================================

/*:
@plugindesc Hệ thống NPC thu mua vật phẩm
@help 
// * Thêm tính năng random theo range
// * Lưu dữ liệu random bằng variable
// * Kiểm tra đã hoàn thành hay chưa bằng switch
Hướng dẫn:

- Chỉnh sửa danh sách thu mua vật phẩm ở dưới dòng thứ 170.

** Bản quyền thuộc về Relife Online.

@author tranxuanquang (Ryan)

@param Title Menu Text
@default Đơn hàng

@param Message Line 1
@default Tôi muốn đặt mua một số

@param Message Line 2
@default món hàng của bạn!

@param Requirement Text
@default Yêu cầu:

@param Reward Text
@default Hóa đơn:

@param Ok Button Text
@default Đồng ý

@param Cancel Button Text
@default Chờ chút
*/

var parameters = PluginManager.parameters('OrderedSystem');

var titTxt = parameters['Title Menu Text'] || "Đơn hàng";
var mes1Txt = parameters['Message Line 1'] || "Tôi muốn đặt mua một số";
var mes2Txt = parameters['Message Line 2'] || "món hàng của bạn!";
var rqTxt = parameters['Requirement Text'] || "Yêu cầu:";
var rwTxt = parameters['Reward Text'] || "Hóa đơn:";
var btnOK = parameters['Ok Button Text'] || "Đồng ý";
var btnCancel = parameters['Cancel Button Text'] || "Chờ chút";
 
var ordered = 0;
var itemsID = [];
var amount = [];
var price = 0;
var canBuy = false;
var congtac = 0;
var bienso = 0;
// Game_Interpreter
var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'ordered') {
        switch(args[0])
        {
            case 'open':
                if (args[1] != null) {
                    if (args[1] != "random") {
                        ordered = Number(args[1]);
                        congtac = Number(args[2]); 
                        bienso = 0; 
                    }
                    else {
                        congtac = Number(args[4]); 
                        bienso = Number(args[5]);   
                        if ($gameVariables.value(bienso) == 0) {
                            ordered = Math.floor(Math.random() * (Number(args[3]) - Number(args[2]) + 1)) + Number(args[2]);
                            $gameVariables.setValue(bienso,ordered);
                        }
                        else {
                            ordered = $gameVariables.value(bienso);
                        }
                    }
                SceneManager.push(Scene_Ordered);
                }
                break;
        }
    }
};

// ----- MAIN SCENE ----- //
function Scene_Ordered() {
    this.initialize.apply(this, arguments);
}

Scene_Ordered.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Ordered.prototype.constructor = Scene_Ordered;

Scene_Ordered.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_Ordered.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createOrderedWindow();
    this.createOrderedTitleWindow();
    this.createConfirmWindow();
};

Scene_Ordered.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    test = true;
    for (var i=0;i<itemsID.length;i++) {
        if ($gameParty.numItems($dataItems[itemsID[i]]) < amount[i]) {
            test = false;
        }
    }
    canBuy = test;
};

Scene_Ordered.prototype.createOrderedWindow = function() {
    var x = Graphics.boxWidth*2/7;
    var y = Graphics.boxHeight*1/5;
    var w = Graphics.boxWidth*3/7;
    var h = Graphics.boxHeight*3/5;
    this._orderedWindow = new Window_Ordered(x,y,w,h);
    this.addWindow(this._orderedWindow);
    this.update();
};

Scene_Ordered.prototype.createOrderedTitleWindow = function() {
    var x = this._orderedWindow.x + (this._orderedWindow.width*1/4);
    var y = this._orderedWindow.y - 54;
    var w = this._orderedWindow.width*1/2; 
    var h = 54;
    this._orderedtitleWindow = new Window_OrderedTitle(x,y,w,h);
    this.addWindow(this._orderedtitleWindow);
}

Scene_Ordered.prototype.createConfirmWindow = function() {
    var x = this._orderedWindow.x;
    var y = this._orderedWindow.y+this._orderedWindow.height;
    this._confirmWindow = new Window_Confirm(x,y);
    this._confirmWindow.setHandler('ok',this.dongY.bind(this));
    this._confirmWindow.setHandler('cancel',this.cancel.bind(this));
    this.addWindow(this._confirmWindow);
}

Scene_Ordered.prototype.dongY = function() {
    if (canBuy) {
        $gameParty._gold += price;
        itemsID.forEach(function(item,index,array) {
            $gameParty.loseItem($dataItems[item],amount[index]);
        });
        $gameMessage.setBackground(0);
        $gameMessage.add("Cảm ơn đã hợp tác!\\! Nhận được \\c[17]+"+price+" "+$dataSystem.currencyUnit+"\\i[314]");
        $gameSwitches.setValue(congtac,true);
        if (bienso!=0) {
            $gameVariables.setValue(bienso,0);
        }
            SceneManager.pop();
    }
    else {
        this._confirmWindow.activate();
    }
}

Scene_Ordered.prototype.cancel = function() {
    SceneManager.pop();
}

// ----- WINDOW TITLE ----- //

function Window_OrderedTitle() {
    this.initialize.apply(this,arguments);
}

Window_OrderedTitle.prototype = Object.create(Window_Base.prototype);
Window_OrderedTitle.prototype.constructor = Window_OrderedTitle;

Window_OrderedTitle.prototype.standardPadding = function() {
    return 6;
}

Window_OrderedTitle.prototype.initialize = function(x,y,w,h) {
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    this.drawAllItems();
}

Window_OrderedTitle.prototype.drawAllItems = function() {
    this.contents.fontSize = 28;
    this.contents.fontBold = true;
    this.changeTextColor(this.normalColor());
    this.drawText("Đơn Hàng",0,4,this.width - this.padding * 2,"center");
}

// ----- WINDOW ORDERED ----- //

function Window_Ordered() {
    this.initialize.apply(this,arguments);
}

Window_Ordered.prototype = Object.create(Window_Base.prototype);
Window_Ordered.prototype.constructor = Window_Ordered;

Window_Ordered.prototype.initialize = function(x,y,w,h) {
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    this.drawAllItems();
}

Window_Ordered.prototype.setupItems = function() {
    // EDIT AT HERE
    // itemsID là id các item yêu cầu, amount là số lượng của từng item và price là tổng giá cả bán được.
    switch(ordered) {
        case 1:
            itemsID = [9,10,11,12];
            amount = [2,3,1,4];
            price = 784;
            break;
        case 2:
            itemsID = [5,8];
            amount = [10,10];
            price = 300;
            break;
        case 3:
            itemsID = [5,8,7,9,10];
            amount = [10,10,2,3,5];
            price = 1568;
            break;
        case 4:
            itemsID = [7,9,10];
            amount = [2,3,5];
            price = 650;
            break;
        default:
            itemsID = [];
            amount = [];
            price = 0;
            break;
    }
}

Window_Ordered.prototype.drawAllItems = function() {
    this.contents.fontSize = 24;
    this.contents.fontBold = false;
    this.changeTextColor(this.normalColor());
    this.drawText("Tôi muốn đặt mua một số",6,4,this.width - this.padding * 2,"left");
    this.drawText("món hàng của bạn!",6,32,this.width - this.padding * 2,"left");
    this.drawHorzLine(0,72,this.width);
    this.contents.fontSize = 22;
    this.changeTextColor("#3392FF");
    this.drawText("Yêu cầu:",2,76,this.width - this.padding * 2,"left");
    this.setupItems();
    for (var i=0; i<itemsID.length;i++) {
        if ($gameParty.numItems($dataItems[itemsID[i]]) < amount[i]) {
            cbColor = "#ff0000";
            this.changePaintOpacity(false);
        }
        else {
            cbColor = "#00ff00";
            this.changePaintOpacity(true);
        }
        this.drawIcon($dataItems[itemsID[i]].iconIndex,16,114+36*i);
        this.changeTextColor(this.normalColor());
        this.drawText($dataItems[itemsID[i]].name,54,114+36*i,this.width - this.padding * 2,"left");
        this.changeTextColor(cbColor);
        this.drawText($gameParty.numItems($dataItems[itemsID[i]]),-this.padding-this.textWidth("/"+amount[i]),114+36*i,this.width - this.padding * 2,"right");
        this.changeTextColor(this.normalColor());
        this.drawText("/"+amount[i],-this.padding,114+36*i,this.width - this.padding * 2,"right");
    }
    this.drawHorzLine(0,this.height-78,this.width);
    this.changeTextColor("#3392FF");
    this.drawText("Hóa đơn: ",2,this.height-70,this.width - this.padding * 2,"left");
    this.changeTextColor("#f4ff2b");
    this.drawText(price+" ",-this.padding-this.textWidth($dataSystem.currencyUnit),this.height-70,this.width - this.padding * 2,"right");
    this.changeTextColor("#3392FF");
    this.drawText($dataSystem.currencyUnit,-this.padding,this.height-70,this.width - this.padding * 2,"right");
    //this.drawIcon(314,276,this.height-74);
}

Window_Ordered.prototype.drawHorzLine = function(x, y, l) {
    this.contents.paintOpacity = 48;
    this.contents.fillRect(x, y, l, 2, this.normalColor());
    this.contents.paintOpacity = 255;
};

// CONFIRM

function Window_Confirm() {
    this.initialize.apply(this,arguments);
}
Window_Confirm.prototype = Object.create(Window_HorzCommand.prototype);
Window_Confirm.prototype.constructor = Window_Confirm;

Window_Confirm.prototype.initialize = function(x,y) {
    Window_HorzCommand.prototype.initialize.call(this,x,y);
}	

Window_Confirm.prototype.windowWidth = function() {
    return Graphics.boxWidth*3/7;
}

Window_Confirm.prototype.maxCols = function() {
    return 2;
}
Window_Confirm.prototype.standardPadding = function() {
    return 8;
}
Window_Confirm.prototype.makeCommandList = function() {
    this.addCommand('Đồng ý','ok',canBuy);
    this.addCommand('Chờ chút',"cancel");
}
