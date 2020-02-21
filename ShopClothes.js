//=============================================================================
// SHOP CLOTHES <<RELIFE ONLINE>> Version 1.0
//=============================================================================

/*:
* @plugindesc Cửa hàng thời trang.
* Release 21/02/2020
* @author tranxuanquang (Ryan)
* 
* @help 
* --------------------------------------------------------------------------------
* Terms of Use
* --------------------------------------------------------------------------------
* Credit tranxuanquang nếu bạn sử dụng trong dự án.
* --------------------------------------------------------------------------------
* Version 1.0
* --------------------------------------------------------------------------------
* --------------------------------------------------------------------------------
*/
(function() {

var _gold = 0;
var _ruby = 0;

var _shop_clothes_data = [];
var _shop_clothes_cat = null; 

var drawPreview = false;
    
// Game_Interpreter
var _shop_clothes_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _shop_clothes_pluginCommand.call(this, command, args);
    if (command === 'shopClothes') {
        SceneManager.push(Scene_ShopClothes);
    }
};

// MAIN SCENE
function Scene_ShopClothes() {
    this.initialize.apply(this, arguments);
}

Scene_ShopClothes.prototype = Object.create(Scene_MenuBase.prototype);
Scene_ShopClothes.prototype.constructor = Scene_ShopClothes;

Scene_ShopClothes.prototype.initialize = function() {
	Scene_MenuBase.prototype.initialize.call(this);
    _shop_clothes_data = [];
    _shop_clothes_cat = null; 
};

Scene_ShopClothes.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createWindowShopClothesTitle();
    this.createWindowShopClothesGold();
    this.createWindowShopClothesCat();
    this.createWindowShopClothesList();
    this.createWindowShopClothesPreview();
    this.createWindowShopClothesBuy();
};

Scene_ShopClothes.prototype.createWindowShopClothesTitle = function() {
    var x = Graphics.boxWidth*1/6;
    var y = 72;
    var width = Graphics.boxWidth * 1/3;
    var height = 58;
    this._windowTitle = new Window_ShopClothesTitle(x,y,width,height);
    this.addWindow(this._windowTitle);
}

Scene_ShopClothes.prototype.createWindowShopClothesGold = function() {
    var x = this._windowTitle.x+this._windowTitle.width;
    var y = 72;
    var width = Graphics.boxWidth * 1/3;
    var height = 58;
    this._windowGold = new Window_ShopClothesGold(x,y,width,height);
    this.addWindow(this._windowGold);
}

Scene_ShopClothes.prototype.createWindowShopClothesCat = function() {
    var x = this._windowTitle.x;
    var y = this._windowTitle.y+this._windowTitle.height;
    this._windowCat = new Window_ShopClothesCat(x,y);
    this._windowCat.setHandler('ok',     this.setCat.bind(this));
    this._windowCat.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._windowCat);
}

Scene_ShopClothes.prototype.createWindowShopClothesList = function() {
    var x = this._windowCat.x+Graphics.boxWidth*1/5;
    var y = this._windowTitle.y+this._windowTitle.height;
    var w = this._windowTitle.width+this._windowGold.width-Graphics.boxWidth*1/5;
    var h = Graphics.boxHeight*3/5;
    this._windowList = new Window_ShopClothesList(x,y,w,h);
    this._windowList.setHandler('ok',     this.onOk.bind(this));
    this._windowList.refresh();
    this.addWindow(this._windowList);
}

Scene_ShopClothes.prototype.createWindowShopClothesPreview = function() {
    var x = this._windowTitle.x;
    var y = this._windowCat.y+this._windowCat.height;
    var w = this._windowCat.width;
    var h = this._windowCat.width+28;
    this._windowPreview = new Window_ShopClothesPreview(x,y,w,h);
    this.addWindow(this._windowPreview);
}

