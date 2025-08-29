import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // 全局设置
      globals: true,
      environment: 'jsdom',
      
      // 设置文件
      setupFiles: [
        './src/test/setup.ts',
        './src/services/tests/setup.ts'
      ],
      
      // 测试文件匹配模式
      include: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/test/**/*.{ts,tsx}',
        'test/**/*.{test,spec}.{ts,tsx}',
      ],
      exclude: [
        'node_modules',
        'dist',
        'build',
        'coverage',
        'src/**/*.d.ts',
        'src/**/index.ts', // 通常只是导出文件
        'src/test/templates/**', // 排除模板文件
        'src/test/mocks/**/*.ts', // Mock文件本身不需要测试
      ],
      
      // 超时设置
      testTimeout: 10000, // 10秒
      hookTimeout: 10000,
      teardownTimeout: 5000,
      
      // 并发设置
      maxConcurrency: 5,
      minWorkers: 1,
      maxWorkers: 4,
      
      // 覆盖率配置
      coverage: {
        // 覆盖率提供商
        provider: 'v8',
        
        // 报告格式
        reporter: [
          'text',           // 控制台文本输出
          'text-summary',   // 控制台汇总
          'json',           // JSON格式，供CI使用
          'json-summary',   // JSON汇总
          'html',           // HTML报告
          'lcov',           // LCOV格式，供外部工具使用
          'cobertura',      // Cobertura格式，供Jenkins等使用
          'clover',         // Clover格式
        ],
        
        // 输出目录
        reportsDirectory: './coverage',
        
        // 包含的文件
        include: [
          'src/**/*.{ts,tsx}',
          '!src/**/*.d.ts',
          '!src/**/types/**',
          '!src/**/constants/**',
          '!src/**/config/**',
        ],
        
        // 排除的文件
        exclude: [
          // 系统文件
          'node_modules/',
          'dist/',
          'build/',
          'coverage/',
          
          // 测试相关文件
          'src/test/**',
          'src/**/*.test.{ts,tsx}',
          'src/**/*.spec.{ts,tsx}',
          'src/**/test/**',
          'src/**/tests/**',
          'src/**/__tests__/**',
          'src/**/__mocks__/**',
          
          // 配置文件
          'src/**/*.config.{ts,tsx}',
          'src/**/config.{ts,tsx}',
          'src/**/vite-env.d.ts',
          'src/main.tsx',
          
          // 索引文件（通常只包含导出）
          'src/**/index.{ts,tsx}',
          
          // 类型定义
          'src/**/*.d.ts',
          'src/**/types/**',
          
          // 常量文件（通常不需要测试）
          'src/**/constants/**',
          
          // 样式文件
          'src/**/*.{css,scss,sass,less}',
          
          // 资源文件
          'src/**/assets/**',
          
          // 模板和示例文件
          'src/**/templates/**',
          'src/**/examples/**',
          'src/**/demo/**',
          'src/**/docs/**',
          
          // 特定业务文件（根据需要调整）
          'src/styles/**',
          'src/assets/**',
          'src/public/**',
        ],
        
        // 覆盖率阈值
        thresholds: {
          global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
          },
          // 可以为特定文件设置不同的阈值
          'src/components/**/*.{ts,tsx}': {
            branches: 90,
            functions: 95,
            lines: 90,
            statements: 90,
          },
          'src/pages/**/*.{ts,tsx}': {
            branches: 85,
            functions: 90,
            lines: 85,
            statements: 85,
          },
          'src/hooks/**/*.{ts,tsx}': {
            branches: 95,
            functions: 100,
            lines: 95,
            statements: 95,
          },
          'src/services/**/*.{ts,tsx}': {
            branches: 95,
            functions: 100,
            lines: 95,
            statements: 95,
          },
          'src/utils/**/*.{ts,tsx}': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
          },
        },
        
        // 包含所有文件，即使没有测试
        all: true,
        
        // 跳过覆盖率检查的文件
        skipFull: false,
        
        // 清理之前的覆盖率报告
        clean: true,
        
        // 允许外部资源
        allowExternal: false,
        
        // 处理空行
        ignoreEmptyLines: true,
        
        // 100%覆盖率时的行为
        100: true,
      },
      
      // 监听模式设置
      watch: true,
      watchIgnore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/.git/**',
      ],
      
      // UI配置（如果使用 @vitest/ui）
      ui: true,
      
      // 开放端口
      api: {
        port: 51204,
        host: '0.0.0.0',
      },
      
      // 报告器配置
      reporters: [
        'default',
        'verbose',
        'json',
        'junit',
        'html',
      ],
      
      // 输出文件
      outputFile: {
        json: './coverage/test-results.json',
        junit: './coverage/test-results.xml',
        html: './coverage/test-results.html',
      },
      
      // 环境变量
      env: {
        NODE_ENV: 'test',
        VITE_APP_ENV: 'test',
        TZ: 'Asia/Shanghai',
      },
      
      // 序列化设置
      sequence: {
        concurrent: true,
        shuffle: false,
        hooks: 'parallel',
      },
      
      // 文件并行处理
      fileParallelism: true,
      
      // 隔离设置
      isolate: true,
      
      // 池选项
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: false,
          isolate: true,
        },
      },
      
      // 基准测试设置
      benchmark: {
        include: ['**/*.{bench,benchmark}.{ts,tsx}'],
        exclude: ['node_modules'],
        reporters: ['default'],
        outputFile: './coverage/benchmark-results.json',
      },
      
      // 浏览器测试设置（如果需要）
      // browser: {
      //   enabled: false,
      //   name: 'chromium',
      //   provider: 'playwright',
      //   headless: true,
      //   api: {
      //     port: 63315,
      //   },
      // },
      
      // 类型检查
      typecheck: {
        enabled: true,
        only: false,
        checker: 'tsc',
        include: ['**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist'],
      },
      
      // 依赖优化
      deps: {
        // 内联依赖
        inline: [
          // 所有测试工具
          '@testing-library/react',
          '@testing-library/jest-dom',
          '@testing-library/user-event',
          
          // 模拟相关
          'msw',
          '@faker-js/faker',
          
          // Antd相关
          'antd',
          '@ant-design/icons',
          '@ant-design/plots',
          
          // 其他可能需要内联的包
          'dayjs',
          'lodash-es',
        ],
        
        // 外部依赖
        external: [
          // 通常不需要外部依赖，但可以根据需要添加
        ],
        
        // 模块解析
        moduleDirectories: ['node_modules', 'src'],
        
        // 注册模块
        registerNodeLoader: true,
      },
      
      // 自定义匹配器
      expect: {
        // 可以在这里添加自定义匹配器
      },
      
      // 全局变量
      define: {
        __DEV__: true,
        __TEST__: true,
        'process.env.NODE_ENV': '"test"',
        'import.meta.env.MODE': '"test"',
      },
    },
  })
)