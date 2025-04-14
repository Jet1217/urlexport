# 部署到Render指南

本文档介绍如何将网站导出服务部署到Render平台。

## 先决条件

- [Render](https://render.com)账户
- 项目代码存储在Git仓库（GitHub、GitLab等）

## 部署步骤

### 方法一：使用Blueprint（推荐）

1. 登录[Render控制台](https://dashboard.render.com/)
2. 点击顶部导航栏的"New" > "Blueprint"
3. 连接包含项目代码的Git仓库
4. Render会自动检测`render.yaml`文件并创建所需的服务
5. 检查配置并点击"Apply"开始部署

### 方法二：手动创建Web服务

1. 登录[Render控制台](https://dashboard.render.com/)
2. 点击顶部导航栏的"New" > "Web Service"
3. 连接包含项目代码的Git仓库
4. 配置以下设置：
   - **名称**: `pdfexport`（或您喜欢的名称）
   - **环境**: `Docker`
   - **分支**: `main`（或您的主分支）
   - **计划**: 至少选择`Starter`（由于Puppeteer需要足够的资源）
   - **高级** > **Health Check Path**: `/health`
5. 点击"Create Web Service"开始部署

## 环境变量

Docker环境已经配置了以下环境变量：

- `NODE_ENV=production`
- `PORT=3000`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

## 监控和故障排除

1. 部署完成后，您可以通过Render提供的URL访问服务
2. 访问`/health`端点确认服务正常运行
3. 如果遇到问题，可以在Render控制台查看日志

## 性能注意事项

- Puppeteer和Chrome需要大量内存，建议至少使用`Starter`计划
- 对于高流量网站，考虑增加实例数量或升级计划
- 长时间运行的任务可能需要更高的超时设置

## 安全配置

- 服务已配置为使用HTTPS（Render自动提供）
- CORS已启用，默认允许所有来源
- 已使用Helmet增强安全性，但禁用了CSP以允许PDF导出功能 