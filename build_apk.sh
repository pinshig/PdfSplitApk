#!/bin/bash

# 确保目录存在
mkdir -p build

# 安装EAS CLI
npm install -g eas-cli

# 登录Expo（需要用户提供Expo账户）
echo "请登录您的Expo账户。如果没有，可以在Expo网站上注册一个免费账户。"
eas login

# 配置项目
echo "配置项目以构建APK..."
eas build:configure

# 构建APK
echo "开始构建APK..."
eas build -p android --profile preview

echo "构建完成后，您可以从Expo控制台下载APK文件。"