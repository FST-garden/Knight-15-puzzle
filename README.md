# Knight 15-puzzle / 马步15p

Created by orm(UID:74633), GPT-assisted

**当前展示版本：V3。** [在线游玩](https://guo-gc.github.io/Knight-15-puzzle/) · [版本记录](CHANGELOG.md) · [上传说明](V3_UPLOAD.md)

## 中文

### 玩法

这是采用国际象棋马步的数字华容道，**不是骑士巡游（Knight’s Tour），也不是让单匹马遍历棋盘的 Knight Travel 谜题**。

标准4×4棋盘有1～15和一个空格。每步选择与空格相隔“一个方向两格、垂直方向一格”的棋子，与空格交换；可以跳过其他棋子。目标是按行升序排列，右下角留空。

```text
 1  2  3  4
 5  6  7  8
 9 10 11 12
13 14 15  □
```

### 游玩与离线使用

- 打开在线页面，或点击顶部“下载离线版”，用启用JavaScript的浏览器打开下载的HTML。无需安装依赖或登录。也可直接打开仓库的index.html。
- 主游戏宽高支持3～5；人脑解法与盲解探索面向4×4。
- “标／手／随”：标准、手动、随机可解布局；自由编辑可以任意交换棋子与空格，也可能产生不可解局面。
- 后退、前进支持一步、五步与跳至首尾；导入／导出使用JSON。历史中的数字表示该步与空格交换的棋子。
- “机器解”调用搜索；“人脑解”将当前4×4局面带入人脑解法演示。
- **颜色代表目标环，标志在单格内的位置代表目标位置。** 已归位格较暗。
- 电脑宽屏采用左棋盘、右局面／历史／算法；窄屏纵向排列。手机文件预览器不一定运行脚本，应选择浏览器打开；尚未做实机兼容性测试。
- 关闭前导出需要保留的棋局；下载离线程序不等于保存当前棋局。

### 机器解法

棋盘视为图：位置是顶点，合法马步是边。启发式使用各棋子到目标位置的最短马步距离之和，不计空格；界面称“马步曼哈顿”，它是下界，不是精确解长。

4×4使用双PDB：每套内部按代价分摊相加，两套取最大值。其他尺寸使用马步距离。提供Weighted A*（W=1、1.25、1.5、1.75、2）、IDA*、限时优化和持续改进A*，均有资源限制。W>1不保证最短；超时不等于无解；找到合法解不等于证明最短。

### 人脑解法

包含整体讲解、记忆公式、具体演示。按黄→绿→蓝→红推进：4、13、6、11；5、12、3、14；2、15、9、8；最后红环收尾。通过接应逐匹归位，基础版使用10↔9空格点对点定式及其变体；“保留已归位块”指整段结束后恢复，中途可以借动。

提供16个初始MD为30～60的分层构造样本，以及当前棋局演示；这些不是均匀随机样本。路线由程序规划，不能据此断言真人能够自行选择同样路线。支持按操作段／按单步回放、目标跳转和可折叠讲解。

### 盲解探索

当前页面收录102种接应≤8步的有向三循环：接应→四步转环→撤回，完整宏最多20步。支持对称、逆向、分段回放和遮住棋子练习。原位卡空格起止在16，对称卡须核对实际起点。

公式路线记录固定位置，不是棋子数字；完整执行后才恢复非目标位置。盲解栏目已移除六张点对点卡。研究中的910种完整宏库及其他补偿交换，不等于本页已收录或已完成完整盲解工具。

**人脑和盲解部分是研究演示，仍有优化空间，未经独立审计或系统真人易用性验证。** 程序回放正确与人类能独立理解、规划和执行是不同的验证。

### 文件与版本

- index.html：V3完整单文件入口，约13.5 MB，含离线资源；不依赖旧pages目录。
- README.md：当前功能说明。
- CHANGELOG.md：人工维护的版本变化。
- V3_UPLOAD.md：上传与Pages配置步骤。
- 旧版HTML、pages目录及研究报告如仍保留，属于历史资料，不代表V3菜单全部收录。

Git提交记录保存每次文件变更；Release/Tag需要单独创建。版本记录采用V3/V2等项目版本名，不虚构历史发布日期。参见[提交历史](https://github.com/guo-gc/Knight-15-puzzle/commits/main/)和[Releases](https://github.com/guo-gc/Knight-15-puzzle/releases)。

## English

### Game

A numbered sliding puzzle using chess knight moves, **not a Knight’s Tour / Knight Travel traversal puzzle**. Swap one tile with the blank when their positions differ by two squares along one axis and one along the other. Restore ascending row-major order, with the blank at the bottom right. Intervening tiles do not block moves.

### V3 features

- Play online or select “下载离线版” (Download offline version). Open the resulting standalone HTML in a JavaScript-enabled browser. No dependencies or sign-in required.
- Board dimensions from 3 to 5; human and blind-solving demonstrations target 4×4.
- Standard/manual/random layouts, free editing, history navigation, and JSON import/export. Export separately to preserve a game; downloading the app does not save its current board.
- Machine solve uses graph distances, dual additive PDB partitions for 4×4, Weighted A*, IDA*, and bounded improvement searches. W>1 does not guarantee optimality; reaching a limit does not imply unsolvability.
- Human solving explains four rings, reception routes, and the 10↔9 blank-swap formula. Sixteen deliberately constructed MD30–60 samples and the current game can be replayed by operation or individual move.
- Blind exploration contains 102 directed three-cycles with setup length ≤8 and total length ≤20. Supports symmetry, reversal, segmented playback, and hidden tile labels. The six blank-swap cards have been removed from this section.
- Marker color denotes the target ring; marker position denotes the target square. Desktop uses a left board and right information panels; narrower screens stack vertically.

**These are research demonstrations, not independently audited or systematically human-tested instructions.** Legal replay checks do not establish that a person can independently plan the routes. Mobile compatibility and the full offline download/reopen flow have not been comprehensively tested.

The current index.html is a self-contained file of about 13.5 MB. Historical V2 files and reports may remain in the repository; they are not all included in the V3 interface. See [CHANGELOG](CHANGELOG.md) for changes. Git commits preserve file history; named releases and tags are created separately.
