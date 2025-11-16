/**
 * bgTile
 */
import { _decorator, assetManager, Color, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { MapTile } from './MapTile';
import { MapLayer } from './types-map';
import { GameMap } from './GameMap';
import { MapHelper } from './MapHelper';
import { MapTileData } from './MapTileData';
const { ccclass, property } = _decorator;

@ccclass('MapBgTile')
export class MapBgTile extends MapTile {
    @property(Sprite)
    bg: Sprite = null!;
    
    private _data: MapTileData = null!;
    public updateTile(data: MapTileData) {
        this._data = data;
        const {col, row, layer} = data;
        const tileLayer = GameMap.inst.mapManager.map.getLayer(layer);
        const gid = tileLayer.getTileGIDAt(row, col);
        if(gid<=0) {
            return;
        }
        const texture = MapHelper.getGidTexture(GameMap.inst.mapManager.map, gid);
        assetManager.loadBundle("tiled", (err, bundle)=>{
            bundle.load(`${texture}/spriteFrame`, SpriteFrame, (err, asset) => {
                this.bg.spriteFrame = asset;
            })
        })
        this.showNav();
    }

    public showNav() {
        if(!this._data.isNav) {
            this.bg.color = new Color(255, 255, 255);
        }else {
            this.bg.color = new Color(255, 0, 0);
        }
    }
}