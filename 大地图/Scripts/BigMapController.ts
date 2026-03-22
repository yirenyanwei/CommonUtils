import {
    _decorator,
    Camera,
    Component,
    EventMouse,
    EventTouch,
    Input,
    Node,
    Prefab,
    SpriteFrame,
    UITransform,
    Vec2,
    input,
    v3,
    view,
} from 'cc';
import { BigMapAStar } from './BigMapAStar';
import { BigMapModel } from './BigMapModel';
import { BigMapViewportStreamer } from './BigMapViewportStreamer';
import { IsoGridMath } from './IsoGridMath';
import { TileVisualPool } from './TileVisualPool';

const { ccclass, property } = _decorator;

/**
 * 门面：组装 Model + 等距数学 + 对象池 + 视口流式 + 摄像机交互。
 * 场景搭建：地图根节点挂本组件；指定 mapCamera（正交）、touchLayer（接收拖拽）；可选瓦片 Prefab / 默认 SpriteFrame。
 */
@ccclass('BigMapController')
export class BigMapController extends Component {
    @property(Camera)
    public mapCamera: Camera = null!;

    @property(Node)
    public touchLayer: Node = null!;

    @property(Prefab)
    public tileGroundPrefab: Prefab | null = null;

    @property(Prefab)
    public tileBuildingPrefab: Prefab | null = null;

    @property(SpriteFrame)
    public defaultTileSprite: SpriteFrame | null = null;

    @property
    public mapWidth = 1000;

    @property
    public mapHeight = 1000;

    @property
    public tilePixelWidth = 128;

    @property
    public tilePixelHeight = 64;

    @property
    public minOrthoHeight = 200;

    @property
    public maxOrthoHeight = 2000;

    @property
    public demoSeed = 1;

    private _model!: BigMapModel;
    private _iso!: IsoGridMath;
    private _streamer!: BigMapViewportStreamer;
    private _bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    private _groundLayer!: Node;
    private _buildingLayer!: Node;

    public get model(): BigMapModel {
        return this._model;
    }

    public get iso(): IsoGridMath {
        return this._iso;
    }

    protected start(): void {
        this.focusMapCenter();
    }

    /** 将摄像机移到地图包围盒中心（首帧或重置视角时调用） */
    public focusMapCenter(): void {
        if (!this.mapCamera) return;
        const midX = (this._bounds.minX + this._bounds.maxX) * 0.5;
        const midY = (this._bounds.minY + this._bounds.maxY) * 0.5;
        const n = this.mapCamera.node;
        n.setPosition(midX, midY, n.position.z);
        this._clampCamera();
        this._refreshStreamer();
    }

    protected onLoad(): void {
        this._ensureLayers();
        this._model = BigMapModel.createDemo(this.mapWidth, this.mapHeight, this.demoSeed);
        this._iso = new IsoGridMath(this.tilePixelWidth, this.tilePixelHeight);
        let ui = this.node.getComponent(UITransform);
        if (!ui) {
            ui = this.node.addComponent(UITransform);
        }

        const groundPool = new TileVisualPool(
            this._groundLayer,
            this.tileGroundPrefab,
            this.defaultTileSprite,
            this.tilePixelWidth,
            this.tilePixelHeight,
            64,
        );
        const buildingPool = new TileVisualPool(
            this._buildingLayer,
            this.tileBuildingPrefab,
            this.defaultTileSprite,
            this.tilePixelWidth,
            this.tilePixelHeight,
            32,
        );

        this._streamer = new BigMapViewportStreamer(
            this._model,
            this._iso,
            this.mapCamera,
            ui,
            groundPool,
            buildingPool,
        );

        this._bounds = this._iso.mapWorldBounds(this.mapWidth, this.mapHeight);
    }

