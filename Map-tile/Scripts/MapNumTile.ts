import { _decorator, Component, Label, Node } from 'cc';
import { MapTile } from './MapTile';
const { ccclass, property } = _decorator;

@ccclass('MapNumTile')
export class MapNumTile extends MapTile {
    @property(Label)
    lbl_name: Label = null!;
    
    private _row: number = 0;
    private _col: number = 0;
    public updateTile(row: number, col: number) {
        this._row = row;
        this._col = col;
        this.lbl_name.string = `${row},${col}`;
    }
}