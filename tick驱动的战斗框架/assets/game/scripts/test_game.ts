import { _decorator, Component } from "cc";
import { BattleSceneController } from "./battle/application/battle_scene_controller";

const { ccclass } = _decorator;

/*
 * @Author: yanwei 
 * @Date: 2026-06-07 10:03:32 
 * @Desc:   测试游戏入口 
 */
@ccclass("TestGame")
export class TestGame extends Component {
    private battleSceneController?: BattleSceneController;

    onLoad(): void {
        this.battleSceneController = new BattleSceneController(this.node);
        this.battleSceneController.startDemoBattle();
        console.log("TestGame onLoad");
    }

    update(deltaTime: number): void {
        this.battleSceneController?.update(deltaTime);
    }
}