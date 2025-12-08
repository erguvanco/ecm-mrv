// DashboardMap is NOT exported here because it uses mapbox-gl which requires dynamic import with ssr: false
// Use: nextDynamic(() => import('@/components/dashboard/dashboard-map').then(mod => mod.DashboardMap), { ssr: false })
export { DashboardChart } from './dashboard-chart';
