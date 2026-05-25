import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { blogPosts, getPost } from '@/lib/blogPosts';

export function generateStaticParams() {
  return blogPosts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Sign or Walk`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 py-10 sm:py-16">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-8">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All posts
      </Link>

      <div className="flex items-center gap-2 mb-5">
        <span className="text-sm text-gray-400">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        <span className="text-gray-200">·</span>
        <span className="text-sm text-gray-400">{post.readTime}</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-8 leading-[1.1]">{post.title}</h1>

      <div className="[&_figure]:mb-2 [&_figcaption]:text-xs [&_figcaption]:text-gray-400">
        <post.Content />
      </div>

      <div className="mt-14 pt-8 border-t border-gray-100">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <p className="text-base font-bold text-gray-900 mb-1">Grade your deal — free</p>
          <p className="text-base text-gray-500 mb-5 leading-relaxed">Upload your quote and get an A–F grade, every red flag, and a negotiation script in 30 seconds.</p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all"
          >
            Grade My Deal — Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
