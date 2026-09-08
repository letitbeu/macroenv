# Market Overview Heatmap

严格按参考图布局制作的每日市场概览热力表，不增加额外模块。

## 页面

- `/`：中文版
- `/zh`：中文版
- `/en`：英文版

## 表格结构

左侧：US Treasury / Curvature / Credit Spread / DM Rates / Commodity

右侧：Equity / Currency

每行展示：Latest、5Day、MTD、YTD。上涨为绿色，下跌为红色；负值使用括号显示，视觉结构与参考图保持一致。

## 数据

- FRED：美国国债、信用利差及部分发达市场利率
- Yahoo Finance：全球股指、外汇、商品、BTC / ETH / SOL
- 日本财务省：日本 20 年期国债收益率

页面打开时自动请求最新数据；Vercel API 设置 10 分钟缓存。
