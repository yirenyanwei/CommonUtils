/**
 * zigZag测试
 */
export class ZigZag {

    public static EncodeZigZag32(n: number) {
    return (n << 1 ^ n >> 31);
    }
    // & MaxValue 实现逻辑右移1位
    public static DecodeZigZag32(n: number) {
    return ((n >> 1) & Number.MAX_VALUE) ^ -(n & 1);
    }

    public static Test() {
        const n = 10;
        const en = ZigZag.EncodeZigZag32(n);
        const de = ZigZag.DecodeZigZag32(en);
        console.log(n, en, de);
    }
}