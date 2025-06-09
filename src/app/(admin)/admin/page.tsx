export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
          <p className="mt-2 text-3xl font-semibold text-white">0</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Active Novels</h3>
          <p className="mt-2 text-3xl font-semibold text-white">0</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Total Chapters</h3>
          <p className="mt-2 text-3xl font-semibold text-white">0</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400">Active Subscriptions</h3>
          <p className="mt-2 text-3xl font-semibold text-white">0</p>
        </div>
      </div>
    </div>
  )
}
