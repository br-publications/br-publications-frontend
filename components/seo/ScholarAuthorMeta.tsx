import React from 'react';

export interface ScholarAuthor {
  name: string;
  affiliation?: string;
}

/**
 * Emits <meta name="citation_author"> followed immediately by its
 * <meta name="citation_author_institution">. Google Scholar pairs an institution
 * with the author tag that precedes it, so the order must be interleaved.
 * Next's metadata `other` field groups tags by key and cannot do this.
 * React 19 hoists <meta> elements rendered in a server component into <head>.
 */
export default function ScholarAuthorMeta({ authors }: { authors: ScholarAuthor[] }) {
  return (
    <>
      {authors.filter(a => a.name).map((a, i) => (
        <React.Fragment key={`${a.name}-${i}`}>
          <meta name="citation_author" content={a.name.trim()} />
          {a.affiliation && a.affiliation.trim() && (
            <meta
              name="citation_author_institution"
              content={a.affiliation.trim().replace(/^\((.*)\)$/, '$1').trim()}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
}
