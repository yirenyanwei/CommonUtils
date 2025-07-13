import { _decorator, Component, Node } from 'cc';
import { ZigZag } from './ZigZag';
import { TestSerializable } from './Serialize/TestSerializable';
const { ccclass, property } = _decorator;

@ccclass('TaskTreeCom')
export class TaskTreeCom extends Component {
    start() {
        ZigZag.Test();
        TestSerializable.Test();
    }

    update(deltaTime: number) {
        
    }
}

