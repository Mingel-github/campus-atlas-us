# Campus Atlas

[在线打开地图](https://mingel-github.github.io/campus-atlas-us/)

一个静态网页：在二维地图上浏览 228 所大学，包括 208 所美国大学，以及英国 7 所、香港 5 所、新加坡 2 所、澳洲 6 所。美国学校沿用 2027 U.S. News National Universities 综合排名和筛选；其他地区学校的地图数字与卡片使用 QS 2027 综合排名。支持地区切换、中英文校名搜索、点位聚合、校园照片、学校卡片、官网和地图路线链接。国际学校只作为计算机硕士择校时的学校级补充，不逐一收录项目。

## 本地运行

运行预览服务器：

```sh
node preview.mjs
```

打开 `http://localhost:4173/`。仓库根目录就是静态站点，可直接用 GitHub Pages 从 `main` 分支的 `/ (root)` 发布，无需安装包或编译。

## 数据

- 前 100 名次：[PrepsReview 的 2027 年整理表](https://www.prepsreview.com/us-university-rankings.html)，其页面列明 U.S. News 与交叉核对来源。新增学校的 2027 综合排名参照 [XuanXiao 的完整列表](https://xuanxiao.org/en/rankings/usnews/regional/national-universities)。此站为独立工具，不代表 U.S. News；新增名单也不是计算机专业排名。
- QS 排名：[QS 2027 官方列表](https://www.topuniversities.com/qs-top-uni-wur)。美国学校仅在查得到时于卡片中以小字补充；英国、港新澳学校以 QS 综合排名为主。QS 综合排名不是计算机学科排名。
- 点位、城市、学校官网：从 [IPEDS / College Scorecard 衍生的开源坐标表](https://github.com/ryan-serpico/us-college-coordinates)匹配。该表采集于 2023 年；12 所存在校名或校区差异的院校按 UNITID 明确匹配至主校区。
- 英国、港新澳学校、坐标与官网见 `src/international.json`；英国首批学校参考 [QS 英国前列](https://www.topuniversities.com/university-rankings-articles/world-university-rankings/top-universities-uk)和各校计算机方向硕士页面，例如 [帝国理工 Advanced Computing](https://www.imperial.ac.uk/study/courses/postgraduate-taught/advanced-computing/)、[牛津 Advanced Computer Science](https://www.ox.ac.uk/admissions/graduate/courses/msc-advanced-computer-science)、[UCL Machine Learning](https://www.ucl.ac.uk/prospective-students/graduate/taught/degrees/machine-learning-msc)。具体项目与申请条件以学校官网为准。
- 学校卡片点击时从 Wikipedia 获取英文简介，并从文章图片中优先选校门、主楼或校园实景图；图片署名和授权链接见卡片。若无可用图，保留占位图。

更新美国增补学校时编辑 `src/additions.json`；更新其他地区学校时编辑 `src/international.json`，然后运行 `node src/merge-names.mjs`。发布文件为根目录的 `schools.json`。

地图瓦片来自 OpenStreetMap，交互组件来自 unpkg，校园简介和照片按需从 Wikipedia / Wikimedia 加载。因此访问网页时需要网络连接；地图和照片的可用性也受这些外部服务影响。