Scene_ShopClothes.prototype.createWindowShopClothesBuy = function() {
    var x = this._windowList.x;
    var y = this._windowList.y+this._windowList.height;
    this._windowBuy = new Window_ShopClothesBuy(x,y);
    this._windowBuy.setHandler('ok',     this.onBuy.bind(this));
    this._windowBuy.setHandler('cancel',     this.onCancel.bind(this));
    this.addWindow(this._windowBuy);
}

Scene_ShopClothes.prototype.setCat = function() {
    switch (this._windowCat.index()) {
        case 0:
            _shop_clothes_cat = "all";
            this._windowList.refresh();
            break;
        case 1:
            _shop_clothes_cat = "gold";
            this._windowList.refresh();
            break;
        case 2:
            _shop_clothes_cat = "ruby";
            this._windowList.refresh();
            break;
    }
    if (_shop_clothes_cat) {
        _shop_clothes_data = [];
        for (var i=1; i<$dataItems.length; i++) {
            var _getType = /<invType\s*:\s*(.*)>/i.exec($dataItems[i].note);
            var _getPayment = /<payment\s*:\s*(.*)>/i.exec($dataItems[i].note);
            if (_getType && _getType[1]=="skin") {
                if (_shop_clothes_cat == "all")
                    _shop_clothes_data.push(i);
                else {
                    if (_shop_clothes_cat == "gold") 
                        if (_getPayment[1] == _shop_clothes_cat)
                            _shop_clothes_data.push(i);
                    if (_shop_clothes_cat == "ruby") 
                        if (_getPayment[1] == _shop_clothes_cat)
                            _shop_clothes_data.push(i);
                }
            }
        }
    }
    this._windowPreview.imgName = "";
    this._windowPreview.imgIndex = 0;
    this._windowPreview.refresh();
    this._windowCat.activate();
    this._windowList.refresh();
    this._windowList.deselect();
    this._windowList.activate();
}

Scene_ShopClothes.prototype.onOk = function() {
    this._windowCat.deactivate();
    this._windowList.deactivate();
    if (/<payment\s*:\s*(.*)>/i.exec($dataItems[_shop_clothes_data[this._windowList.index()]].note)[1] == "gold") {
        if ($gameVariables.value(3) >= $dataItems[_shop_clothes_data[this._windowList.index()]].price) {
            this._windowBuy._canBuy = true;
            this.paymentsVar = 3;
        }
        else {
            this._windowBuy._canBuy = false;
        }
    }
    else {
        if (/<payment\s*:\s*(.*)>/i.exec($dataItems[_shop_clothes_data[this._windowList.index()]].note)[1] == "ruby") {
            if ($gameVariables.value(6) >= $dataItems[_shop_clothes_data[this._windowList.index()]].price) {
                this._windowBuy._canBuy = true;
                this.paymentsVar = 6;
            }
            else {
                this._windowBuy._canBuy = false;
            }
        }
    }
    this._windowBuy.refresh();
    this._windowBuy.show();
    this._windowBuy.activate();
}

Scene_ShopClothes.prototype.onCancel = function() {
    this._windowCat.activate();
    this._windowList.activate();
    this._windowBuy.hide();
    this._windowBuy.deactivate();
}

Scene_ShopClothes.prototype.onBuy = function() {
    $gameParty.gainItem($dataItems[_shop_clothes_data[this._windowList.index()]],1);
    $gameVariables.setValue(this.paymentsVar,$gameVariables.value(this.paymentsVar)-$dataItems[_shop_clothes_data[this._windowList.index()]].price);
    SaveSwitchAndItemAndVariable();
    this._windowGold.refresh();
    this._windowCat.activate();
    this._windowList.activate();
    this._windowBuy.hide();
    this._windowBuy.deactivate();
}

