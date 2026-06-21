/*
 * @Desc: 飘字特效。生成一个向上飘动并淡出的文本节点（伤害/治疗/Buff 提示）
 */
import { Component, Color, Label, Node, UIOpacity, Vec3, tween } from 'cc';

export function showFloatingText(
    host: Component,
    parent: Node,
    worldPos: Vec3,
    text: string,
    textColor: Color,
    fontSize = 30,
): void {
    const node = new Node('floating-text');
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 2;
    label.color = textColor;
    label.enableOutline = true;
    label.outlineColor = new Color(0, 0, 0, 200);
    label.outlineWidth = 2;

    const opacity = node.addComponent(UIOpacity);
    parent.addChild(node);
    node.setWorldPosition(new Vec3(worldPos.x, worldPos.y + 50, worldPos.z));

    tween(node)
        .by(0.7, { position: new Vec3(0, 70, 0) })
        .start();
    tween(opacity)
        .delay(0.35)
        .to(0.35, { opacity: 0 })
        .call(() => node.destroy())
        .start();
}
