/**
 * GPU 实例化渲染示例（类 2D 平面，不走 Sprite / Batcher2D）
 *
 * 思路：同一 **单位** `Mesh`（1×1 四边形）+ 子节点 `setScale` 出屏上尺寸 + 同一 `Material`（`USE_INSTANCING`）
 * 与多个 `MeshRenderer`，引擎会按材质/几何分组做实例化绘制。
 * 推荐拖 `InstancedColorUnlit-Instancing.mtl` 到 `instancedUnlitMaterial`；`USE_INSTANCING` / `USE_TEXTURE` 等宏**在材质资源上**勾选即可，脚本里不再用 `copy` 覆盖宏。
 * 若组件上指了 `mainTexture`，请保证材质里**已开 USE_TEXTURE**（与旧版脚本自动开宏等效，需自管）。
 * 带 `a_instanced_color` 时脚本会 `setInstancedAttribute(…)`（与 effect 中名一致）。
 *
 * 左下角 **Instance Count** 表示本帧 `drawInstanced` 的实例乘数累加；普通 `drawElements` 常为 0。
 * 合批效果请优先看 **Draw Call** 是否远小于 `count`。
 */
import {
    _decorator,
    Color,
    Component,
    gfx,
    Material,
    Mesh,
    MeshRenderer,
    Node,
    Texture2D,
    primitives,
    utils,
    v3,
} from 'cc';

const { MeshUtils } = utils;
const { ccclass, property } = _decorator;

/** 与 `InstancedColorUnlit.effect.meta` 中 uuid 一致；用于判断拖入的材质是否为本示例 effect */
const INSTANCED_COLOR_UNLIT_EFFECT_UUID = '8693703d-994c-4a84-8546-e4d5d77581e6';

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

@ccclass('InstancedRenderingTest')
export class InstancedRenderingTest extends Component {
    // --- 外观 ----------------------------------------------------------------

    /** 主贴图（写入材质；材质须已开 `USE_TEXTURE` 宏才会采样） */
    @property(Texture2D)
    public mainTexture: Texture2D | null = null;

    /** 与 `mainTexture` 相乘的基准色；无贴图时即最终底色 */
    @property(Color)
    public tint = new Color(255, 255, 255, 255);

    // --- 布局 ----------------------------------------------------------------

    /** 生成实例个数 */
    @property
    public count = 500;

    /** 在 X 方向分布范围（世界单位，中心在父节点处） */
    @property
    public rangeX = 400;

    /** 在 Y 方向分布范围 */
    @property
    public rangeY = 240;

    /**
     * 每块在屏幕/世界中的视觉边长，通过 **子节点** `setScale(cellSize, cellSize, 1)` 作用在单位 mesh 上；
     * 与把边长焼进顶点相比，更贴近「3D 里用 Node 的 scale 定尺寸」的用法（仍共享同一份 mesh 资源，合批条件不变）。
     */
    @property
    public cellSize = 32;

    /** 容器节点；不填则生成在挂有本脚本的节点下 */
    @property(Node)
    public container: Node | null = null;

    // --- 材质（见 `_resolveMaterial`）-----------------------------------------

    /**
     * 拖入 `InstancedColorUnlit-Instancing.mtl` 等。宏与管线在**材质**里配好；脚本只做 `copy` 出实例、再设 `tint`/`mainTexture`（不覆盖 defines）。
     * 不填时回退为 `builtin-unlit`（无自定义 instance 色时需内置路径）。
     */
    @property(Material)
    public instancedUnlitMaterial: Material | null = null;

    // --- 杂项 ----------------------------------------------------------------

    /** 伪随机种子，改变实例位置与（自定义 effect 时）颜色分布，便于复现 */
    @property
    public randomSeed = 1;

    // --------------------------------------------------------------------------
    // 生命周期
    // --------------------------------------------------------------------------

