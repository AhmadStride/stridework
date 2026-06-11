export default function Loading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 space-y-4 animate-pulse">
      <div className="h-7 w-32 bg-gray-100 rounded-lg" />
      <div className="h-4 w-48 bg-gray-100 rounded" />
      <div className="space-y-3 mt-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
