import { GameMap } from "./GameMap";
import { MapBgTile } from "./MapBgTile";
import { MapNumTile } from "./MapNumTile";
import { MapTile } from "./MapTile";
import { MapLayer } from "./types-map";

/**
 * @desc: 瓦片数据
 */
export class MapTileData {
    public row: number = 0;
    public col: number = 0;
    public name: string = '';
    public mapTile: MapTile = null!;
    public layer: MapLayer = MapLayer.Num;
    public isNav = false;
    

    init(row: number, col: number, layer: MapLayer) {
        this.row = row;
        this.col = col;
        this.name = `${row},${col}`;
        this.layer = layer;
    }

    public showTile() {
        if(!this.mapTile) {
            this.mapTile = GameMap.inst.mapManager.createTileNode(this.row, this.col, this.layer).getComponent(MapTile);
        }
        if(this.mapTile) {
            switch(this.layer) {
                case MapLayer.BG:
                    this.mapTile.getComponent(MapBgTile).updateTile(this);
                    break;
                case MapLayer.Num:
                    this.mapTile.getComponent(MapNumTile).updateTile(this.row, this.col);
                    break;
            }
            this.mapTile.node.active = true;
        }
    }

    public hideTile() {
        if(!this.mapTile) {
            return;
        }
        this.mapTile.node.active = false;
    }

    public showNav() {
        this.isNav = true;
        this.mapTile?.getComponent(MapBgTile).showNav();
    }
    
}