    public start(): void {
        const parent = this.container ?? this.node;
        const mesh = this._buildSharedQuadMesh();
        const usePerInstanceColor = this._shouldUsePerInstanceColor();

        // 1) 建材质：拖入的 .mtl（仅 copy 继承面板宏）> 否则脚本建 builtin-unlit
        let mat = this._resolveMaterial();
        this._applySharedMaterialParams(mat);

        // 2) 关背面剔除：需材质实例，用 copy({ states }) 避免在资源材质上改管线
        mat = this._asMaterialInstanceWithNoBackCull(mat);

        // 3) 批量建节点：单位 quad + 子节点 scale 定大小；共享 mesh + 共享 material，可选写实例化 attribute
        const rnd = this._makeRng(this.randomSeed);
        const halfX = this.rangeX * 0.5;
        const halfY = this.rangeY * 0.5;
        const s = v3(this.cellSize, this.cellSize, 1);

        for (let i = 0; i < this.count; i++) {
            const n = new Node(`inst_quad_${i}`);
            n.parent = parent;
            n.layer = this.node.layer;
            n.setPosition(v3((rnd() * 2 - 1) * halfX, (rnd() * 2 - 1) * halfY, 0));
            n.setScale(s);

            const mr = n.addComponent(MeshRenderer);
            mr.mesh = mesh;
            mr.setSharedMaterial(mat, 0);

            if (usePerInstanceColor) {
                mr.setInstancedAttribute('a_instanced_color', this._randomRgba8(rnd));
            }
        }
    }

    // --------------------------------------------------------------------------
    // 网格
    // --------------------------------------------------------------------------

    /** 默认 1×1 的 XY 平面四边形（法线 +Z）；具体边长由子节点 `setScale` 与 `cellSize` 控制 */
    private _buildSharedQuadMesh(): Mesh {
        return MeshUtils.createMesh(primitives.quad());
    }

    // --------------------------------------------------------------------------
    // 材质
    // --------------------------------------------------------------------------

    /**
     * 有 `instancedUnlitMaterial`：`copy(源, {})` 只得到**可安全改动的材质实例**，宏与 technique 全继承资源，不在代码里设 defines。
     * 无：用 `builtin-unlit`，此时仍由脚本按是否有 `mainTexture` 开 `USE_TEXTURE`（无 .mtl 时只能这样建材质）。
     */
    private _resolveMaterial(): Material {
        if (this.instancedUnlitMaterial) {
            const mat = new Material();
            mat.copy(this.instancedUnlitMaterial, {});
            return mat;
        }
        return this._createBuiltinUnlitInstancingMaterial(this.mainTexture !== null);
    }

    /** 与检查器上 `mainTexture`/`tint` 同步到最终共享材质 */
    private _applySharedMaterialParams(mat: Material): void {
        if (this.mainTexture) {
            mat.setProperty('mainTexture', this.mainTexture);
        }
        mat.setProperty('mainColor', this.tint);
    }

    /**
     * 将基材质 `copy` 为实例，并关背面剔除（builtin-unlit 默认剔背，从某些相机方向看不到 Quad）。
     * 不能对资源级材质直接 `overridePipelineStates`，必须先 `new Material().copy(…, { states })`。
     */
    private _asMaterialInstanceWithNoBackCull(base: Material): Material {
        const inst = new Material();
        inst.copy(base, {
            states: {
                rasterizerState: { cullMode: gfx.CullMode.NONE },
            },
        });
        return inst;
    }

    private _createBuiltinUnlitInstancingMaterial(useTexture: boolean): Material {
        const mat = new Material();
        mat.initialize({
            effectName: 'builtin-unlit',
            defines: {
                USE_INSTANCING: true,
                USE_TEXTURE: useTexture,
            },
        });
        return mat;
    }

    // --------------------------------------------------------------------------
    // 实例化颜色（仅与 `InstancedColorUnlit` 搭配）
    // --------------------------------------------------------------------------

    /**
     * 仅当使用 **本仓库的** `InstancedColorUnlit` 时写 `a_instanced_color`（其它 effect 无该 attribute 会无效）。
     */
    private _shouldUsePerInstanceColor(): boolean {
        if (this.instancedUnlitMaterial) {
            return this._isInstancedColorUnlitEffect(this.instancedUnlitMaterial);
        }
        return false;
    }

    private _isInstancedColorUnlitEffect(material: Material): boolean {
        const e = material.effectAsset;
        return e !== null && e.uuid === INSTANCED_COLOR_UNLIT_EFFECT_UUID;
    }

    /** 与 effect 中 `#pragma format(RGBA8)` 对应，0–255 整数通道 */
    private _randomRgba8(rnd: () => number): number[] {
        return [
            Math.floor(rnd() * 256),
            Math.floor(rnd() * 256),
            Math.floor(rnd() * 256),
            255,
        ];
    }

    // --------------------------------------------------------------------------
    // 工具
    // --------------------------------------------------------------------------

    /** xorshift32，[0,1) 浮点，可复现 */
    private _makeRng(seed: number): () => number {
        let x = seed | 0 || 123456789;
        return () => {
            x ^= x << 13;
            x ^= x >>> 17;
            x ^= x << 5;
            return ((x >>> 0) % 0x7fffffff) / 0x7fffffff;
        };
    }
}
