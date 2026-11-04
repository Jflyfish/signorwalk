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
    alternates: { canonical: `https://signorwalk.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `https://signorwalk.com/blog/${post.slug}`,
      publishedTime: post.date,
      siteName: 'Sign or Walk',
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_DEAL_SUPPORT_LINK;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'Sign or Walk', url: 'https://signorwalk.com' },
    publisher: { '@type': 'Organization', name: 'Sign or Walk', url: 'https://signorwalk.com' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://signorwalk.com/blog/${post.slug}` },
  };

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 py-10 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-5 leading-[1.1]">{post.title}</h1>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
        >
          Grade My Deal — Free →
        </Link>
        <a
          href={stripeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
        >
          Ask a Pro — $19 →
        </a>
      </div>

      <div className="[&_figure]:mb-2 [&_figcaption]:text-xs [&_figcaption]:text-gray-400">
        <post.Content />
      </div>

      <div className="mt-14 pt-8 border-t border-gray-100 space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <p className="text-base font-bold text-gray-900 mb-1">Grade your deal — free</p>
          <p className="text-base text-gray-500 mb-4 leading-relaxed">Upload your quote and get an A–F grade, every red flag, and a negotiation script in 30 seconds.</p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all"
          >
            Grade My Deal — Free →
          </Link>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6">
          <p className="text-base font-bold text-white mb-1">Deal coming back a C, D, or F?</p>
          <p className="text-base text-gray-400 mb-4 leading-relaxed">A former dealership insider reviews your numbers and emails you exactly what to say — word for word. $19. Save $250+ or your money back.</p>
          <a
            href={stripeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all"
          >
            Ask a Pro — $19 →
          </a>
          <p className="text-xs text-gray-500 mt-3">
            <Link href="/ask-a-pro" className="underline hover:text-gray-400">How it works →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
