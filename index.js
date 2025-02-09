const GuiContainer = Java.type("net.minecraft.client.gui.inventory.GuiContainer")
const guiContainerLeftField = GuiContainer.class.getDeclaredField("field_147003_i")
const guiContainerTopField = GuiContainer.class.getDeclaredField("field_147009_r")
guiContainerLeftField.setAccessible(true)
guiContainerTopField.setAccessible(true)

const GuiChest = Java.type("net.minecraft.client.gui.inventory.GuiChest");
const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow");
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")

const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow")
const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
const S2FPacketSetSlot = Java.type("net.minecraft.network.play.server.S2FPacketSetSlot")

function getClickPacket(windowId, slot, button = 0) {
	if (slot === undefined || button === undefined) return;
	return new C0EPacketClickWindow(
        windowId, 
        slot, 
        button, 
        0, 
        null,
        0
    );
}

const keyBinds = [
    new KeyBind(Client.getMinecraft().field_71474_y.field_74370_x),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74366_z),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74351_w),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74368_y)
];

class SchizophreniaTerminals {
    constructor() {
        this.inTerminal = false;

        this.toShow = 0;
        this.windowId = -1;
        this.melodyClicks = 0;

        this.colorCycle = [1, 4, 13, 11, 14];
        this.queue = [];

        this.colorList = {
            "light gray": "silver",
            "light grey": "silver",
            "wool": "white wool",
            "ink": "black ink",
            "lapis": "blue lapis",
            "cocoa": "brown cocoa"
        };

        register('guiClosed', () => {
            this.inTerminal = false;
            this.toShow = 0;
        })

        register(net.minecraftforge.client.event.GuiScreenEvent.DrawScreenEvent.Pre, (event) => {
            if(!this.inTerminal) return;
            cancel(event)
            this.startMove();
        }) 

        register('packetReceived', () => {
            this.startMove();
        }).setFilteredClass(C0DPacketCloseWindow);

        register('packetReceived', () => {
            this.startMove();
        }).setFilteredClass(S2EPacketCloseWindow);

        register('packetReceived', (packet, event) => {
            if(!this.inTerminal) return;
            ChatLib.chat('s2f')
            let slot = packet.func_149173_d() // returns packet.slot (no mapped name);
            if(slot == this.queue[0].func_149544_d()) { // getSlotId();
                this.queue.splice(0, 1);
                this.startQueue();
            }
        }).setFilteredClass(S2FPacketSetSlot)

        register("packetSent", () => {
            this.stop();
        }).setFilteredClass(C0EPacketClickWindow)

        this.img = new Image.fromUrl("https://www.verywellmind.com/thmb/UeSbzl7GOSyTejYxQhJBORp58HE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/what-are-the-symptoms-of-schizophrenia-2953120-e15ca22957ec44ff8969cf9b8ac24568.jpg")
        
        register('renderOverlay', () => {
            if(this.inTerminal) {
                let x = Renderer.screen.getWidth();
                let y = Renderer.screen.getHeight();

                let w = this.img.getTextureWidth() / 6
                let h = this.img.getTextureHeight() / 6

                Renderer.drawImage(this.img, (x/2)-(w/2), (y/2)-(h/2), w, h)
            }
        })

        register("tick", () => {
            if(this.inTerminal || !Player.getContainer()) return;

            let iName = Player.getContainer().getName()
            if(iName == "Click in order!") {
                this.windowId = Player?.getContainer()?.getWindowId();
                this.inTerminal = true;
                this.getClickInOrderIndex().forEach(int => {
                    this.queue.push(getClickPacket(this.windowId, int, 0))
                })

                this.startQueue(true);
            } else if (iName.startsWith("Select all the ")) {
                this.windowId = Player?.getContainer()?.getWindowId();
                this.inTerminal = true;
                this.getColorIndex(iName).forEach(int => {
                    this.queue.push(getClickPacket(this.windowId, int, 0))
                })
                
                this.startQueue(true);
            } else if (iName.startsWith("What starts with: ")) {
                this.windowId = Player?.getContainer()?.getWindowId();
                this.inTerminal = true;
                this.getStartsWith(iName).forEach(int => {
                    this.queue.push(getClickPacket(this.windowId, int, 0))
                })
                
                this.startQueue(true);
            } else if (iName == "Change all to same color!") {
                this.windowId = Player?.getContainer()?.getWindowId();
                this.inTerminal = true;
                this.optimizeColors().forEach(int => {
                    this.queue.push(getClickPacket(this.windowId, int[0], int[1]))
                })
                
                this.startQueue(true);
            } else if (iName == "Correct all the panes!") {
                this.windowId = Player?.getContainer()?.getWindowId();
                this.inTerminal = true;
                this.processArray(this.getCorrectAll()).forEach(int => {
                    this.queue.push(getClickPacket(this.windowId, int, 0))
                })
                
                this.startQueue(true);
            } else if (iName == "Click the button on time!") {
                this.windowId = Player?.getContainer()?.getWindowId();
                this.inTerminal = true;
                
                new Thread(() => {
                    while (this.inTerminal) {
                        this.getMelody()
                    }
                }).start();
            }
        })
    }

    startQueue(first = false) {
        Client.scheduleTask(first ? 3 : 1, () => {
            Client.sendPacket(this.queue[0])

            // im using this code for odinclient termsim dont worry about it 

            // this.queue.splice(0, 1)
            // setTimeout(() => {
                // this.startQueue(false)
            // }, 50);
        })
    }

