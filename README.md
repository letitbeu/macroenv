# Daily Market Overview

一个仿 Bloomberg/Avenir 市场概览页的 Vercel 小项目。打开页面即自动抓取最新数据，并计算：

- 5Day：相对 5 个交易日前
- MTD：月初至今
- YTD：年初至今
- 利率、信用利差、曲线：变化单位为 bp
- 股指、外汇、商品、加密：变化单位为 %

## 数据源

- FRED：美国国债收益率、信用利差、EFFR、10Y实际利率、10Y盈亏平衡通胀
- Yahoo Finance：全球股指、外汇、商品、BTC/ETH/SOL

## Vercel 部署

1. 把整个目录上传到 GitHub 仓库根目录。
2. Vercel -> Add New Project -> Import Git Repository。
3. Framework Preset 选 Other。
4. 不需要环境变量，不需要 Build Command。
5. Deploy。

部署后，每次打开页面都会刷新；API 有 10 分钟缓存，避免被公共数据源限流。

## 注意

- 不同市场时区和节假日不同，因此“Latest”日期可能不完全一致。
- FRED 部分序列存在 1 个交易日左右发布时间滞后。
- Yahoo/FRED 属于研究与展示用途的数据源；若用于商业行情产品，建议替换成 Bloomberg/Refinitiv/ICE/Polygon 等持牌数据。