Scene_ShopClothes.prototype.update = function() {
	Scene_MenuBase.prototype.update.call(this);
    if (!drawPreview) {
        this._windowPreview.drawAllItems();
        drawPreview = true;
    }

    if (this.checkPreviewRefresh != this._windowList.index()) {
        this.checkPreviewRefresh = this._windowList.index();
        if (this.checkPreviewRefresh > -1) {
            var _getImg = /<invChar\s*:\s*(.*),(.*)>/i.exec($dataItems[_shop_clothes_data[this._windowList.index()]].note);
            if (_getImg) {
                this._windowPreview.imgName = _getImg[1];
                this._windowPreview.imgIndex = Number(_getImg[2]);
            }
            drawPreview = false;
            this._windowPreview.refresh();
        }
    }
}

    
// ----- WINDOW TITLE ----- //

function Window_ShopClothesTitle() {
    this.initialize.apply(this,arguments);
}

Window_ShopClothesTitle.prototype = Object.create(Window_Base.prototype);
Window_ShopClothesTitle.prototype.constructor = Window_ShopClothesTitle;

Window_ShopClothesTitle.prototype.standardPadding = function() {
    return 6;
}

Window_ShopClothesTitle.prototype.initialize = function(x,y,w,h) {
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    this.drawAllItems();
}

Window_ShopClothesTitle.prototype.drawAllItems = function() {
    this.contents.fontSize = 28;
    this.contents.fontBold = true;
    this.drawText("Shop Clothes",0,0,this.width - this.padding * 2,"center");
}

// ----- WINDOW GOLD ----- //

function Window_ShopClothesGold() {
    this.initialize.apply(this,arguments);
}

Window_ShopClothesGold.prototype = Object.create(Window_Base.prototype);
Window_ShopClothesGold.prototype.constructor = Window_ShopClothesGold;

Window_ShopClothesGold.prototype.initialize = function(x,y,w,h) {
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    _gold = $gameVariables.value(3);
    _ruby = $gameVariables.value(6);
    this.drawAllItems();
}

Window_ShopClothesTitle.prototype.standardPadding = function() {
    return 12;
}

Window_ShopClothesGold.prototype.drawAllItems = function() {
    this.contents.fontSize = 24;
    this.contents.fontBold = true;
    this.changeTextColor(this.systemColor());
    this.drawIcon(1226,80,-6);
    this.drawText(_gold,-(this.width - this.padding * 2)/2-38,-6,this.width - this.padding * 2,"right");
    this.drawIcon(1212,205,-6);
    this.drawText(_ruby,-30,-6,this.width - this.padding * 2,"right");
}

Window_ShopClothesGold.prototype.refresh = function() {
    this.createContents();
    _gold = $gameVariables.value(3);
    _ruby = $gameVariables.value(6);
    this.drawAllItems();
}

// ----- WINDOW CAT ----- //

function Window_ShopClothesCat() {
    this.initialize.apply(this,arguments);
}
Window_ShopClothesCat.prototype = Object.create(Window_Command.prototype);
Window_ShopClothesCat.prototype.constructor = Window_ShopClothesCat;

Window_ShopClothesCat.prototype.initialize = function(x,y) {
    Window_Command.prototype.initialize.call(this,x,y);
}	

Window_ShopClothesCat.prototype.windowWidth = function() {
    return Graphics.boxWidth*1/5;
}

Window_ShopClothesCat.prototype.maxCols = function() {
    return 1;
}

Window_ShopClothesCat.prototype.itemTextAlign = function() {
    return 'center';
};

Window_ShopClothesCat.prototype.makeCommandList = function() {
    this.addCommand('All','ok');
    this.addCommand('Gold','ok');
    this.addCommand('Ruby',"ok");
    this.addCommand('Back',"cancel");
}

// ----- WINDOW LIST ----- //

function Window_ShopClothesList() {
    this.initialize.apply(this, arguments);
}

Window_ShopClothesList.prototype = Object.create(Window_Selectable.prototype);
Window_ShopClothesList.prototype.constructor = Window_ShopClothesList;

Window_ShopClothesList.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
};

