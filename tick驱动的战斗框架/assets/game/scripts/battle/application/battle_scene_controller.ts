import { Node } from "cc";
import { createSampleBattleConfig } from "../data/sample_battle_config";
import { BattleViewAdapter } from "../view/battle_view_adapter";
import { BattleApplication } from "./battle_application";

export class BattleSceneController {
    readonly battleApplication: BattleApplication = new BattleApplication();

    private battleViewAdapter?: BattleViewAdapter;

    constructor(private readonly sceneRoot: Node) {}

    // 场景控制层负责把 Cocos 节点和战斗用例层接起来，战斗裁决仍在纯逻辑层完成。
    startDemoBattle(): void {
        const config = createSampleBattleConfig();
        this.battleApplication.startBattle(config, {
            seed: 1,
            heroPosition: { x: 120, y: 320 },
        });
        this.battleViewAdapter = new BattleViewAdapter(this.createBattleRoot());
        this.enqueueDemoCommands();
    }

    update(deltaTime: number): void {
        if (!this.battleViewAdapter) {
            return;
        }

        const events = this.battleApplication.update(deltaTime);
        // View 只消费事件，不反向修改 BattleWorld。
        this.battleViewAdapter.applyEvents(events);
    }

    private enqueueDemoCommands(): void {
        this.battleApplication.placeTower("tower_001", { x: 280, y: 320 }, 1);
        this.battleApplication.placeTower("tower_001", { x: 420, y: 260 }, 1);
        this.battleApplication.castAbility(1, "basic_projectile", 90);
    }

    private createBattleRoot(): Node {
        const root = new Node("battle_view_root");
        root.parent = this.sceneRoot;
        return root;
    }
}