    startMove() {
        keyBinds.forEach(key => {
            key.setState(Keyboard.isKeyDown(key.getKeyCode()))
        })
    }

    stop() {
        keyBinds.forEach(key => {
            key.setState(false)
        })
    }

    processArray(arr) {
        let splitArrays = [[], [], []];

        for (let num of arr) {
            let index = Math.floor(num / 9) - 1; 
            if (index >= 0 && index < 3) {
                splitArrays[index].push(num);
            }
        }

        if (splitArrays[0].length > 0) {
            splitArrays[0] = splitArrays[0].reverse();
        }
        if (splitArrays[2].length > 0) {
            splitArrays[2] = splitArrays[2].reverse();
        }

        let result = [];
        for (let chunk of splitArrays) {
            result = result.concat(chunk);
        }

        return result;
    }

    random() {
        return 250;
    }

    onTimeSolver() {
        let s;

        Player.getContainer().getItems().forEach((item, index) => {
            if (index > 8) return;
            if (item?.getMetadata() == 2) s = index;
        });

        return s;
    }

    mode(array) {
        return array.sort((a,b) => array.filter(v => v===a).length - array.filter(v => v===b).length).pop()
    }

    getCorrectAll() {
        let r = [];

        for (let index = 11; index < 34; index++) {
            if (Player.getContainer().getStackInSlot(index)?.getMetadata() === 14) r.push(index);
        }

        return r;
    }

    findMostRepeatedMetadata(items) {
        const itemMetadataCounts = new Map();
    
        const validItems = items.filter(item =>
            item &&
            item.getMetadata &&
            item.getMetadata() !== 15 &&
            item.getID &&
            item.getID() === 160
        );
    
        validItems.forEach(item => {
            const metadata = String(item.getMetadata());
            itemMetadataCounts.set(metadata, (itemMetadataCounts.get(metadata) || 0) + 1);
        });
    
        let mostRepeatedMetadata = null;
        let maxCount = 0;
    
        itemMetadataCounts.forEach((count, metadata) => {
            if (count > maxCount) {
                maxCount = count;
                mostRepeatedMetadata = metadata;
            }
        });
    
        return parseInt(mostRepeatedMetadata);
    }
    
    optimizeColors() {
        const colorOrder = [13, 11, 14, 1, 4];
        const mostRepeatedMetadata = this.findMostRepeatedMetadata(Player.getContainer().getItems());
        const result = [];
    
        Player.getContainer().getItems().forEach((item, index) => {
            if (item && item.getMetadata) {
                const currentMetadata = item.getMetadata();
    
                if (currentMetadata !== 15 && currentMetadata !== mostRepeatedMetadata) {
                    const currentIndex = colorOrder.indexOf(currentMetadata);
                    const targetIndex = colorOrder.indexOf(mostRepeatedMetadata);
    
                    const leftClicks = (targetIndex - currentIndex + colorOrder.length) % colorOrder.length;
                    const rightClicks = (currentIndex - targetIndex + colorOrder.length) % colorOrder.length;
    
                    const actionNumber = leftClicks > rightClicks ? 1 : 0;
                    const clicks = Math.min(leftClicks, rightClicks);
    
                    for (let i = 0; i < clicks; i++) {
                        result.push([index, actionNumber]);
                    }
                }
            }
        });
    
        return result;
    }

    getStartsWith(iName) {
        let letter = iName.match(/What starts with: '(\w+)'?/)[1];
        let r = [];

        Player.getContainer().getItems().forEach((item, index) => {
            if (ChatLib.removeFormatting(item?.getName()).startsWith(letter) && index < 44) r.push(index);
        });

        return r;
    }

    getColorIndex(iName) {
        let color = iName.match(/Select all the (.+) items!/)[1]?.toLowerCase();
        let r = [];

        Player.getContainer().getItems().forEach((item, index) => {
            let itemName = ChatLib.removeFormatting(item?.getName()).toLowerCase();
            Object.keys(this.colorList).forEach((key) => itemName = itemName.replace(key, this.colorList[key]));
            if (itemName.includes(color) && index < 44) r.push(index);
        });
        
        return r;
    }

    getClickInOrderIndex() {
        let indexes = [];

        Player.getContainer().getItems().forEach((item, index) => {
            if (item?.getMetadata() === 14) {
                indexes[parseInt(item.getStackSize()) - 1] = index;
            } else return;
        });

        return indexes;
    }

    getMelody() {
        let row;
        let possibilities = [1,2,3,4,5]
        let rows = [9,18,27,36];
        let buttonToPress = [16,25,34,43];

        possibilities.forEach(slotIndex => {
            if(!Player?.getContainer()?.getStackInSlot(slotIndex)) return this.inTerminal = false;
            if(Player?.getContainer()?.getStackInSlot(slotIndex)?.getMetadata() == 2) row = slotIndex;
        })

        rows.forEach((number, index) => {
            if(!this.inTerminal) return;
            let slot = number + row;
            if(Player?.getContainer()?.getStackInSlot(slot)?.getMetadata() == 5) {
                let column = Math.floor(slot/9) - 1;

                Client.sendPacket(getClickPacket(this.windowId, buttonToPress[column], 2))
                this.toShow = buttonToPress[column];
                this.melodyClicks++

                if(this.melodyClicks == 4) {
                    this.melodyClicks = 0;
                    this.inTerminal = false;
                }
            }
        })
    }
}

new SchizophreniaTerminals();
