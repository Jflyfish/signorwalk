import Link from 'next/link';
import type { Metadata } from 'next';
import { blogPosts } from '@/lib/blogPosts';

export const metadata: Metadata = {
  title: 'Blog — Sign or Walk',
  description: 'Car buying tips, deal breakdowns, and negotiation tactics from the Sign or Walk team.',
};

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-10">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">From the team</p>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Blog</h1>
        <p className="text-gray-500 text-base">Car buying tips, deal breakdowns, and negotiation tactics.</p>
      </div>

      <div className="space-y-4">
        {blogPosts.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-blue-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">{post.readTime}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{post.excerpt}</p>
            <p className="text-sm font-semibold text-blue-600 mt-3">Read more →</p>
          </Link>
        ))}
      </div>

      {blogPosts.length === 0 && (
        <p className="text-gray-400 text-sm">No posts yet — check back soon.</p>
      )}
    </div>
  );
}
