import { _decorator, Camera, Component, EventTouch, instantiate, Node, Prefab, rect, size, Size, TiledMap, UITransform, v2, v3, Vec2, view } from 'cc';
import { MapTile } from './MapTile';
import { MapTileData } from './MapTileData';
const { ccclass, property } = _decorator;

@ccclass('MapManager')
export class MapManager extends Component {
    @property(Node)
    public mapRoot: Node = null!;
    @property(TiledMap)
    public map: TiledMap = null!;
    @property(Node)
    public tiles: Node = null!;
    @property(Camera)
    public mapCamera: Camera = null!;
    @property(Node)
    public touchNode: Node = null!;
    @property(Prefab)
    public tilePrefab: Prefab = null!;

    private _mapSize: Size = null!;
    private _tileSize: Size = null!;
    private _mapContentSize: Size = null!;
    private _tileDatas: MapTileData[][] = [];
    public init() {
        this._initMap();
    }

    protected onEnable(): void {
        this.touchNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.touchNode.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.touchNode.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.mapCamera.node.on(Node.EventType.TRANSFORM_CHANGED, this.updateMapTiles, this)
    }

    protected onDisable(): void {
        this.touchNode.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.touchNode.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.touchNode.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.mapCamera.node.off(Node.EventType.TRANSFORM_CHANGED, this.updateMapTiles, this)
    }

    private _initMap() {    
        this._mapSize = this.map.getMapSize();
        this._tileSize = this.map.getTileSize();
        this._mapContentSize = size(this._mapSize.width * this._tileSize.width, this._mapSize.height * this._tileSize.height);
        for(let i = 0; i<this._mapSize.width; i++) {
            let row = i;
            this._tileDatas[row] = [];
            for(let j = 0; j<this._mapSize.height; j++) {
                let col = this._mapSize.height - j - 1;
                const data = new MapTileData();
                data.init(row, col);
                this._tileDatas[row][col] = data;
            }
        }
        this.scheduleOnce(()=>{
            this.updateMapTiles();
        }, 0);

    }

    public createTileNode(row: number, col: number) {
        const node = instantiate(this.tilePrefab);
        node.name = `tile_${row}_${col}`;
        node.setPosition((row-this._mapSize.width/2) * this._tileSize.width + this._tileSize.width/2, (this._mapSize.height/2-col) * this._tileSize.height - this._tileSize.height/2, 0);
        this.tiles.addChild(node);
        return node;
    }

    private onTouchStart(event: EventTouch) { 
    }
    private onTouchMove(event: EventTouch) {
        const dt = event.getDelta();
        this.mapCamera.node.position = this.mapCamera.node.position.add(v3(-dt.x, -dt.y, 0));
    }
    private onTouchEnd(event: EventTouch) {
        const localPos = event.getLocation();
        const world = this.mapCamera.screenToWorld(v3(localPos.x, localPos.y, 0));
        const mapPos = this.mapRoot.getComponent(UITransform).convertToNodeSpaceAR(world);
        const mapIndex = this.convertPosToIndex(v2(mapPos.x, mapPos.y));
        const pos = this.convertIndexToPos(mapIndex);
        // console.log("mapPos:", mapPos, mapIndex, pos, localPos);
    }
    /**
     * 坐标转为下标
     * @param pos 
     */
    public convertPosToIndex(pos: Vec2) {
        const posX = pos.x + this._mapContentSize.width/2;
        const posY = pos.y + this._mapContentSize.height/2;
        const index = v2(Math.ceil(posX/this._tileSize.width)-1, Math.ceil(posY/this._tileSize.height));
        index.y = this._mapSize.height - index.y;
        index.x = Math.min(index.x, this._mapSize.width-1);
        index.x = Math.max(index.x, 0);
        index.y = Math.min(index.y, this._mapSize.height-1);
        index.y = Math.max(index.y, 0);
        return index;
    }

    public convertIndexToPos(index: Vec2) {
        const x = (index.x - this._mapSize.width/2+0.5) * this._tileSize.width; 
        const y = (this._mapSize.height/2 - index.y - 0.5) * this._tileSize.height;
        return v2(x, y);
    }


