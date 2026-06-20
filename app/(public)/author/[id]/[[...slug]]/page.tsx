import { Suspense } from 'react';
import Component from '@/pages-content/dashboard/author/AuthorDetail';
import type { Metadata } from 'next';
import { API_BASE_URL } from '@/services/api.config';
import { toBookNameSlug } from '@/utils/stringUtils';

interface PageProps {
  params: Promise<{ id: string; slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!id) {
    return {
      title: { absolute: 'Author Not Found' },
      robots: 'noindex, follow',
    };
  }

  const cleanId = /^0+\d+$/.test(id) ? parseInt(id, 10).toString() : id;

  try {
    const res = await fetch(`${API_BASE_URL}/api/book-chapter-publishing/authors/${cleanId}`);
    if (!res.ok) {
      return {
        title: { absolute: 'Author Not Found' },
        robots: 'noindex, follow',
      };
    }
    const body = await res.json();
    const author = body.data;
    if (!author) {
      return {
        title: { absolute: 'Author Not Found' },
        robots: 'noindex, follow',
      };
    }

    const description = author.biography
      ? author.biography.replace(/\n/g, ' ').slice(0, 155)
      : `${author.name} is a verified academic author published by BR Publications${author.affiliation ? `, affiliated with ${author.affiliation}` : ''}.`;

    const nameSlug = author.name ? toBookNameSlug(author.name) : '';
    const canonical = `https://www.brpublications.com/author/${author.id}/${nameSlug}`;
    const title = `${author.name} - Author Profile | BR Publications`;
    const profileImage = author.profilePicture || author.profileImage || null;

    // Keywords: name + affiliation + role
    const keywords = [
      author.name,
      author.affiliation,
      'academic author',
      'book author',
      'BR Publications',
      'BR ResNova',
    ].filter(Boolean).join(', ');

    return {
      title: {
        absolute: title
      },
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        type: 'profile',
        url: canonical,
        ...(profileImage ? { images: [{ url: profileImage }] } : {}),
      },
      twitter: {
        card: profileImage ? 'summary_large_image' : 'summary',
        title,
        description,
        ...(profileImage ? { images: [profileImage] } : {}),
      },
      other: {
        'keywords': keywords,
        // Google Scholar citation tag for author identity
        'citation_author': author.name,
        ...(author.affiliation ? { 'citation_author_institution': author.affiliation } : {}),
        // Dublin Core
        'dc.creator': author.name,
        ...(author.affiliation ? { 'dc.contributor': author.affiliation } : {}),
        'dc.publisher': 'BR Publications',
        'dc.type': 'Person',
        'dc.language': 'en',
        'dc.description': description,
        'dc.identifier': canonical,
      }
    };
  } catch (error) {
    console.error("Author metadata resolution failed:", error);
    return {
      title: { absolute: 'Author Profile | BR Publications' }
    };
  }
}

export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <Component />
    </Suspense>
  );
}
