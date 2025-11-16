import { _decorator, Component, Node } from 'cc';
import { MapManager } from './MapManager';
const { ccclass, property } = _decorator;

@ccclass('GameMap')
export class GameMap extends Component {
    @property(MapManager)
    public mapManager: MapManager = null!;

    private static _inst: GameMap;

    public static get inst() {
        return this._inst;
    }

    start() {
        GameMap._inst = this;
        this.mapManager.init();
    }

    onClickNav() {
        this.mapManager.navPath();
    }

}

