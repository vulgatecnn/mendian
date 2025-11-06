/**
 * 路由工具函数
 */

/**
 * 检测是否为移动端环境
 * 简化逻辑：仅根据 URL 路径判断，不做自动检测
 */
export const isMobileEnvironment = (): boolean => {
  // 只根据 URL 路径判断
  // /mobile 开头的路径 = 移动端
  // /pc 开头的路径 = PC端
  return window.location.pathname.startsWith('/mobile');
};

/**
 * 检测是否为企业微信环境
 */
export const isWeChatWorkEnvironment = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /wxwork/.test(userAgent);
};

/**
 * 检测是否为移动设备
 */
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /mobile|android|iphone|ipad|phone|blackberry|opera mini|iemobile|wpdesktop/.test(userAgent);
};

/**
 * 检测屏幕是否为移动端尺寸
 */
export const isMobileScreen = (): boolean => {
  return window.innerWidth <= 768;
};

/**
 * PC端路由转换为移动端路由
 */
export const convertPCRouteToMobile = (pcRoute: string): string => {
  // 移除开头的斜杠
  const cleanRoute = pcRoute.startsWith('/') ? pcRoute.slice(1) : pcRoute;
  
  // 路由映射规则
  const routeMap: Record<string, string> = {
    '': 'home',
    'login': 'login',
    'profile': 'profile',
    'messages': 'messages',
    'store-expansion/locations': 'expansion/locations',
    'store-expansion/follow-ups': 'expansion/follow-ups',
    'store-preparation/construction': 'preparation/construction',
    'approval/pending': 'approvals/pending',
    'approval/processed': 'approvals/processed',
    'approval/initiated': 'approvals/initiated',
  };
  
  // 查找映射规则
  const mobileRoute = routeMap[cleanRoute];
  if (mobileRoute) {
    return `/mobile/${mobileRoute}`;
  }
  
  // 默认重定向到移动端首页
  return '/mobile/home';
};

/**
 * 移动端路由转换为PC端路由
 */
export const convertMobileRouteToPC = (mobileRoute: string): string => {
  // 移除 /mobile 前缀
  const cleanRoute = mobileRoute.replace(/^\/mobile\/?/, '');
  
  // 路由映射规则
  const routeMap: Record<string, string> = {
    '': '/',
    'home': '/',
    'login': '/login',
    'profile': '/profile',
    'messages': '/messages',
    'expansion/locations': '/store-expansion/locations',
    'expansion/follow-ups': '/store-expansion/follow-ups',
    'preparation/construction': '/store-preparation/construction',
    'approvals/pending': '/approval/pending',
    'approvals/processed': '/approval/processed',
    'approvals/initiated': '/approval/initiated',
  };
  
  // 查找映射规则
  const pcRoute = routeMap[cleanRoute];
  if (pcRoute) {
    return pcRoute;
  }
  
  // 默认重定向到PC端首页
  return '/';
};

/**
 * 获取当前平台的首页路由
 */
export const getHomeRoute = (): string => {
  return isMobileEnvironment() ? '/mobile/home' : '/';
};

/**
 * 获取当前平台的登录路由
 */
export const getLoginRoute = (): string => {
  return isMobileEnvironment() ? '/mobile/login' : '/login';
};

/**
 * 获取当前平台的个人中心路由
 */
export const getProfileRoute = (): string => {
  return isMobileEnvironment() ? '/mobile/profile' : '/profile';
};

/**
 * 获取当前平台的消息中心路由
 */
export const getMessagesRoute = (): string => {
  return isMobileEnvironment() ? '/mobile/messages' : '/messages';
};

/**
 * 智能路由跳转
 * 根据当前平台自动选择合适的路由
 */
export const smartNavigate = (route: string): string => {
  const isMobile = isMobileEnvironment();
  
  // 如果已经是对应平台的路由，直接返回
  if (isMobile && route.startsWith('/mobile')) {
    return route;
  }
  if (!isMobile && !route.startsWith('/mobile')) {
    return route;
  }
  
  // 转换路由
  if (isMobile && !route.startsWith('/mobile')) {
    return convertPCRouteToMobile(route);
  }
  if (!isMobile && route.startsWith('/mobile')) {
    return convertMobileRouteToPC(route);
  }
  
  return route;
};

/**
 * 检查路由是否需要重定向
 */
export const shouldRedirectRoute = (currentRoute: string): boolean => {
  const isMobile = isMobileEnvironment();
  
  // 移动端环境访问PC端路由需要重定向
  if (isMobile && !currentRoute.startsWith('/mobile')) {
    return true;
  }
  
  // PC端环境访问移动端路由不需要重定向（允许PC端访问移动端页面）
  return false;
};

/**
 * 获取重定向后的路由
 */
export const getRedirectRoute = (currentRoute: string): string => {
  if (shouldRedirectRoute(currentRoute)) {
    return smartNavigate(currentRoute);
  }
  return currentRoute;
};

/**
 * 平台信息
 */
export interface PlatformInfo {
  isMobile: boolean;
  isWeChatWork: boolean;
  isMobileDevice: boolean;
  isMobileScreen: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}

/**
 * 获取当前平台信息
 */
export const getPlatformInfo = (): PlatformInfo => {
  return {
    isMobile: isMobileEnvironment(),
    isWeChatWork: isWeChatWorkEnvironment(),
    isMobileDevice: isMobileDevice(),
    isMobileScreen: isMobileScreen(),
    userAgent: navigator.userAgent,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  };
};

/**
 * 调试用：打印平台信息
 */
export const debugPlatformInfo = (): void => {
  const info = getPlatformInfo();
  console.group('Platform Info');
  console.log('Is Mobile Environment:', info.isMobile);
  console.log('Is WeChat Work:', info.isWeChatWork);
  console.log('Is Mobile Device:', info.isMobileDevice);
  console.log('Is Mobile Screen:', info.isMobileScreen);
  console.log('User Agent:', info.userAgent);
  console.log('Screen Size:', `${info.screenWidth}x${info.screenHeight}`);
  console.log('Current Route:', window.location.pathname);
  console.groupEnd();
};