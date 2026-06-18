// /**
//  * NotificationContext
//  *
//  * Provides real-time notifications via SignalR + REST API.
//  *
//  * Usage:
//  *   // Wrap your app (inside AuthProvider):
//  *   <NotificationProvider>
//  *     <App />
//  *   </NotificationProvider>
//  *
//  *   // Consume anywhere:
//  *   const { unreadCount, notifications, markAsRead, loadMore } = useNotifications();
//  *
//  * SignalR connection lifecycle:
//  *   - Connects when the user is authenticated
//  *   - Disconnects on logout / unmount
//  *   - Automatically reconnects on transient failures
//  *
//  * Dependencies:
//  *   npm install @microsoft/signalr
//  */

// import {
//     createContext,
//     useCallback,
//     useContext,
//     useEffect,
//     useRef,
//     useState,
// } from 'react';
// import type { ReactNode } from 'react';
// import * as signalR from '@microsoft/signalr';
// import { useAuth } from './AuthContext';
// import {
//     getUserNotifications,
//     getUnreadCount,
//     markNotificationAsRead,
// } from '../services/notificationService';
// import type { NotificationDto } from '../services/notificationService';

// // ── Constants ─────────────────────────────────────────────────────────────────

// const HUB_URL = `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/hubs/notifications`;
// const PAGE_SIZE = 20;

// // ── Context shape ─────────────────────────────────────────────────────────────

// interface NotificationContextType {
//     /** All notifications fetched so far (newest-first) */
//     notifications: NotificationDto[];
//     /** Number of unread notifications */
//     unreadCount: number;
//     /** True while the first page is loading */
//     isLoading: boolean;
//     /** True while a subsequent page is being fetched */
//     isLoadingMore: boolean;
//     /** Whether there are more pages to load */
//     hasMore: boolean;
//     /** SignalR connection status */
//     connectionStatus: 'connected' | 'connecting' | 'disconnected';
//     /** Mark a notification as read (optimistic + API) */
//     markAsRead: (id: string) => Promise<void>;
//     /** Mark all currently loaded notifications as read */
//     markAllAsRead: () => Promise<void>;
//     /** Load the next page of notifications */
//     loadMore: () => Promise<void>;
//     /** Re-fetch unread count from server */
//     refreshUnreadCount: () => Promise<void>;
// }

// // ── Context ───────────────────────────────────────────────────────────────────

// const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// // ── Provider ──────────────────────────────────────────────────────────────────

// export function NotificationProvider({ children }: { children: ReactNode }) {
//     const { isAuthenticated, isLoading: authLoading } = useAuth();

//     const [notifications, setNotifications] = useState<NotificationDto[]>([]);
//     const [unreadCount, setUnreadCount] = useState(0);
//     const [isLoading, setIsLoading] = useState(false);
//     const [isLoadingMore, setIsLoadingMore] = useState(false);
//     const [hasMore, setHasMore] = useState(false);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [connectionStatus, setConnectionStatus] = useState<
//         'connected' | 'connecting' | 'disconnected'
//     >('disconnected');

//     const connectionRef = useRef<signalR.HubConnection | null>(null);
//     const isMountedRef = useRef(true);

//     // ── Fetch initial notifications + unread count ────────────────────────────

//     const fetchInitial = useCallback(async () => {
//         if (!isAuthenticated) return;
//         setIsLoading(true);
//         try {
//             const [page, count] = await Promise.all([
//                 getUserNotifications({ pageNumber: 1, pageSize: PAGE_SIZE }),
//                 getUnreadCount(),
//             ]);
//             if (!isMountedRef.current) return;
//             setNotifications(page.data);
//             setCurrentPage(1);
//             setHasMore(page.totalPages > 1);
//             setUnreadCount(count);
//         } catch {
//             // non-critical: silently fail
//         } finally {
//             if (isMountedRef.current) setIsLoading(false);
//         }
//     }, [isAuthenticated]);

//     // ── Refresh unread count ──────────────────────────────────────────────────

//     const refreshUnreadCount = useCallback(async () => {
//         if (!isAuthenticated) return;
//         try {
//             const count = await getUnreadCount();
//             if (isMountedRef.current) setUnreadCount(count);
//         } catch {
//             // non-critical
//         }
//     }, [isAuthenticated]);

//     // ── Load more pages ───────────────────────────────────────────────────────

//     const loadMore = useCallback(async () => {
//         if (!hasMore || isLoadingMore) return;
//         setIsLoadingMore(true);
//         const nextPage = currentPage + 1;
//         try {
//             const page = await getUserNotifications({ pageNumber: nextPage, pageSize: PAGE_SIZE });
//             if (!isMountedRef.current) return;
//             setNotifications((prev) => {
//                 // deduplicate by id
//                 const existingIds = new Set(prev.map((n) => n.id));
//                 const fresh = page.data.filter((n) => !existingIds.has(n.id));
//                 return [...prev, ...fresh];
//             });
//             setCurrentPage(nextPage);
//             setHasMore(nextPage < page.totalPages);
//         } catch {
//             // ignore
//         } finally {
//             if (isMountedRef.current) setIsLoadingMore(false);
//         }
//     }, [hasMore, isLoadingMore, currentPage]);