    protected onEnable(): void {
        if (this.touchLayer) {
            this.touchLayer.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        }
        input.on(Input.EventType.MOUSE_WHEEL, this._onMouseWheel, this);
        if (this.mapCamera?.node) {
            this.mapCamera.node.on(Node.EventType.TRANSFORM_CHANGED, this._onCameraTransform, this);
        }
        this.scheduleOnce(() => this._refreshStreamer(), 0);
    }

    protected onDisable(): void {
        if (this.touchLayer) {
            this.touchLayer.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        }
        input.off(Input.EventType.MOUSE_WHEEL, this._onMouseWheel, this);
        if (this.mapCamera?.node) {
            this.mapCamera.node.off(Node.EventType.TRANSFORM_CHANGED, this._onCameraTransform, this);
        }
    }

    protected onDestroy(): void {
        this._streamer?.clear();
    }

    private _ensureLayers(): void {
        this._groundLayer = this.node.getChildByName('GroundLayer') ?? new Node('GroundLayer');
        this._buildingLayer = this.node.getChildByName('BuildingLayer') ?? new Node('BuildingLayer');
        if (!this._groundLayer.parent) {
            this._groundLayer.parent = this.node;
        }
        if (!this._buildingLayer.parent) {
            this._buildingLayer.parent = this.node;
        }
    }

    private _onTouchMove(e: EventTouch): void {
        const d = e.getDelta();
        const n = this.mapCamera.node;
        n.setPosition(n.position.x - d.x, n.position.y - d.y, n.position.z);
        this._clampCamera();
    }

    private _onMouseWheel(e: EventMouse): void {
        const scroll = e.getScrollY();
        const cam = this.mapCamera;
        const factor = 1 + scroll * 0.001;
        let h = cam.orthoHeight * factor;
        h = Math.max(this.minOrthoHeight, Math.min(this.maxOrthoHeight, h));
        cam.orthoHeight = h;
        this._clampCamera();
        this._refreshStreamer();
    }

    private _onCameraTransform(): void {
        this._clampCamera();
        this._refreshStreamer();
    }

    private _refreshStreamer(): void {
        if (this._streamer) {
            this._streamer.sync();
        }
    }

    private _clampCamera(): void {
        const cam = this.mapCamera;
        if (!cam) return;
        const halfH = cam.orthoHeight;
        const vs = view.getVisibleSize();
        const halfW = halfH * (vs.width / Math.max(1, vs.height));
        const n = cam.node;
        let x = n.position.x;
        let y = n.position.y;
        const minX = this._bounds.minX + halfW;
        const maxX = this._bounds.maxX - halfW;
        const minY = this._bounds.minY + halfH;
        const maxY = this._bounds.maxY - halfH;
        if (minX <= maxX) {
            x = Math.min(maxX, Math.max(minX, x));
        } else {
            x = (this._bounds.minX + this._bounds.maxX) * 0.5;
        }
        if (minY <= maxY) {
            y = Math.min(maxY, Math.max(minY, y));
        } else {
            y = (this._bounds.minY + this._bounds.maxY) * 0.5;
        }
        if (Math.abs(x - n.position.x) > 0.5 || Math.abs(y - n.position.y) > 0.5) {
            n.setPosition(x, y, n.position.z);
        }
    }

    /**
     * A* 寻路（四邻接），返回格子路径；受 maxExpand 限制。
     */
    public findPath(sx: number, sy: number, ex: number, ey: number, maxExpand: number = 50000): Vec2[] {
        return BigMapAStar.findPath(
            (x, y) => this._model.isWalkable(x, y),
            this._model.width,
            this._model.height,
            sx,
            sy,
            ex,
            ey,
            maxExpand,
        );
    }

    /** 屏幕坐标（UI 像素）→ 地图逻辑格 */
    public screenToGrid(screenX: number, screenY: number): Vec2 {
        const w = this.mapCamera.screenToWorld(v3(screenX, screenY, 0));
        const ui = this.node.getComponent(UITransform)!;
        const local = ui.convertToNodeSpaceAR(w);
        return this._iso.worldToGrid(local.x, local.y);
    }
}
