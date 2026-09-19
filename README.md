# Knight 15-puzzle / 马步15p

**A numbered sliding puzzle with knight moves. / 用国际象棋马步移动的数字华容道。**

Created by orm(UID:74633), GPT-assisted

[中文](#中文) · [English](#english)

## 中文

### 这是什么游戏？

马步15p把经典数字华容道的相邻滑动改成了国际象棋的马步。标准棋盘为4×4，包含1至15号棋子和一个空格。

**这不是骑士巡游（Knight’s Tour），也不是让一匹马走遍棋盘的 Knight Travel 类谜题。** 你不需要让马访问每个格子一次，也不需要寻找覆盖棋盘的路径；你需要通过棋子与空格的交换，把数字重新排好。

### 玩法

1. 每步选择一枚与空格相隔合法马步的棋子：一个方向两格，垂直方向一格。
2. 该棋子与空格交换。马可以跳过其他棋子，不受中间阻挡。
3. 数字从左到右、从上到下升序排列，右下角为空格时完成。

```text
 1   2   3   4
 5   6   7   8
 9  10  11  12
13  14  15   □
```

支持宽、高各3至5格；其他尺寸采用同样的升序目标。随机布局由目标局面进行合法移动生成，保证可解，但打乱步数不等于最短解步数。

### 运行与操作

- **离线运行：** 下载 `orm-9t15p-v2.html`，用启用 JavaScript 的浏览器打开；不需要安装依赖或登录。
- **GitHub Pages：** 将单文件复制为仓库发布目录中的 `index.html`，启用 Pages 后即可通过网站游玩。
- 点击可移动棋子；手机使用点按。手机文件预览器不一定执行网页脚本，可能需要选择浏览器打开。
- `std / mnl / rdm`：标准布局、手动摆局、随机布局。自由编辑允许任意棋子与空格交换，可能产生不可解局面。
- 支持撤销、重做、五步跳转、回到起点和末尾；棋盘内滚轮用于后退和重做。
- W/A/S/D或方向键连续输入两个垂直方向：第一键两格，第二键一格，以空格为起点。例如 `WA` 为上二左一。
- 灯泡提示一步；求解后用前进按钮逐步回放。
- JSON存档记录原局面和移动数字序列；每个数字表示该步与空格交换的棋子。关闭页面前请导出需要保留的记录。

### 机器求解思路

程序把棋盘看作一张图：格子是顶点，合法马步是边，每次移动就是空格沿一条边交换。

- **马步距离：** 各编号棋子到其目标格的图最短距离之和，不计空格。界面中的“马步曼哈顿”指这个指标，不是横竖距离，也不是精确剩余解长。
- **双PDB（模式数据库）：** 4×4使用两套预计算的棋子分组查找表。每套内部按代价分摊相加，两套取较大值，不能直接把两套总值相加。其他尺寸使用马步距离。
- **Weighted A\*：** 以 $f=g+Wh$ 排序，界面可选 $W=1,1.25,1.5,1.75,2$。$W>1$ 时不保证最短解。
- **IDA\*：** 按代价阈值逐轮深搜，内存占用较低；时间和节点预算可能使它在找到或证明最短解前停止。
- **限时优化：** 分阶段调整搜索权重，保留已有合法解并尝试缩短。
- **持续改进A\*：** 保留搜索队列继续改善解，通常需要更多内存。

搜索提供时间、节点上限和取消功能。**超时或达到上限不代表无解；找到一条解也不等于证明最短。** 以界面实际返回的结果和最短性标记为准。4×4的预计算PDB也是第二版单文件体积较大的主要原因。

### 人脑思路演示（待优化）：未经审计

第二版研究展示版收录四缓冲逐块还原、交换卡、分组接龙与自由准备、R5恢复准备合并及空格接力、最后九格收尾、配对三循环、其他循环组合、两张局部卡、三个入口和固定12例观察。早期方向与失败结果在“研究脉络 / 原始说明”中保留，不把重复旧版本全部平铺成独立页面。

这些内容展示：如何接入固定路线、哪些棋子能归位、缓冲棋子去哪里、下一段是否能接续。演示路线中的格号表示固定位置，不应与实际点击的棋子编号混淆。统一回放控件支持阶段跳转、净去向检查、导出记录及将当前局面转入游玩；转入会替换游戏记录，操作前需确认。

**所有思路演示仍待优化，未经独立审计，也未经过系统的人类盲测或易用性验证。这里展示构造、局部策略和程序生成的路线，不宣称已形成玩家能独立执行的成熟通用方法。** 已有程序检查不等同于独立审计。所谓“保留已归位块”通常指整段结束时恢复，过程中仍可能借动；接龙整张卡的净效果也不能一概视为单个三循环。

固定12例观察中，原卡片条件未命中；沿相同卡片路线发现1例其他双块归位组合，但未找到限定短准备范围内的后续净增益。这个小样本不能代表所有随机局面的成功率。

### 人脑研究方向与边界

| 方向 | 核心思路 | 当前边界 |
|---|---|---|
| 四缓冲逐块还原 | 预留1、7、10、16格为工作区；用点对点交换卡接送目标，逐块完成外部位置，最后沿四缓冲环收尾 | 已补齐底层交换路线，8个旧样本完整展开并解出；该历史版本平均597步，路线较长，未经真人易用性验证 |
| 少量基准卡与分组接龙 | 利用对称减少记忆；目标回家后，继续接送被挤入缓冲的棋子，断链后按分组重新选目标 | 已有接应演示与有限样本比较；接应次数不能当作真实马步数 |
| 自由准备与机会归角 | 前期允许扰动未完成块；研究先完成4、13，以及途中顺手归角两种方案 | 具体途中归角实现曾在同8局全部变长，不能把想法本身称为已证实的优化 |
| R5恢复与准备合并、空格接力 | 合并上一轮恢复与下一轮准备，减少往返，不要求每轮空格回到16（d4） | 有路线回放和有限对照；路线可由程序生成，不能据此认定玩家能自行规划 |
| 两块回家、第三块接力 | 先安排三循环的出口，使两块归位并预判第三块去向；整轮为准备→轮换→撤销准备 | 已有示例与演示；准备路线可能较长，并非每轮都能廉价归位两块 |
| 其他三循环组合 | 比较一块接一块、先准备再归位、暂借已归位块后还清，以及短自由前奏 | 组合选择仍依赖程序，尚未提炼为完整的低记忆人脑规则 |

逐块法为“如何持续推进并最终收尾”提供构造思路；两张卡为“如何识别一个便宜的局部机会”提供观察材料。两者是不同层次，后者不能直接替代前者。研究过的通用构造、有限样本验证、玩家能否记住并独立执行，应分别评价。以上方向均已整理入研究展示版的代表性回放或历史说明，仍待优化、未经独立审计。

在线版按需加载页面；离线单文件约3.35 MB，压缩保留完整双PDB与原Logo。离线和在线压缩页面需要支持 `DecompressionStream` 的现代浏览器；手机兼容性尚未经实机验证。程序已检查144次样本回放、30,530次移动及阶段边界（含重复检查），并通过原游玩与求解界面逻辑回归；这不是视觉验收或人类测试。

## English

### What is this game?

Knight 15-puzzle replaces the ordinary sliding puzzle's orthogonal moves with chess knight moves. The standard 4×4 board contains tiles numbered 1–15 and one blank.

**This is not a Knight’s Tour or a “Knight Travel” puzzle about moving one knight across the board.** You do not need to visit every square exactly once or find a path covering the board. Your goal is to restore the numbered arrangement by swapping tiles with the blank.

### How to play

1. Choose a tile a legal knight move away from the blank: two squares in one direction and one in the perpendicular direction.
2. Swap that tile with the blank. Intervening tiles do not block the move.
3. Restore ascending row-major order, with the blank in the bottom-right corner, as shown above.

Width and height can each be set from 3 to 5. Random boards are generated through legal moves from the goal and are therefore solvable. Scramble length is not the optimal solution length.

### Running and controls

- **Offline:** download `orm-9t15p-v2.html` and open it in a JavaScript-enabled browser. No dependencies or sign-in are required.
- **GitHub Pages:** copy the standalone file to `index.html` in the publishing directory and enable Pages.
- Click or tap a legal tile. Some mobile file previewers do not run scripts; open the file in a browser instead.
- `std / mnl / rdm` select the standard goal, manual placement, or a random board. Free editing permits arbitrary tile/blank swaps and can create unsolvable boards.
- Undo, redo, five-step jumps, and history endpoints are available. The wheel over the board navigates recorded moves.
- Enter two perpendicular directions using WASD or arrow keys: the first means two squares, the second one square, relative to the blank. For example, `WA` means two up and one left.
- The light bulb gives one hint move. Solver results can be replayed step by step.
- JSON exports contain the initial board and the sequence of tile numbers swapped with the blank. Export any history you want to keep before closing the page.

### Solver overview

The board is treated as a graph: squares are vertices and legal knight moves are edges. Each move swaps the blank along one edge.

- **Knight-distance heuristic:** sum the shortest graph distance from each numbered tile to its goal, excluding the blank. The UI's “knight Manhattan” label refers to this lower bound, not orthogonal Manhattan distance or an exact solution length.
- **Dual pattern databases (PDBs):** on 4×4 boards, two precomputed tile partitions provide stronger bounds. Costs are partitioned and summed within each partition; the maximum of the two totals is used. The two totals are not added together. Other dimensions use knight distance.
- **Weighted A\*:** prioritizes $f=g+Wh$, with UI weights $W=1,1.25,1.5,1.75,2$. Weights above 1 do not guarantee shortest solutions.
- **IDA\*:** performs successive cost-bounded depth-first searches with relatively low memory use. Resource limits may interrupt it before a shortest solution is found or proved.
- **Time-limited improvement:** changes search weights in stages while retaining a valid incumbent and attempting to shorten it.
- **Persistent improving A\*:** retains its search frontier to continue improving a solution, generally using more memory.

Time and node limits, plus cancellation, bound the search. **A timeout does not mean unsolvable; finding a solution does not by itself prove optimality.** Consult the returned status and optimality indication. The bundled 4×4 PDBs account for much of the V2 standalone file size.

### Strategy demonstrations (needs refinement): experimental and unaudited

The V2 research showcase includes representative replays of four-buffer tile-by-tile restoration, swap cards, grouped chains and free preparation, R5 merged setup/restoration and blank relay, nine-square finishing, paired and other three-cycle combinations, two local cards, three entries, and 12 fixed observations. Earlier directions and unsuccessful attempts remain in the research archive rather than duplicating every historical interface.

They explore entry cost, tiles restored, buffer destinations, and possible continuation. Position numbers in a demonstration route are fixed squares, not necessarily the numbered tiles clicked during play. Shared controls provide phase navigation, net effects, record export, and transfer of the current board into the game; transfer replaces game history after confirmation.

**All strategy demonstrations need refinement, have not undergone an independent audit, and have not been validated through systematic human blind testing or usability studies. They present constructions, local strategies, and computer-generated routes, without claiming a mature general method that players can independently execute.** Programmatic checks are not an independent audit. “Preserving” a solved tile generally means restoring it by the end of a sequence; it may move temporarily. The complete chain card should not be treated as a single three-cycle.

In the 12 fixed samples, the original card conditions had no hits. One alternative two-tile restoration was found using the same card route, but no further net-gain continuation was found within the bounded short-setup check. This small sample does not establish a general success rate.

### Human-strategy research directions and limitations

| Direction | Main idea | Evidence and limitations |
|---|---|---|
| Four-buffer, tile-by-tile restoration | Reserve squares 1, 7, 10, and 16 as a workspace; transport tiles through endpoint-swap routines, restore external positions individually, then finish on the buffer ring | Complete underlying routes were expanded and solved eight historical samples; this historical version averaged 597 actual moves and has no human-usability validation |
| Compact base cards and grouped chains | Reduce memorization through symmetry; after restoring a tile, continue with the displaced buffer occupant, restarting from a group order when the chain ends | Entry demonstrations and bounded comparisons exist; abstract swap counts are not actual knight-move counts |
| Free preparation and opportunistic corners | Allow disruption of unfinished tiles early; compare restoring 4 and 13 first with restoring them opportunistically later | One implemented opportunistic variant lengthened all eight comparison solutions; the idea is not an established improvement |
| R5 merged restoration/setup and blank relay | Combine one round's restoration with the next round's setup, reducing round trips without requiring the blank to return to square 16 (d4) after every round | Replayable routes and bounded comparisons exist; computer-generated planning does not demonstrate that a player can plan the same routes independently |
| Two tiles home, a third relayed | Arrange the three-cycle's exits to restore two tiles and anticipate the third tile's destination through setup → cycle → inverse setup | Demonstrations exist, but setup may be long; two cheap restorations per round are not guaranteed |
| Other three-cycle combinations | Explore sequential single restorations, preparation before restoration, borrowing and returning solved tiles, and short free prefixes | Combination selection still depends on computation; a complete, low-memorization human policy has not been established |

Tile-by-tile restoration addresses systematic progress and finishing; the two cards address recognizing a cheap local opportunity. These are different layers, and the latter does not replace the former. General constructions, finite-sample checks, and human ability to memorize and execute a method are separate evidence levels. These directions are included through representative replays or historical notes, and remain experimental and independently unaudited.

The online version loads pages on demand. The compressed standalone file is approximately 3.35 MB and retains the dual PDBs and original logo. Both versions require a modern browser supporting `DecompressionStream`; real-device mobile compatibility has not been tested. Programmatic checks covered 144 replay executions, 30,530 moves, and phase boundaries (including repeated checks), plus existing gameplay and solver UI regressions. These are not visual or human-subject tests.

---

Created by orm(UID:74633), GPT-assisted
