export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>
          404 - Not Found
        </h1>
        <p className='text-gray-600 mb-8'>
          The page you're looking for doesn't exist.
        </p>
        <a
          href='/'
          className='inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors'
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
