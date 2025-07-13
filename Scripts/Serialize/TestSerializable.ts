import { deserializeObject, Serializable, SerializedFiled, serializeObject } from "./Serializable";
import { array_t, ISerializable, map_t } from "./type-serializable";

@Serializable()
class MyType implements ISerializable {
    @SerializedFiled()
    public a: number;
    @SerializedFiled()
    public b: string;
    @SerializedFiled({ type: map_t(String, String) })
    public c: Map<string, string> = new Map([["haha", "haha"]]);

    constructor(a: number, b: string) {
        this.a = a;
        this.b = b;
    }
    initialize(): void {
    }
    serialize() {
        return serializeObject(this);
    }
    deserialize(data: any): void {
        return deserializeObject(this, data);
    }
}

@Serializable()
export class TestSerializable implements ISerializable {
    @SerializedFiled()
    public name: string = "test";
    @SerializedFiled({ type: array_t(map_t(String, String)) })
    public names: Map<string, string>[] = [new Map([["haha", "haha"]])];
    @SerializedFiled({ type: map_t(String, map_t(String, String)) })
    public haha: Map<string, Map<string, string>> = new Map([["haha", new Map([["haha", "haha"]])]]);
    @SerializedFiled({ type: MyType })
    public myType = new MyType(123, "456")
    initialize(): void {
        console.log("初始化");
    }
    serialize(): any {
        return serializeObject(this);
    }

    deserialize(data: any): void {
        deserializeObject(this, data);
    }

    public static Test() {
        let test = new TestSerializable();
        let data = test.serialize();
        console.log(data);
        let test2 = new TestSerializable();
        test2.deserialize(data);
        console.log(test2);
    }

}
