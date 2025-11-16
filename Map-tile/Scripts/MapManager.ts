import { _decorator, Camera, Component, EventTouch, instantiate, Node, Prefab, rect, size, Size, TiledMap, UITransform, v2, v3, Vec2, view } from 'cc';
import { MapTile } from './MapTile';
import { MapTileData } from './MapTileData';
import { MapLayer } from './types-map';
import { MapHelper } from './MapHelper';
import { TMAStar } from './TMAStar';
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
    public tileNumPrefab: Prefab = null!;
    @property(Prefab)
    public tileBgPrefab: Prefab = null!;

    public layerParents: Map<MapLayer, Node> = new Map();
    private _mapSize: Size = null!;
    private _tileSize: Size = null!;
    private _mapContentSize: Size = null!;
    private _tileDataMap: Map<MapLayer, MapTileData[][]> = new Map();
    // 导航数据
    private _navData: boolean[][] = [];
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
        // 遍历层
        const layers = MapHelper.getEnumValues(MapLayer);
        for(const layer in layers) {
            const layerName = layers[layer];
            const layerParent = new Node(layerName);
            layerParent.parent = this.tiles;
            this.layerParents.set(layerName, layerParent);
            if(layerName == MapLayer.Data) {
                continue;
            }
            const tileDatas = [];
            this._tileDataMap.set(layerName, tileDatas);
            for(let i = 0; i<this._mapSize.width; i++) {
                let row = i;
                tileDatas[row] = [];
                for(let j = 0; j<this._mapSize.height; j++) {
                    let col = this._mapSize.height - j - 1;
                    const data = new MapTileData();
                    data.init(row, col, layerName);
                    tileDatas[row][col] = data;
                }
            }
        }

        const navLayer = this.map.getLayer(MapLayer.Data);
        for(let i = 0; i<this._mapSize.width; i++) {
            let row = i;
            this._navData[row] = [];
            for(let j = 0; j<this._mapSize.height; j++) {
                const col = this._mapSize.height - j - 1;
                const gid = navLayer.getTileGIDAt(row, col);
                const nav = gid<=0;
                this._navData[row][col] = nav;
            }
        }

        this.scheduleOnce(()=>{
            this.updateMapTiles();
        }, 0);
        this.map.node.active = false;
    }

    public createTileNode(row: number, col: number, layer: MapLayer) {
        let node: Node = null!;
        switch (layer) {
            case MapLayer.BG:
                node = instantiate(this.tileBgPrefab);
                break;
            case MapLayer.Num:
                node = instantiate(this.tileNumPrefab);
                break;
        }
        
        if(node) {
            node.name = `tile_${row}_${col}`;
            node.setPosition((row-this._mapSize.width/2) * this._tileSize.width + this._tileSize.width/2, (this._mapSize.height/2-col) * this._tileSize.height - this._tileSize.height/2, 0);
            this.layerParents.get(layer)?.addChild(node);
        }
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

    private _showTile(row: number, col: number, layer: MapLayer) {
        const tileDatas = this._tileDataMap.get(layer);
        if(!tileDatas) return;
        tileDatas[row]?.[col]?.showTile(); 
    }
    private _hideTile(row: number, col: number, layer: MapLayer) {
        const tileDatas = this._tileDataMap.get(layer);
        if(!tileDatas) return;
        tileDatas[row]?.[col]?.hideTile();
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
        const layers = MapHelper.getEnumValues(MapLayer);
        if(this._startRoll<0) {
            for(const layer of layers) {
                if(!this._tileDataMap.has(layer)) {
                    continue;
                }
                for(let i = mapIndex.x; i<mapIndex.x+maxRow; i++) {
                    for(let j = mapIndex.y; j<mapIndex.y+maxCol; j++) {
                        this._showTile(i, j, layer);
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
            for(const layer of layers) {
                if(!this._tileDataMap.has(layer)) {
                    continue;
                }
                // 添加
                for(let i = mapIndex.x; i<mapIndex.x+maxRow; i++) {
                    for(let j = mapIndex.y; j<mapIndex.y+maxCol; j++) {
                        if(intersection && i>=x && i<x+width && j>=y && j<y+height) {
                            continue;
                        }
                        this._showTile(i, j, layer);
                    }
                }
                // 删除
                for(let i = this._startRoll; i<this._startRoll+maxRow; i++) {
                    for(let j = this._startCol; j<this._startCol+maxCol; j++) {
                        if(intersection && i>=x && i<x+width && j>=y && j<y+height) {
                            continue;
                        }
                        this._hideTile(i, j, layer);
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
        const tileDatas = this._tileDataMap.get(MapLayer.Num);
        // 添加
        const addStart = v2(mapIndex.x, mapIndex.y);
        const addEnd = v2(mapIndex.x + maxRow, mapIndex.y + maxCol);
        for(let i = addStart.x; i <= addEnd.x; i++) {
            for(let j = addStart.y; j <= addEnd.y; j++) {
                const tile = tileDatas[i]?.[j];
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
                    const tile = tileDatas[i]?.[j];
                    if(tile) {
                        delMap.set(`${i}_${j}`, v2(i, j));
                    }
                }
            }
        }
        const layers = MapHelper.getEnumValues(MapLayer);
        for(const layer of layers) {
            const _tileDatas = this._tileDataMap.get(layer);
            if(!_tileDatas) {
                continue;
            }
            addMap.forEach((pos, key) => { 
                if(delMap.has(key)){
                    return;
                }
                console.log("add Map", key);
                this._showTile(pos.x, pos.y, layer);
            });
            delMap.forEach((pos, key) => { 
                if(addMap.has(key)){
                    return;
                }
                console.log("del Map", key);
                this._hideTile(pos.x, pos.y, layer);
            }); 
        }
        
        this._startRoll = mapIndex.x;
        this._startCol = mapIndex.y;
    }

    public navPath() {
        const ret = TMAStar.AStar(this._navData, 13, 20, 31, 21);
        const bgDatas = this._tileDataMap.get(MapLayer.BG);
        for(let i = 0; i<ret.length; i++) {
            bgDatas[ret[i].x][ret[i].y].showNav();
        }
    }
}

