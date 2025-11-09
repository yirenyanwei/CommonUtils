import { GameMap } from "./GameMap";
import { MapTile } from "./MapTile";

/**
 * @desc: 瓦片数据
 */
export class MapTileData {
    public row: number = 0;
    public col: number = 0;
    public name: string = '';
    public mapTile: MapTile = null!;
    

    init(row: number, col: number) {
        this.row = row;
        this.col = col;
        this.name = `${row},${col}`;
    }

    public showTile() {
        if(!this.mapTile) {
            this.mapTile = GameMap.inst.mapManager.createTileNode(this.row, this.col).getComponent(MapTile);
        }
        this.mapTile.updateTile(this.row, this.col);
        this.mapTile.node.active = true;
    }

    public hideTile() {
        if(!this.mapTile) {
            return;
        }
        this.mapTile.node.active = false;
    }
    
}