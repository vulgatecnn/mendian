#!/usr/bin/env node

/**
 * Advanced Test Coverage Script
 * 
 * This script provides comprehensive test coverage analysis and reporting.
 * Features:
 * - Multiple coverage thresholds
 * - Detailed coverage reports
 * - Coverage comparison
 * - CI integration
 * - Performance monitoring
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const COVERAGE_CONFIG = {
  // Coverage thresholds for different file types
  thresholds: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
    components: { branches: 90, functions: 95, lines: 90, statements: 90 },
    pages: { branches: 85, functions: 90, lines: 85, statements: 85 },
    hooks: { branches: 95, functions: 100, lines: 95, statements: 95 },
    services: { branches: 95, functions: 100, lines: 95, statements: 95 },
    utils: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
  
  // Paths for different coverage reports
  paths: {
    coverage: './coverage',
    reports: './coverage/reports',
    history: './coverage/history',
    json: './coverage/coverage-final.json',
    lcov: './coverage/lcov.info',
    html: './coverage/lcov-report',
  },
  
  // CI configuration
  ci: {
    enabled: process.env.CI === 'true',
    failOnThreshold: process.env.FAIL_ON_COVERAGE_THRESHOLD !== 'false',
    uploadToCodecov: process.env.UPLOAD_TO_CODECOV === 'true',
    uploadToCoveralls: process.env.UPLOAD_TO_COVERALLS === 'true',
  },
  
  // Performance monitoring
  performance: {
    enabled: true,
    maxTestTime: 300000, // 5 minutes max
    slowTestThreshold: 5000, // 5 seconds
  }
};

// Utility functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '🔍',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🐛'
  }[level];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, 'debug');
  }
};

const readJsonFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    log(`Error reading JSON file ${filePath}: ${error.message}`, 'warning');
  }
  return null;
};

const writeJsonFile = (filePath, data) => {
  try {
    ensureDirectory(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    log(`Written JSON file: ${filePath}`, 'debug');
  } catch (error) {
    log(`Error writing JSON file ${filePath}: ${error.message}`, 'error');
  }
};

// Coverage analysis functions
const analyzeCoverage = (coverageData) => {
  const analysis = {
    total: {
      files: 0,
      statements: { covered: 0, total: 0, pct: 0 },
      branches: { covered: 0, total: 0, pct: 0 },
      functions: { covered: 0, total: 0, pct: 0 },
      lines: { covered: 0, total: 0, pct: 0 }
    },
    byCategory: {},
    uncoveredFiles: [],
    lowCoverageFiles: [],
    performanceIssues: []
  };

  if (!coverageData) {
    log('No coverage data available', 'warning');
    return analysis;
  }

  // Categorize files and calculate coverage
  Object.entries(coverageData).forEach(([filePath, data]) => {
    if (filePath.startsWith('src/')) {
      analysis.total.files++;
      
      // Update totals
      analysis.total.statements.covered += data.s ? Object.values(data.s).filter(v => v > 0).length : 0;
      analysis.total.statements.total += data.s ? Object.keys(data.s).length : 0;
      analysis.total.branches.covered += data.b ? data.b.filter(branch => branch.every(v => v > 0)).length : 0;
      analysis.total.branches.total += data.b ? data.b.length : 0;
      analysis.total.functions.covered += data.f ? Object.values(data.f).filter(v => v > 0).length : 0;
      analysis.total.functions.total += data.f ? Object.keys(data.f).length : 0;
      
      // Determine category
      let category = 'other';
      if (filePath.includes('/components/')) category = 'components';
      else if (filePath.includes('/pages/')) category = 'pages';
      else if (filePath.includes('/hooks/')) category = 'hooks';
      else if (filePath.includes('/services/')) category = 'services';
      else if (filePath.includes('/utils/')) category = 'utils';
      
      if (!analysis.byCategory[category]) {
        analysis.byCategory[category] = {
          files: 0,
          statements: { covered: 0, total: 0 },
          branches: { covered: 0, total: 0 },
          functions: { covered: 0, total: 0 },
          lines: { covered: 0, total: 0 }
        };
      }
      
      analysis.byCategory[category].files++;
      
      // Check for uncovered files
      const hasStatements = data.s && Object.keys(data.s).length > 0;
      const statementsPercent = hasStatements 
        ? (Object.values(data.s).filter(v => v > 0).length / Object.keys(data.s).length) * 100 
        : 0;
      
      if (statementsPercent === 0) {
        analysis.uncoveredFiles.push(filePath);
      } else if (statementsPercent < COVERAGE_CONFIG.thresholds.global.statements) {
        analysis.lowCoverageFiles.push({
          file: filePath,
          coverage: statementsPercent
        });
      }
    }
  });

  // Calculate percentages
  analysis.total.statements.pct = analysis.total.statements.total > 0 
    ? (analysis.total.statements.covered / analysis.total.statements.total) * 100 
    : 0;
  analysis.total.branches.pct = analysis.total.branches.total > 0 
    ? (analysis.total.branches.covered / analysis.total.branches.total) * 100 
    : 0;
  analysis.total.functions.pct = analysis.total.functions.total > 0 
    ? (analysis.total.functions.covered / analysis.total.functions.total) * 100 
    : 0;

  return analysis;
};

const generateCoverageReport = (analysis, testResults) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: analysis.total.files,
      coveragePercent: analysis.total.statements.pct.toFixed(2),
      thresholdsMet: analysis.total.statements.pct >= COVERAGE_CONFIG.thresholds.global.statements,
      testsPassed: testResults ? testResults.success : false,
      testDuration: testResults ? testResults.duration : 0
    },
    coverage: analysis.total,
    byCategory: analysis.byCategory,
    issues: {
      uncoveredFiles: analysis.uncoveredFiles,
      lowCoverageFiles: analysis.lowCoverageFiles.sort((a, b) => a.coverage - b.coverage),
      performanceIssues: analysis.performanceIssues
    }
  };

  return report;
};

const compareCoverage = (currentReport, previousReport) => {
  if (!previousReport) {
    return { isFirst: true };
  }

  const comparison = {
    files: {
      current: currentReport.summary.totalFiles,
      previous: previousReport.summary.totalFiles,
      change: currentReport.summary.totalFiles - previousReport.summary.totalFiles
    },
    coverage: {
      current: parseFloat(currentReport.summary.coveragePercent),
      previous: parseFloat(previousReport.summary.coveragePercent),
      change: parseFloat(currentReport.summary.coveragePercent) - parseFloat(previousReport.summary.coveragePercent)
    },
    improved: [],
    regressed: []
  };

  // Compare by category
  Object.keys(currentReport.byCategory).forEach(category => {
    const current = currentReport.byCategory[category];
    const previous = previousReport.byCategory && previousReport.byCategory[category];
    
    if (previous) {
      const currentPct = current.statements.total > 0 
        ? (current.statements.covered / current.statements.total) * 100 
        : 0;
      const previousPct = previous.statements.total > 0 
        ? (previous.statements.covered / previous.statements.total) * 100 
        : 0;
      
      if (currentPct > previousPct) {
        comparison.improved.push({ category, change: currentPct - previousPct });
      } else if (currentPct < previousPct) {
        comparison.regressed.push({ category, change: previousPct - currentPct });
      }
    }
  });

  return comparison;
};

// Test execution functions
const runTests = async (options = {}) => {
  const startTime = Date.now();
  
  log('Starting test execution...', 'info');
  
  const vitestArgs = [
    'run',
    '--coverage',
    '--reporter=verbose',
    '--reporter=json',
    '--reporter=junit',
    ...(options.config ? [`--config=${options.config}`] : []),
    ...(options.watch ? ['--watch'] : []),
    ...(options.ui ? ['--ui'] : []),
    ...(COVERAGE_CONFIG.ci.enabled ? ['--reporter=github-actions'] : [])
  ];

  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['vitest', ...vitestArgs], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';

    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    // Timeout handling
    const timeout = setTimeout(() => {
      log(`Test execution timeout after ${COVERAGE_CONFIG.performance.maxTestTime}ms`, 'error');
      testProcess.kill('SIGTERM');
      reject(new Error('Test execution timeout'));
    }, COVERAGE_CONFIG.performance.maxTestTime);

    testProcess.on('close', (code) => {
      clearTimeout(timeout);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        success: code === 0,
        duration,
        code,
        stdout,
        stderr
      };

      if (duration > COVERAGE_CONFIG.performance.slowTestThreshold) {
        log(`Test suite completed in ${duration}ms (slower than ${COVERAGE_CONFIG.performance.slowTestThreshold}ms threshold)`, 'warning');
      } else {
        log(`Test suite completed in ${duration}ms`, 'success');
      }

      resolve(result);
    });

    testProcess.on('error', (error) => {
      clearTimeout(timeout);
      log(`Test execution error: ${error.message}`, 'error');
      reject(error);
    });
  });
};

// Coverage processing functions
const processCoverageResults = () => {
  log('Processing coverage results...', 'info');
  
  // Read coverage data
  const coverageData = readJsonFile(COVERAGE_CONFIG.paths.json);
  if (!coverageData) {
    log('No coverage data found', 'error');
    return null;
  }

  // Analyze coverage
  const analysis = analyzeCoverage(coverageData);
  
  // Read test results
  const testResults = readJsonFile('./coverage/test-results.json');
  
  // Generate report
  const currentReport = generateCoverageReport(analysis, testResults);
  
  // Save current report
  const historyDir = COVERAGE_CONFIG.paths.history;
  ensureDirectory(historyDir);
  
  const reportPath = path.join(historyDir, `coverage-${Date.now()}.json`);
  writeJsonFile(reportPath, currentReport);
  
  // Compare with previous report
  const previousReports = fs.readdirSync(historyDir)
    .filter(file => file.startsWith('coverage-') && file.endsWith('.json'))
    .sort()
    .slice(-2);
  
  let comparison = null;
  if (previousReports.length > 1) {
    const previousReport = readJsonFile(path.join(historyDir, previousReports[0]));
    comparison = compareCoverage(currentReport, previousReport);
  }

  return { currentReport, comparison, analysis };
};

const generateHtmlReport = () => {
  log('Generating HTML coverage report...', 'info');
  
  try {
    execSync('npx c8 report --reporter=html --reports-dir=./coverage/html-report', {
      stdio: 'inherit'
    });
    log('HTML coverage report generated successfully', 'success');
  } catch (error) {
    log(`Failed to generate HTML report: ${error.message}`, 'error');
  }
};

const generateBadges = (report) => {
  const coveragePercent = parseFloat(report.summary.coveragePercent);
  const color = coveragePercent >= 90 ? 'brightgreen' 
              : coveragePercent >= 80 ? 'yellow' 
              : coveragePercent >= 70 ? 'orange' 
              : 'red';
  
  const badgeData = {
    schemaVersion: 1,
    label: 'coverage',
    message: `${coveragePercent.toFixed(1)}%`,
    color
  };

  writeJsonFile('./coverage/coverage-badge.json', badgeData);
  log('Coverage badge data generated', 'success');
};

// CI/CD integration functions
const uploadToCoverage = async () => {
  if (!COVERAGE_CONFIG.ci.enabled) return;

  // Upload to Codecov
  if (COVERAGE_CONFIG.ci.uploadToCodecov) {
    log('Uploading coverage to Codecov...', 'info');
    try {
      execSync('npx codecov', { stdio: 'inherit' });
      log('Coverage uploaded to Codecov successfully', 'success');
    } catch (error) {
      log(`Failed to upload to Codecov: ${error.message}`, 'warning');
    }
  }

  // Upload to Coveralls
  if (COVERAGE_CONFIG.ci.uploadToCoveralls) {
    log('Uploading coverage to Coveralls...', 'info');
    try {
      execSync('npx coveralls < ./coverage/lcov.info', { stdio: 'inherit' });
      log('Coverage uploaded to Coveralls successfully', 'success');
    } catch (error) {
      log(`Failed to upload to Coveralls: ${error.message}`, 'warning');
    }
  }
};

const checkCoverageThresholds = (report) => {
  const issues = [];
  const coveragePercent = parseFloat(report.summary.coveragePercent);
  
  if (coveragePercent < COVERAGE_CONFIG.thresholds.global.statements) {
    issues.push(`Global coverage ${coveragePercent.toFixed(2)}% is below threshold ${COVERAGE_CONFIG.thresholds.global.statements}%`);
  }

  // Check category-specific thresholds
  Object.entries(report.byCategory).forEach(([category, data]) => {
    const threshold = COVERAGE_CONFIG.thresholds[category];
    if (threshold && data.statements.total > 0) {
      const pct = (data.statements.covered / data.statements.total) * 100;
      if (pct < threshold.statements) {
        issues.push(`${category} coverage ${pct.toFixed(2)}% is below threshold ${threshold.statements}%`);
      }
    }
  });

  return issues;
};

// Report generation functions
const printCoverageSummary = (report, comparison) => {
  console.log('\n📊 Coverage Summary');
  console.log('='.repeat(50));
  console.log(`Total Files: ${report.summary.totalFiles}`);
  console.log(`Coverage: ${report.summary.coveragePercent}%`);
  console.log(`Thresholds Met: ${report.summary.thresholdsMet ? '✅' : '❌'}`);
  console.log(`Test Duration: ${report.summary.testDuration}ms`);

  if (comparison && !comparison.isFirst) {
    console.log(`\n📈 Coverage Changes:`);
    console.log(`Files: ${comparison.files.change >= 0 ? '+' : ''}${comparison.files.change}`);
    console.log(`Coverage: ${comparison.coverage.change >= 0 ? '+' : ''}${comparison.coverage.change.toFixed(2)}%`);
    
    if (comparison.improved.length > 0) {
      console.log(`✅ Improved: ${comparison.improved.map(i => `${i.category} (+${i.change.toFixed(2)}%)`).join(', ')}`);
    }
    
    if (comparison.regressed.length > 0) {
      console.log(`❌ Regressed: ${comparison.regressed.map(i => `${i.category} (-${i.change.toFixed(2)}%)`).join(', ')}`);
    }
  }

  // Show issues
  if (report.issues.uncoveredFiles.length > 0) {
    console.log(`\n⚠️ Uncovered Files (${report.issues.uncoveredFiles.length}):`);
    report.issues.uncoveredFiles.slice(0, 10).forEach(file => {
      console.log(`  - ${file}`);
    });
    if (report.issues.uncoveredFiles.length > 10) {
      console.log(`  ... and ${report.issues.uncoveredFiles.length - 10} more`);
    }
  }

  if (report.issues.lowCoverageFiles.length > 0) {
    console.log(`\n⚠️ Low Coverage Files (${report.issues.lowCoverageFiles.length}):`);
    report.issues.lowCoverageFiles.slice(0, 10).forEach(({ file, coverage }) => {
      console.log(`  - ${file} (${coverage.toFixed(2)}%)`);
    });
    if (report.issues.lowCoverageFiles.length > 10) {
      console.log(`  ... and ${report.issues.lowCoverageFiles.length - 10} more`);
    }
  }

  console.log('\n');
};

const saveDetailedReport = (report, comparison, analysis) => {
  const detailedReport = {
    ...report,
    comparison,
    analysis,
    environment: {
      ci: COVERAGE_CONFIG.ci.enabled,
      node: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    }
  };

  writeJsonFile('./coverage/detailed-report.json', detailedReport);
  log('Detailed coverage report saved', 'success');
};

// Main execution function
const main = async () => {
  try {
    log('Starting comprehensive test coverage analysis', 'info');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
      watch: args.includes('--watch'),
      ui: args.includes('--ui'),
      config: args.find(arg => arg.startsWith('--config='))?.split('=')[1]
    };

    // Run tests with coverage
    const testResults = await runTests(options);
    
    if (!testResults.success && COVERAGE_CONFIG.ci.failOnThreshold) {
      log('Tests failed - aborting coverage analysis', 'error');
      process.exit(1);
    }

    // Process coverage results
    const { currentReport, comparison, analysis } = processCoverageResults() || {};
    
    if (!currentReport) {
      log('Failed to process coverage results', 'error');
      process.exit(1);
    }

    // Check coverage thresholds
    const thresholdIssues = checkCoverageThresholds(currentReport);
    if (thresholdIssues.length > 0 && COVERAGE_CONFIG.ci.failOnThreshold) {
      log('Coverage threshold issues found:', 'error');
      thresholdIssues.forEach(issue => log(issue, 'error'));
      
      if (COVERAGE_CONFIG.ci.enabled) {
        process.exit(1);
      }
    }

    // Generate reports
    generateHtmlReport();
    generateBadges(currentReport);
    saveDetailedReport(currentReport, comparison, analysis);
    
    // Print summary
    printCoverageSummary(currentReport, comparison);
    
    // Upload coverage data
    await uploadToCoverage();
    
    log('Coverage analysis completed successfully', 'success');
    
  } catch (error) {
    log(`Coverage analysis failed: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
};

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = {
  COVERAGE_CONFIG,
  analyzeCoverage,
  generateCoverageReport,
  runTests,
  main
};