# Campus Atlas

一个静态网页：在二维地图上浏览 208 所美国大学。原有 2027 U.S. News National Universities 前 100 名次的 108 所大学保留，另加入 100 所供计算机方向比较的学校。支持中英文校名搜索、排名与办学类型筛选、点位聚合、校园照片、学校卡片、官网和地图路线链接。地图数字和筛选始终使用 U.S. News 综合排名；QS 世界排名仅在查得到时显示于卡片中。

## 本地运行

运行预览服务器：

```sh
node preview.mjs
```

打开 `http://localhost:4173/`。仓库根目录就是静态站点，可直接用 GitHub Pages 从 `main` 分支的 `/ (root)` 发布，无需安装包或编译。

## 数据

- 前 100 名次：[PrepsReview 的 2027 年整理表](https://www.prepsreview.com/us-university-rankings.html)，其页面列明 U.S. News 与交叉核对来源。新增学校的 2027 综合排名参照 [XuanXiao 的完整列表](https://xuanxiao.org/en/rankings/usnews/regional/national-universities)。此站为独立工具，不代表 U.S. News；新增名单也不是计算机专业排名。
- QS 小字标签：[QS 2027 官方列表](https://www.topuniversities.com/qs-top-uni-wur)；使用[公开整理数据](https://github.com/reshmaharidhas/Data-Analysis-of-QS-World-University-Rankings-2027)对校名。无法可靠对应的学校留空。
- 点位、城市、学校官网：从 [IPEDS / College Scorecard 衍生的开源坐标表](https://github.com/ryan-serpico/us-college-coordinates)匹配。该表采集于 2023 年；12 所存在校名或校区差异的院校按 UNITID 明确匹配至主校区。
- 学校卡片点击时从 Wikipedia 获取英文简介，并从文章图片中优先选校门、主楼或校园实景图；图片署名和授权链接见卡片。若无可用图，保留占位图。

更新增补学校时编辑 `src/additions.json`，中英文对应见 `src/names-zh-additions.json`，QS 对应见 `src/qs-ranks.json`，然后运行 `node src/merge-names.mjs`。发布文件为根目录的 `schools.json`。

地图瓦片来自 OpenStreetMap，交互组件来自 unpkg，校园简介和照片按需从 Wikipedia / Wikimedia 加载。因此访问网页时需要网络连接；地图和照片的可用性也受这些外部服务影响。