//     // ── Mark single as read ───────────────────────────────────────────────────

//     const markAsRead = useCallback(async (id: string) => {
//         // Optimistic update
//         setNotifications((prev) =>
//             prev.map((n) =>
//                 n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
//             )
//         );
//         setUnreadCount((prev) => Math.max(0, prev - 1));

//         try {
//             await markNotificationAsRead(id);
//         } catch {
//             // Revert on failure
//             setNotifications((prev) =>
//                 prev.map((n) => (n.id === id ? { ...n, isRead: false, readAt: null } : n))
//             );
//             setUnreadCount((prev) => prev + 1);
//         }
//     }, []);

//     // ── Mark all as read ──────────────────────────────────────────────────────

//     const markAllAsRead = useCallback(async () => {
//         const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
//         if (unreadIds.length === 0) return;

//         // Optimistic update
//         setNotifications((prev) =>
//             prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
//         );
//         setUnreadCount(0);

//         // Fire-and-forget each (no bulk endpoint on backend)
//         await Promise.allSettled(unreadIds.map((id) => markNotificationAsRead(id)));
//         // Refresh count from server to reconcile
//         refreshUnreadCount();
//     }, [notifications, refreshUnreadCount]);

//     // ── SignalR connection ────────────────────────────────────────────────────

//     useEffect(() => {
//         if (authLoading || !isAuthenticated) {
//             // Clean up existing connection
//             if (connectionRef.current) {
//                 connectionRef.current.stop();
//                 connectionRef.current = null;
//                 setConnectionStatus('disconnected');
//             }
//             return;
//         }

//         let cancelled = false;

//         const connection = new signalR.HubConnectionBuilder()
//             .withUrl(HUB_URL, {
//                 withCredentials: true,
//             })
//             .withAutomaticReconnect()
//             .configureLogging(signalR.LogLevel.Warning)
//             .build();

//         connection.onreconnecting(() => {
//             if (!cancelled) setConnectionStatus('connecting');
//         });
//         connection.onreconnected(() => {
//             if (!cancelled) setConnectionStatus('connected');
//         });
//         connection.onclose(() => {
//             if (!cancelled) setConnectionStatus('disconnected');
//         });

//         // Handle incoming real-time notifications
//         connection.on('ReceiveNotification', (notif: NotificationDto) => {
//             if (cancelled) return;
//             setNotifications((prev) => {
//                 // Don't duplicate if already present
//                 if (prev.some((n) => n.id === notif.id)) return prev;
//                 return [notif, ...prev];
//             });
//             if (!notif.isRead) {
//                 setUnreadCount((prev) => prev + 1);
//             }
//         });

//         connectionRef.current = connection;
//         setConnectionStatus('connecting');

//         connection
//             .start()
//             .then(() => {
//                 if (!cancelled) setConnectionStatus('connected');
//             })
//             .catch(() => {
//                 if (!cancelled) setConnectionStatus('disconnected');
//             });

//         return () => {
//             cancelled = true;
//             connection.stop();
//             connectionRef.current = null;
//         };
//     }, [isAuthenticated, authLoading]);

//     // ── Initial fetch when authenticated ─────────────────────────────────────

//     useEffect(() => {
//         if (!authLoading && isAuthenticated) {
//             fetchInitial();
//         } else if (!isAuthenticated) {
//             setNotifications([]);
//             setUnreadCount(0);
//             setCurrentPage(1);
//             setHasMore(false);
//         }
//     }, [isAuthenticated, authLoading, fetchInitial]);

//     // ── Cleanup ───────────────────────────────────────────────────────────────

//     useEffect(() => {
//         isMountedRef.current = true;
//         return () => {
//             isMountedRef.current = false;
//         };
//     }, []);

//     return (
//         <NotificationContext.Provider
//             value={{
//                 notifications,
//                 unreadCount,
//                 isLoading,
//                 isLoadingMore,
//                 hasMore,
//                 connectionStatus,
//                 markAsRead,
//                 markAllAsRead,
//                 loadMore,
//                 refreshUnreadCount,
//             }}
//         >
//             {children}
//         </NotificationContext.Provider>
//     );
// }

// // ── Hook ──────────────────────────────────────────────────────────────────────

// // eslint-disable-next-line react-refresh/only-export-components
// export function useNotifications(): NotificationContextType {
//     const ctx = useContext(NotificationContext);
//     if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
//     return ctx;
// }