Window_ShopClothesList.prototype.maxItems = function() {
    return _shop_clothes_data.length;
};

Window_ShopClothesList.prototype.maxVisibleItems = function() {
    return 5;
};

Window_ShopClothesList.prototype.itemHeight = function() {
    var innerHeight = this.height - this.padding * 2;
    return Math.floor(innerHeight / this.maxVisibleItems());
};

Window_ShopClothesList.prototype.drawItem = function(index) {
    var rect = this.itemRectForText(index);
    this.contents.fontSize = 22;
    this.contents.fontBold = false;
    this.drawIcon($dataItems[_shop_clothes_data[index]].iconIndex,rect.x,rect.y+20);
    this.changeTextColor(this.normalColor());
    this.drawText($dataItems[_shop_clothes_data[index]].name,rect.x+40,rect.y+4,this.width-this.padding,"left");
    this.contents.fontSize = 20;
    this.changeTextColor(this.systemColor());
    this.drawText($dataItems[_shop_clothes_data[index]].price,rect.x+40,rect.y+32,this.width-this.padding,"left");
    if (/<payment\s*:\s*(.*)>/i.exec($dataItems[_shop_clothes_data[index]].note)[1] == "gold")
        this.drawIcon(1226,rect.x+this.textWidth($dataItems[_shop_clothes_data[index]].price)+40,rect.y+34);
    else
        if (/<payment\s*:\s*(.*)>/i.exec($dataItems[_shop_clothes_data[index]].note)[1] == "ruby")
            this.drawIcon(1212,rect.x+this.textWidth($dataItems[_shop_clothes_data[index]].price)+40,rect.y+34);
};

Window_ShopClothesList.prototype.refresh = function() {
    Window_Selectable.prototype.refresh.call(this);
}

// ----- WINDOW PREVIEW ----- //

function Window_ShopClothesPreview() {
    this.initialize.apply(this,arguments);
}

Window_ShopClothesPreview.prototype = Object.create(Window_Base.prototype);
Window_ShopClothesPreview.prototype.constructor = Window_ShopClothesPreview;

Window_ShopClothesPreview.prototype.initialize = function(x,y,w,h) {
    Window_Base.prototype.initialize.call(this,x,y,w,h);
    this.imgName = "";
    this.imgIndex = 0;
    this.drawAllItems();
}

Window_ShopClothesPreview.prototype.drawAllItems = function() {
    this.drawFace(this.imgName,this.imgIndex,-8,4);
    this.drawCharacter(this.imgName,this.imgIndex,this.width-this.padding*2-24,148);
}   

Window_ShopClothesPreview.prototype.refresh = function() {
    this.createContents();
    this.drawAllItems();
}

// ----- WINDOW BUY COMMAND ----- //

function Window_ShopClothesBuy() {
    this.initialize.apply(this,arguments);
}
Window_ShopClothesBuy.prototype = Object.create(Window_HorzCommand.prototype);
Window_ShopClothesBuy.prototype.constructor = Window_ShopClothesBuy;

Window_ShopClothesBuy.prototype.initialize = function(x,y) {
    Window_HorzCommand.prototype.initialize.call(this,x,y);
    this.hide();
    this._canBuy = false;
}	

Window_ShopClothesBuy.prototype.windowWidth = function() {
    return Graphics.boxWidth*2/3-Graphics.boxWidth*1/5;
}

Window_ShopClothesBuy.prototype.standardPadding = function() {
    return 8;
}

Window_ShopClothesBuy.prototype.maxCols = function() {
    return 2;
}

Window_ShopClothesBuy.prototype.makeCommandList = function() {
    this.addCommand('Buy','ok',this._canBuy);
    this.addCommand('Cancel',"cancel");
}

Window_ShopClothesBuy.prototype.refresh = function() {
    this.clearCommandList();
    this.makeCommandList();
    Window_HorzCommand.prototype.refresh.call(this);
};

})();