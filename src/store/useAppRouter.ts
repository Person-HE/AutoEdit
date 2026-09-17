import { create } from 'zustand';

export type AppPage = 'editor' | 'director';

interface AppRouterState {
  currentPage: AppPage;
  /** 从 director 生成完成后回到编辑器时携带的项目跳转标记 */
  directorReturnPayload?: {
    projectId?: string;
    clipIds?: string[];
  };
  setPage: (page: AppPage) => void;
  goToEditor: (payload?: { projectId?: string; clipIds?: string[] }) => void;
  goToDirector: () => void;
  clearPayload: () => void;
}

function readPageFromHash(): AppPage {
  if (typeof window === 'undefined') return 'editor';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return hash === 'director' ? 'director' : 'editor';
}

function writePageToHash(page: AppPage): void {
  if (typeof window === 'undefined') return;
  const target = page === 'director' ? '#/director' : '#/editor';
  if (window.location.hash !== target) {
    window.history.pushState(null, '', target);
  }
}

// 初始化时从 hash 读取，确保刷新/直接访问 URL 时状态正确
const initialPage = readPageFromHash();

export const useAppRouter = create<AppRouterState>((set) => ({
  currentPage: initialPage,
  setPage: (page) => {
    writePageToHash(page);
    set({ currentPage: page });
  },
  goToEditor: (payload) => {
    writePageToHash('editor');
    set({ currentPage: 'editor', directorReturnPayload: payload });
  },
  goToDirector: () => {
    writePageToHash('director');
    set({ currentPage: 'director' });
  },
  clearPayload: () => set({ directorReturnPayload: undefined }),
}));

// 监听浏览器前进/后退
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const page = readPageFromHash();
    const current = useAppRouter.getState().currentPage;
    if (page !== current) {
      useAppRouter.setState({ currentPage: page });
    }
  });
}
