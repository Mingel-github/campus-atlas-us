# Campus Atlas

[在线打开地图](https://mingel-github.github.io/campus-atlas-us/)

一个静态网页：在二维地图上浏览 243 所大学，包括美国 213 所、澳洲 16 所、英国 7 所、香港 5 所、新加坡 2 所。美国学校以 2027 U.S. News 排名为主要标记；其他地区学校使用 QS 2027 综合排名。支持地区切换、中英文校名搜索、点位聚合、校园照片、学校卡片、官网和地图路线链接。学校只作为计算机硕士择校时的地图入口，不逐一收录项目。

## 本地运行

运行预览服务器：

```sh
node preview.mjs
```

打开 `http://localhost:4173/`。仓库根目录就是静态站点，可直接用 GitHub Pages 从 `main` 分支的 `/ (root)` 发布，无需安装包或编译。

## 数据

- 前 100 名次：[PrepsReview 的 2027 年整理表](https://www.prepsreview.com/us-university-rankings.html)，其页面列明 U.S. News 与交叉核对来源。新增学校的 2027 综合排名参照 [XuanXiao 的全国大学完整列表](https://xuanxiao.org/en/rankings/usnews/regional/national-universities)。南阿肯色大学、德州农工大学圣安东尼奥分校和新墨西哥矿业理工学院属于 U.S. News 区域大学榜，标记使用 R 前缀，详情卡注明 South 或 West；R 排名不参与全国前 25/50/100 筛选。安吉洛州立大学在全国大学榜中为 382–422 区间，地图简写为 382+。这些数字均非计算机专业排名。
- QS 排名：[QS 2027 官方列表](https://www.topuniversities.com/qs-top-uni-wur)。美国学校仅在查得到时于卡片中以小字补充；英国、港新澳学校以 QS 综合排名为主。QS 综合排名不是计算机学科排名。
- 点位、城市、学校官网：从 [IPEDS / College Scorecard 衍生的开源坐标表](https://github.com/ryan-serpico/us-college-coordinates)匹配。该表采集于 2023 年；12 所存在校名或校区差异的院校按 UNITID 明确匹配至主校区。
- 英国、港新澳学校、坐标与官网见 `src/international.json`；英国首批学校参考 [QS 英国前列](https://www.topuniversities.com/university-rankings-articles/world-university-rankings/top-universities-uk)和各校计算机方向硕士页面，例如 [帝国理工 Advanced Computing](https://www.imperial.ac.uk/study/courses/postgraduate-taught/advanced-computing/)、[牛津 Advanced Computer Science](https://www.ox.ac.uk/admissions/graduate/courses/msc-advanced-computer-science)、[UCL Machine Learning](https://www.ucl.ac.uk/prospective-students/graduate/taught/degrees/machine-learning-msc)。具体项目与申请条件以学校官网为准。
- 学校卡片点击时从 Wikipedia 获取英文简介，并从文章图片中优先选校门、主楼或校园实景图；图片署名和授权链接见卡片。若无可用图，保留占位图。

更新美国增补学校时编辑 `src/additions.json`；更新其他地区学校时编辑 `src/international.json`，然后运行 `node src/merge-names.mjs`。发布文件为根目录的 `schools.json`。

地图瓦片来自 OpenStreetMap，交互组件来自 unpkg，校园简介和照片按需从 Wikipedia / Wikimedia 加载。因此访问网页时需要网络连接；地图和照片的可用性也受这些外部服务影响。
