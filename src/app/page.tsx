export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Sales Invoice Management
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Manage your sales invoices with ease. Create, edit, and track your invoices all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Create Invoice
          </h3>
          <p className="text-gray-600 mb-4">
            Create new sales invoices with customer details and line items.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            View Invoices
          </h3>
          <p className="text-gray-600 mb-4">
            Browse and filter your existing invoices by date and status.
          </p>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            View All
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Manage Files
          </h3>
          <p className="text-gray-600 mb-4">
            Upload and manage file attachments for your invoices.
          </p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}