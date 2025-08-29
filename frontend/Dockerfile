# 多阶段构建 Dockerfile for 好饭碗门店管理系统前端

# ============================================================================
# 阶段 1: 构建阶段 (Build Stage)
# ============================================================================
FROM node:18-alpine AS builder

# 设置构建标签
LABEL stage=builder
LABEL maintainer="好饭碗开发团队"
LABEL description="好饭碗门店生命周期管理系统前端构建镜像"

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

# 设置环境变量
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HUSKY=0

# 复制包管理文件
COPY package.json pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml* ./

# 复制 shared 包 (如果存在)
COPY shared/ ./shared/

# 复制前端源码和配置文件
COPY frontend/package.json ./frontend/
COPY frontend/pnpm-lock.yaml* ./frontend/
COPY frontend/tsconfig*.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/index.html ./frontend/
COPY frontend/.env* ./frontend/

# 安装依赖 (使用 pnpm 的高效缓存)
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --prefer-offline

# 复制前端源码
COPY frontend/src/ ./frontend/src/
COPY frontend/public/ ./frontend/public/

# 构建参数
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION="latest"
ARG VITE_APP_VERSION
ARG VITE_APP_ENVIRONMENT="production"

# 设置构建时环境变量
ENV VITE_APP_VERSION=${VITE_APP_VERSION:-$VCS_REF}
ENV VITE_APP_BUILD_DATE=${BUILD_DATE}
ENV VITE_APP_ENVIRONMENT=${VITE_APP_ENVIRONMENT}
ENV VITE_APP_COMMIT_SHA=${VCS_REF}

# 构建应用
RUN cd frontend && \
    pnpm run build && \
    # 清理构建缓存
    pnpm store prune && \
    # 验证构建产物
    ls -la dist/ && \
    du -sh dist/

# ============================================================================
# 阶段 2: 生产阶段 (Production Stage)
# ============================================================================
FROM nginx:1.25-alpine AS production

# 设置生产标签
LABEL maintainer="好饭碗开发团队"
LABEL description="好饭碗门店生命周期管理系统前端生产镜像"
LABEL version=${VERSION}
LABEL build-date=${BUILD_DATE}
LABEL vcs-ref=${VCS_REF}

# 安装额外工具
RUN apk add --no-cache \
    curl \
    jq \
    tzdata && \
    # 设置时区为中国
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 创建非 root 用户
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# 创建必要的目录
RUN mkdir -p /var/log/nginx /var/run/nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx /var/run/nginx /var/cache/nginx

# 复制 Nginx 配置
COPY frontend/docker/nginx.conf /etc/nginx/nginx.conf
COPY frontend/docker/default.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder --chown=nginx:nginx /app/frontend/dist /usr/share/nginx/html

# 复制健康检查和启动脚本
COPY frontend/docker/healthcheck.sh /usr/local/bin/healthcheck.sh
COPY frontend/docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# 设置脚本权限
RUN chmod +x /usr/local/bin/healthcheck.sh /usr/local/bin/entrypoint.sh

# 创建配置文件模板
RUN echo '{"version":"'${VITE_APP_VERSION}'","buildDate":"'${BUILD_DATE}'","environment":"'${VITE_APP_ENVIRONMENT}'"}' \
    > /usr/share/nginx/html/version.json

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# 设置用户
USER nginx

# 启动命令
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# ============================================================================
# 开发阶段 (Development Stage) - 可选
# ============================================================================
FROM node:18-alpine AS development

LABEL stage=development

WORKDIR /app

# 安装开发依赖
RUN npm install -g pnpm@8.15.0

# 复制包管理文件
COPY package.json pnpm-lock.yaml* ./
COPY frontend/package.json ./frontend/

# 安装依赖
RUN pnpm install

# 复制源码
COPY . .

# 暴露开发端口
EXPOSE 7800

# 开发启动命令
CMD ["pnpm", "--filter", "@mendian/frontend", "dev", "--host", "0.0.0.0", "--port", "7800"]