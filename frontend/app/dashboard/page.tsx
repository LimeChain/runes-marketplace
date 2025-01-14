import { Profile } from "@/components/profile"
import { AssetsTable } from "@/components/assets-table"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Profile />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AssetsTable />
      </div>
    </div>
  )
}

