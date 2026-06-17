#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 只扫描这些目录
const TARGET_DIRS = ['app', 'components'];

// 排除的文件或目录（跳过基础设施和 shadcn 自身）
const EXCLUDE_PATTERNS = [
  /\/components\/ui\//,      // shadcn/ui 组件定义文件
  /\/error\.tsx$/,
  /\/global-error\.tsx$/,
  /\/layout\.tsx$/,
  /\/loading\.tsx$/,
  /\/not-found\.tsx$/,
  /\/admin\/error\.tsx$/,
];

// 规则：每条返回问题描述数组
const rules = [
  {
    name: 'inline-style',
    check: (content, file) => {
      const matches = content.match(/style=\{\{[^}]*\}\}/g);
      return matches ? matches.map(m => `行内样式: ${m.trim().slice(0,80)}...`) : [];
    },
    suggestion: '使用 Tailwind 类替代行内 style'
  },
  {
    name: 'no-animation',
    check: (content, file) => {
      // 只检查包含交互元素的文件（页面、卡片、表单、对话框等）
      const hasInteractive =
        content.includes('<button') ||
        content.includes('<Link') ||
        content.includes('onClick') ||
        content.includes('<Card') ||
        content.includes('Dialog') ||
        content.includes('Popover');
      if (!hasInteractive) return [];
      // 检查是否已有动画
      if (!content.includes('framer-motion') && !content.includes('animate-')) {
        return ['未使用 framer-motion 或 Tailwind 动画类'];
      }
      return [];
    },
    suggestion: '为交互组件添加微交互：hover 效果、页面进入动画'
  },
  {
    name: 'missing-responsive',
    check: (content, file) => {
      // 只在包含布局且为页面级文件时检查
      if (!/(page|component|form|card|dialog)/i.test(file)) return [];
      const hasLayout = content.includes('flex') || content.includes('grid');
      const hasBreakpoint = /[a-z]+:/g.test(content); // 任意前缀都算
      if (hasLayout && !hasBreakpoint) {
        return ['布局使用了 flex/grid 但缺少响应式断点 (sm:/md:/lg:)'];
      }
      return [];
    },
    suggestion: '为布局添加 sm:, md:, lg: 等响应式断点'
  },
  {
    name: 'img-alt',
    check: (content, file) => {
      const imgTags = [...content.matchAll(/<img([^>]*)>/g)];
      return imgTags
        .filter(m => !m[1].includes('alt='))
        .map(m => `<img> 缺少 alt 属性: ${m[0].slice(0,80)}...`);
    },
    suggestion: '为图片添加 alt 属性提升可访问性'
  },
  {
    name: 'use-shadcn',
    check: (content, file) => {
      // 跳过 components/ui/ 目录本身
      if (/\/components\/ui\//.test(file)) return [];
      // 使用原生 button 但未导入 shadcn 的 Button
      if (content.includes('<button') && !content.includes('@/components/ui/button')) {
        return ['使用原生 <button>，建议替换为 shadcn/ui 的 Button 组件'];
      }
      return [];
    },
    suggestion: '用 shadcn/ui 组件替代原生 button/input'
  }
];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(p => p.test(filePath));
}

function scanDir(dir, fileList = []) {
  const fullPath = path.resolve(dir);
  if (!fs.existsSync(fullPath)) return fileList;
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      scanDir(entryPath, fileList);
    } else if (/\.(tsx|jsx)$/.test(entry.name) && !shouldExclude(entryPath)) {
      fileList.push(entryPath);
    }
  }
  return fileList;
}

function main() {
  const allFiles = TARGET_DIRS.flatMap(d => scanDir(d));
  const report = { issues: [], summary: {} };

  allFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      rules.forEach(rule => {
        const problems = rule.check(content, file);
        if (problems.length > 0) {
          report.issues.push({
            file,
            rule: rule.name,
            problems,
            suggestion: rule.suggestion
          });
        }
      });
    } catch (err) {
      report.issues.push({
        file,
        rule: 'read-error',
        problems: [`无法读取文件: ${err.message}`],
        suggestion: ''
      });
    }
  });

  const counts = {};
  report.issues.forEach(i => {
    counts[i.rule] = (counts[i.rule] || 0) + 1;
  });
  report.summary = {
    totalFiles: allFiles.length,
    totalIssues: report.issues.length,
    counts
  };

  console.log(JSON.stringify(report, null, 2));
  if (report.issues.length === 0) {
    console.log('✅ 前端美化检查通过！');
  }
}

main();