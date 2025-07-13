import { Task } from "../Task";
import { TaskStatus } from "../TaskStatus";
import { BranchTask } from "./BranchTask";

/**
 * 即并行节点，表示可能有多个同时处于运行状态的子节点的Node
 */
export abstract class ParalleTask<T> extends BranchTask<T> {
}