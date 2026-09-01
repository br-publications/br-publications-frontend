import { Suspense } from 'react';
import Component from '@/pages-content/dashboard/editor/EditorDetail';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_BASE_URL } from '@/services/api.config';
import { toBookNameSlug } from '@/utils/stringUtils';

interface PageProps {
  params: Promise<{ id: string; slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!id) {
    notFound();
  }

  const cleanId = /^0+\d+$/.test(id) ? parseInt(id, 10).toString() : id;

  try {
    const res = await fetch(`${API_BASE_URL}/api/book-chapter-publishing/editors/${cleanId}`);
    if (!res.ok) {
      notFound();
    }
    const body = await res.json();
    const editor = body.data || body;
    if (!editor || !editor.name) {
      notFound();
    }

    const description = editor.biography
      ? editor.biography.replace(/\n/g, ' ').slice(0, 155)
      : `${editor.name} is a verified academic editor at BR Publications${editor.affiliation ? `, affiliated with ${editor.affiliation}` : ''}.`;

    const nameSlug = editor.name ? toBookNameSlug(editor.name) : '';
    const canonical = `https://www.brpublications.com/editor/${editor.id}/${nameSlug}`;
    const title = `${editor.name} - Editorial Profile | BR Publications`;
    const profileImage = editor.profilePicture || editor.profileImage || null;

    // Keywords: name + affiliation + role
    const keywords = [
      editor.name,
      editor.affiliation,
      'academic editor',
      'book editor',
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
        // Google Scholar citation tag for editorial identity
        'citation_author': editor.name,
        ...(editor.affiliation ? { 'citation_author_institution': editor.affiliation } : {}),
        // Dublin Core
        'dc.creator': editor.name,
        ...(editor.affiliation ? { 'dc.contributor': editor.affiliation } : {}),
        'dc.publisher': 'BR Publications',
        'dc.type': 'Person',
        'dc.language': 'en',
        'dc.description': description,
        'dc.identifier': canonical,
      }
    };
  } catch (error) {
    console.error("Editor metadata resolution failed:", error);
    return {
      title: { absolute: 'Editor Profile | BR Publications' }
    };
  }
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const slug = resolvedParams.slug;
  const currentSlugStr = slug ? slug.join('/') : '';

  let editorData = null;

  if (id) {
    const cleanId = /^0+\d+$/.test(id) ? parseInt(id, 10).toString() : id;
    try {
      const res = await fetch(`${API_BASE_URL}/api/book-chapter-publishing/editors/${cleanId}`);
      if (!res.ok) {
        notFound();
      }
      const body = await res.json();
      editorData = body.data || body;
      
      if (!editorData || !editorData.name) {
        notFound();
      }
      
      const nameSlug = editorData.name ? toBookNameSlug(editorData.name) : '';
      if (id !== String(editorData.id) || currentSlugStr !== nameSlug) {
        const { permanentRedirect } = await import('next/navigation');
        const canonicalUrl = nameSlug ? `/editor/${editorData.id}/${nameSlug}` : `/editor/${editorData.id}`;
        permanentRedirect(canonicalUrl);
      }
    } catch (e) {
      if ((e as any).digest === 'NEXT_REDIRECT' || (e as any).digest === 'NEXT_NOT_FOUND') {
        throw e;
      }
      notFound();
    }
  }

  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <Component initialData={editorData} />
    </Suspense>
  );
}