    private _startRoll = -1;
    private _startCol = -1;
    public updateMapTiles() {
        const visibleSize = view.getVisibleSize();
        const viewPort = view.getViewportRect();
        const screen = v2(0, viewPort.height);
        const world = this.mapCamera.screenToWorld(v3(screen.x, screen.y, 0));
        const mapPos = this.mapRoot.getComponent(UITransform).convertToNodeSpaceAR(world);
        // 左上角
        const mapIndex = this.convertPosToIndex(v2(mapPos.x, mapPos.y));
        const maxRow = Math.ceil(visibleSize.width / this._tileSize.width);
        const maxCol = Math.ceil(visibleSize.height / this._tileSize.height);
        if(mapIndex.x == this._startRoll && mapIndex.y == this._startCol) {
            return;
        }
        if(this._startRoll<0) {
            for(let i = mapIndex.x; i<mapIndex.x+maxRow; i++) {
                for(let j = mapIndex.y; j<mapIndex.y+maxCol; j++) {
                    const data = this._tileDatas[i][j];
                    if(data) {
                        data.showTile();
                    }
                }
             }
        }else {
            const axMin = this._startRoll;
            const ayMin = this._startCol;
            const axMax = this._startRoll + maxRow;
            const ayMax = this._startCol + maxCol;
            const bxMin = mapIndex.x;
            const bxMax = mapIndex.x + maxRow;
            const byMin = mapIndex.y;
            const byMax = mapIndex.y + maxCol;
            // 两个矩形相交
            const x = Math.max(axMin, bxMin);
            const y = Math.max(ayMin, byMin);
            const width = Math.min(axMax, bxMax) - x;
            const height = Math.min(ayMax, byMax) - y;
            const intersection = width>0 && height>0;
            // 添加
            for(let i = mapIndex.x; i<mapIndex.x+maxRow; i++) {
                for(let j = mapIndex.y; j<mapIndex.y+maxCol; j++) {
                    if(intersection && i>=x && i<x+width && j>=y && j<y+height) {
                        continue;
                    }
                    const data = this._tileDatas[i]?.[j];
                    if(data) {
                        data.showTile();
                    }
                }
             }
             // 删除
             for(let i = this._startRoll; i<this._startRoll+maxRow; i++) {
                for(let j = this._startCol; j<this._startCol+maxCol; j++) {
                    if(intersection && i>=x && i<x+width && j>=y && j<y+height) {
                        continue;
                    }
                    const data = this._tileDatas[i]?.[j];
                    if(data) {
                        data.hideTile();
                    }
                }
              }
        }
        this._startRoll = mapIndex.x;
        this._startCol = mapIndex.y;

    }
    // 原始方法
    public updateMapTiles1() {
        const visibleSize = view.getVisibleSize();
        const viewPort = view.getViewportRect();
        const screen = v2(0, viewPort.height);
        const world = this.mapCamera.screenToWorld(v3(screen.x, screen.y, 0));
        const mapPos = this.mapRoot.getComponent(UITransform).convertToNodeSpaceAR(world);
        // 左上角
        const mapIndex = this.convertPosToIndex(v2(mapPos.x, mapPos.y));
        const maxRow = Math.ceil(visibleSize.width / this._tileSize.width);
        const maxCol = Math.ceil(visibleSize.height / this._tileSize.height);

        const addMap = new Map<string, Vec2>();
        // 添加
        const addStart = v2(mapIndex.x, mapIndex.y);
        const addEnd = v2(mapIndex.x + maxRow, mapIndex.y + maxCol);
        for(let i = addStart.x; i <= addEnd.x; i++) {
            for(let j = addStart.y; j <= addEnd.y; j++) {
                const tile = this._tileDatas[i]?.[j];
                if(tile) {
                    addMap.set(`${i}_${j}`, v2(i, j));
                }
            }
        }
        // 删除
        const delMap = new Map<string, Vec2>();
        if(this._startRoll>=0){
            const delStart = v2(this._startRoll, this._startCol);
            const delEnd = v2(this._startRoll + maxRow, this._startCol + maxCol);
            for(let i = delStart.x; i <= delEnd.x; i++) {
                for(let j = delStart.y; j <= delEnd.y; j++) {
                    const tile = this._tileDatas[i]?.[j];
                    if(tile) {
                        delMap.set(`${i}_${j}`, v2(i, j));
                    }
                }
            }
        }

        addMap.forEach((pos, key) => { 
            if(delMap.has(key)){
                return;
            }
            console.log("add Map", key);
            const tile = this._tileDatas[pos.x]?.[pos.y];
            if(tile) {
                tile.showTile();
            }
        });
        delMap.forEach((pos, key) => { 
            if(addMap.has(key)){
                return;
            }
            console.log("del Map", key);
            const tile = this._tileDatas[pos.x]?.[pos.y];
            if(tile) {
                tile.hideTile();
            }
        });
        this._startRoll = mapIndex.x;
        this._startCol = mapIndex.y;
    }
}

